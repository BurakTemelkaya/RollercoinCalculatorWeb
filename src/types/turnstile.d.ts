export {};

declare global {
    interface TurnstileOptions {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        size?: 'normal' | 'compact' | 'flexible';
        theme?: 'light' | 'dark' | 'auto';
        execution?: 'render' | 'execute';
        appearance?: 'always' | 'execute' | 'interaction-only';
        action?: string;
        cData?: string;
    }

    interface Turnstile {
        render(container: HTMLElement | string, options: TurnstileOptions): string;
        execute(widgetId?: string): void;
        reset(widgetId?: string): void;
        getResponse(widgetId?: string): string;
    }

    interface Window {
        turnstile?: Turnstile;
    }
}
