import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import {
    getTurnstileToken,
    markTurnstileLoaded,
    registerTurnstileExecutor,
    setTurnstileError,
    setTurnstileExpired,
    setTurnstileToken,
    subscribeTurnstileState,
    TurnstileState,
} from '../services/turnstile';

export default function TurnstileProvider() {
    const turnstileRef = useRef<TurnstileInstance | null>(null);
    const { t } = useTranslation();
    const [state, setState] = useState<TurnstileState>('idle');
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
    const hasSiteKey = siteKey.trim().length > 0;
    const isReactSnap = typeof navigator !== 'undefined' && navigator.userAgent.includes('ReactSnap');

    const isBlocking = state === 'verifying' || state === 'error';

    useEffect(() => {
        if (isReactSnap) return;
        return subscribeTurnstileState(setState);
    }, [isReactSnap]);

    useEffect(() => {
        if (isReactSnap) return;
        registerTurnstileExecutor({
            execute: () => {
                if (!turnstileRef.current) {
                    throw new Error('Turnstile widget not ready');
                }
                turnstileRef.current.execute();
            },
            reset: () => turnstileRef.current?.reset(),
            getResponse: () => turnstileRef.current?.getResponse(),
        });

        return () => registerTurnstileExecutor(null);
    }, [isReactSnap]);

    useEffect(() => {
        if (isReactSnap) return;
        if (typeof document === 'undefined') return;
        const previous = document.body.style.overflow;
        if (isBlocking) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isBlocking, isReactSnap]);

    if (isReactSnap) return null;

    return (
        <div
            aria-hidden={!isBlocking}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200000,
                display: isBlocking ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: 'rgba(10, 12, 20, 0.86)',
                backdropFilter: 'blur(4px)',
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    background: 'rgba(15, 23, 42, 0.95)',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
                    textAlign: 'center',
                    color: '#e2e8f0',
                }}
            >
                <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                    {t('turnstile.title')}
                </div>
                <div style={{ fontSize: '14px', color: '#cbd5f5', marginBottom: '16px' }}>
                    {state === 'error' ? t('turnstile.error') : t('turnstile.desc')}
                </div>
                {hasSiteKey ? (
                    <Turnstile
                        ref={turnstileRef}
                        siteKey={siteKey}
                        options={{
                            execution: 'execute',
                            appearance: 'always',
                            size: 'normal',
                            responseField: false,
                        }}
                        onWidgetLoad={markTurnstileLoaded}
                        onSuccess={setTurnstileToken}
                        onExpire={setTurnstileExpired}
                        onError={() => setTurnstileError()}
                        onUnsupported={() => setTurnstileError()}
                        scriptOptions={{
                            nonce: typeof document !== 'undefined' ? document.querySelector('script[nonce]')?.getAttribute('nonce') || undefined : undefined,
                            onError: () => setTurnstileError(),
                        }}
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            minHeight: '65px',
                        }}
                    />
                ) : null}
                {state === 'error' ? (
                    <button
                        type="button"
                        onClick={() => void getTurnstileToken()}
                        style={{
                            marginTop: '16px',
                            padding: '10px 16px',
                            borderRadius: '10px',
                            border: '1px solid rgba(148, 163, 184, 0.45)',
                            background: '#4f46e5',
                            color: '#fff',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        {t('turnstile.retry')}
                    </button>
                ) : null}
            </div>
        </div>
    );
}
