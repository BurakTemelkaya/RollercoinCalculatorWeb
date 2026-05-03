const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

const TURNSTILE_TOKEN_KEY = 'rollercoin_web_turnstile_token';
const TURNSTILE_TOKEN_TS_KEY = 'rollercoin_web_turnstile_token_ts';
const TURNSTILE_TOKEN_TTL_MS = 4 * 60 * 1000;
const TURNSTILE_AUTO_RETRY_DELAY_MS = 1000;
const TURNSTILE_AUTO_RETRY_MAX = 3;

export const TURNSTILE_HEADER_NAME = 'cf-turnstile-response';

export type TurnstileState = 'idle' | 'verifying' | 'verified' | 'error';

type TurnstileExecutor = {
    execute: () => void;
    reset: () => void;
    getResponse: () => string | null | undefined;
};

let executor: TurnstileExecutor | null = null;
let isReady = false;
let readyPromise: Promise<void> | null = null;
let readyResolve: (() => void) | null = null;

let currentState: TurnstileState = 'idle';
const stateListeners = new Set<(state: TurnstileState) => void>();

let tokenPromise: Promise<string> | null = null;
let pendingResolve: ((token: string) => void) | null = null;
let pendingReject: ((error: Error) => void) | null = null;
let autoRetryCount = 0;
let autoRetryTimer: number | null = null;

function setState(next: TurnstileState) {
    if (currentState === next) return;
    currentState = next;
    stateListeners.forEach((listener) => listener(currentState));
}

export function subscribeTurnstileState(listener: (state: TurnstileState) => void) {
    stateListeners.add(listener);
    listener(currentState);
    return () => {
        stateListeners.delete(listener);
    };
}

export function registerTurnstileExecutor(next: TurnstileExecutor | null) {
    executor = next;
}

export function markTurnstileLoaded() {
    isReady = true;
    if (readyResolve) {
        readyResolve();
        readyResolve = null;
        readyPromise = null;
    }
}

function clearAutoRetry() {
    if (typeof window === 'undefined') {
        autoRetryTimer = null;
        return;
    }
    if (autoRetryTimer !== null) {
        window.clearTimeout(autoRetryTimer);
        autoRetryTimer = null;
    }
}

function scheduleAutoRetry() {
    if (typeof window === 'undefined') return;
    if (autoRetryCount >= TURNSTILE_AUTO_RETRY_MAX) return;

    autoRetryCount += 1;
    clearAutoRetry();
    autoRetryTimer = window.setTimeout(() => {
        setState('verifying');
        void getTurnstileToken();
    }, TURNSTILE_AUTO_RETRY_DELAY_MS);
}

function canUseStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isReactSnap(): boolean {
    return typeof navigator !== 'undefined' && navigator.userAgent.includes('ReactSnap');
}

function getSiteKey(): string | null {
    if (typeof TURNSTILE_SITE_KEY !== 'string') return null;
    const trimmed = TURNSTILE_SITE_KEY.trim();
    return trimmed ? trimmed : null;
}

function waitForReady(timeoutMs: number = 5000): Promise<boolean> {
    if (isReady) return Promise.resolve(true);
    if (!readyPromise) {
        readyPromise = new Promise((resolve) => {
            readyResolve = resolve;
        });
    }

    return new Promise((resolve) => {
        const timer = setTimeout(() => resolve(false), timeoutMs);
        readyPromise
            ?.then(() => {
                clearTimeout(timer);
                resolve(true);
            })
            .catch(() => resolve(false));
    });
}

function waitForExecutor(timeoutMs: number = 5000): Promise<TurnstileExecutor | null> {
    if (executor) return Promise.resolve(executor);
    if (typeof window === 'undefined') return Promise.resolve(null);

    return new Promise((resolve) => {
        const start = Date.now();
        const interval = window.setInterval(() => {
            if (executor) {
                window.clearInterval(interval);
                resolve(executor);
                return;
            }

            if (Date.now() - start > timeoutMs) {
                window.clearInterval(interval);
                resolve(null);
            }
        }, 50);
    });
}

