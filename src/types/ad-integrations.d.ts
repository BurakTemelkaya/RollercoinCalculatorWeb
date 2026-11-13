export {};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __cleverCoreNoFill?: boolean;
    __cleverCoreNoFillReason?: string;
  }
}
