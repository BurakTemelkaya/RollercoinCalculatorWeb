import { getTurnstileToken, invalidateTurnstileToken, TURNSTILE_HEADER_NAME } from './turnstile';

/**
 * Centralized API Client
 *
 * Provides a unified fetch wrapper with automatic JSON parsing,
 * error handling, and rate limit detection.
 * Replaces repeated try/catch + response.ok patterns across all services.
 */

/**
 * Custom API error with status code and optional detail message
 */
export class ApiError extends Error {
    status: number;
    detail?: string;

    constructor(status: number, statusText: string, detail?: string) {
        const message = detail || `API request failed: ${status} ${statusText}`;
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
    }

    get isRateLimit(): boolean {
        return this.status === 429;
    }

    get isForbidden(): boolean {
        return this.status === 403;
    }
}

/**
 * Low-level fetch wrapper that handles common error patterns.
 * Returns the raw Response object for custom processing.
 *
 * @throws ApiError on non-ok responses (with detail parsing for JSON error bodies)
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
    try {
        // Skip API calls during react-snap to prevent 30,000ms timeouts
        if (typeof navigator !== 'undefined' && navigator.userAgent.includes('ReactSnap')) {
            throw new Error("Skipping API fetch during react-snap build");
        }

        const savedLang = localStorage.getItem('rollercoin_web_language');
        const appLang = savedLang === 'en' ? 'en' : 'tr';
        const acceptLanguage = appLang === 'en'
            ? 'en-US,en;q=0.9,tr;q=0.8'
            : 'tr-TR,tr;q=0.9,en;q=0.8';

        // Force API locale to follow in-app language selection.
        const headers = new Headers(options?.headers);
        headers.set('Accept-Language', acceptLanguage);

        const turnstileToken = await getTurnstileToken();
        headers.set(TURNSTILE_HEADER_NAME, turnstileToken || '');

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            if (response.status === 403) {
                invalidateTurnstileToken();
            }
            if (response.status === 429) {
                throw new ApiError(429, 'Too Many Requests');
            }

            // Try to extract detail from JSON error body
            let detail: string | undefined;
            try {
                const errorData = await response.json();
                if (errorData?.detail) {
                    detail = errorData.detail;
                }
            } catch {
                // JSON parsing failed, use default message
            }

            throw new ApiError(response.status, response.statusText, detail);
        }

        return response;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        // Skip logging if this is our intentional ReactSnap abort
        if (error instanceof Error && error.message.includes('ReactSnap')) {
            throw error;
        }
        // Network errors, CORS, etc.
        console.error('API fetch error:', error);
        throw error;
    }
}

/**
 * GET request with automatic JSON parsing.
 * Use this for most API calls.
 *
 * @throws ApiError on non-ok responses
 */
export async function apiGet<T>(url: string): Promise<T> {
    const response = await apiFetch(url);
    return response.json() as Promise<T>;
}
