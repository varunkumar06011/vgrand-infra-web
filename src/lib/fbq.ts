// Safe wrapper around the Meta Pixel. No-ops if the pixel isn't loaded
// (no NEXT_PUBLIC_FB_PIXEL_ID, ad blocker, SSR).
export function trackFb(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
  if (typeof fbq !== 'function') return;
  try {
    if (params) fbq('track', event, params);
    else fbq('track', event);
  } catch {
    /* never break the UI over analytics */
  }
}
