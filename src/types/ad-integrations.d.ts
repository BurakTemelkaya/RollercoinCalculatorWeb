export {};

declare global {
  interface Window {
    coinzilla_display?: Array<{ zone: string; width: string; height: string }>;
    gtag?: (...args: unknown[]) => void;
    __cleverCoreNoFill?: boolean;
    __cleverCoreNoFillReason?: string;
  }
}