function getCachedToken(): string | null {
    if (!canUseStorage()) return null;
    const token = localStorage.getItem(TURNSTILE_TOKEN_KEY);
    const ts = localStorage.getItem(TURNSTILE_TOKEN_TS_KEY);
    if (!token || !ts) return null;

    const lastSaved = Number(ts);
    if (!Number.isFinite(lastSaved)) {
        localStorage.removeItem(TURNSTILE_TOKEN_KEY);
        localStorage.removeItem(TURNSTILE_TOKEN_TS_KEY);
        return null;
    }

    if (Date.now() - lastSaved > TURNSTILE_TOKEN_TTL_MS) {
        localStorage.removeItem(TURNSTILE_TOKEN_KEY);
        localStorage.removeItem(TURNSTILE_TOKEN_TS_KEY);
        return null;
    }

    return token;
}

function setCachedToken(token: string) {
    if (!canUseStorage()) return;
    localStorage.setItem(TURNSTILE_TOKEN_KEY, token);
    localStorage.setItem(TURNSTILE_TOKEN_TS_KEY, String(Date.now()));
}

function clearCachedToken() {
    if (!canUseStorage()) return;
    localStorage.removeItem(TURNSTILE_TOKEN_KEY);
    localStorage.removeItem(TURNSTILE_TOKEN_TS_KEY);
}

function resetPending() {
    pendingResolve = null;
    pendingReject = null;
    tokenPromise = null;
}

function handleToken(token: string) {
    setCachedToken(token);
    setState('verified');
    autoRetryCount = 0;
    clearAutoRetry();
    if (pendingResolve) {
        pendingResolve(token);
    }
    resetPending();
}

function handleError() {
    clearCachedToken();
    if (executor) {
        executor.reset();
    }
    setState('error');
    scheduleAutoRetry();
    if (pendingReject) {
        pendingReject(new Error('Turnstile challenge failed'));
    }
    resetPending();
}

function handleExpired() {
    clearCachedToken();
    if (executor) {
        executor.reset();
    }
    setState('idle');
    resetPending();
}

export function setTurnstileToken(token: string) {
    handleToken(token);
}

export function setTurnstileError() {
    handleError();
}

export function setTurnstileExpired() {
    handleExpired();
}

export function invalidateTurnstileToken() {
    clearCachedToken();
    if (executor) {
        executor.reset();
    }
    autoRetryCount = 0;
    clearAutoRetry();
    if (isReactSnap()) {
        setState('verified');
        return;
    }
    setState('verifying');
    void getTurnstileToken();
}

export async function getTurnstileToken(): Promise<string | null> {
    const cached = getCachedToken();
    if (cached) {
        setState('verified');
        autoRetryCount = 0;
        clearAutoRetry();
        return cached;
    }

    if (typeof window === 'undefined') return null;
    if (isReactSnap()) {
        setState('verified');
        return null;
    }
    if (!getSiteKey()) {
        setState('error');
        return null;
    }

    setState('verifying');
    clearAutoRetry();

    const activeExecutor = await waitForExecutor();
    if (!activeExecutor) {
        setState('error');
        return null;
    }

    const ready = await waitForReady();
    if (!ready) {
        setState('error');
        return null;
    }

    if (tokenPromise) {
        try {
            const token = await tokenPromise;
            setState('verified');
            return token;
        } catch {
            setState('error');
            return null;
        }
    }

    tokenPromise = new Promise<string>((resolve, reject) => {
        pendingResolve = resolve;
        pendingReject = reject;
        try {
            activeExecutor.execute();
        } catch (error) {
            resetPending();
            setState('error');
            const err = error instanceof Error ? error : new Error('Turnstile execution failed');
            reject(err);
        }
    });

    try {
        const token = await tokenPromise;
        setState('verified');
        return token;
    } catch {
        setState('error');
        return null;
    }
}
