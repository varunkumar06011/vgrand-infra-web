/**
 * Browser-side helpers for knowing where a visitor came from and what they clicked.
 *
 * - First-touch source (utm_*, ad click ids, referrer, landing page) is kept for 90 days in the
 *   `vg_src` cookie. Being a cookie, it reaches every API route on its own, so lead routes can
 *   attach it to the lead without any change to the forms.
 * - `track()` sends one small event to /api/track with sendBeacon, so a click that leaves the
 *   page (tel:, WhatsApp, Maps) is still delivered.
 *
 * Everything here is best effort: storage or network failures never break the page.
 */

export const SOURCE_COOKIE = 'vg_src';
const SOURCE_DAYS = 90;
const SESSION_KEY = 'vg_sid';

export type VisitorSource = {
  /** utm_source, or google_ads / facebook_ads from the click id, or the referring site, or "direct" */
  s: string;
  m?: string;
  c?: string;
  /** referring host */
  r?: string;
  /** landing page path */
  l: string;
  /** first visit time (ISO) */
  t: string;
};

function readCookie(name: string): string | null {
  try {
    const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

/** Save where this visitor first came from, once; later visits keep the first source. */
export function captureSource(): void {
  try {
    if (readCookie(SOURCE_COOKIE)) return;
    const q = new URLSearchParams(window.location.search);
    let ref = '';
    try {
      ref = document.referrer ? new URL(document.referrer).hostname : '';
    } catch {
      ref = '';
    }
    if (ref === window.location.hostname) ref = '';

    const clickSource = q.get('gclid') ? 'google_ads' : q.get('fbclid') ? 'facebook_ads' : '';
    const src: VisitorSource = {
      s: (q.get('utm_source') || clickSource || ref || 'direct').slice(0, 60),
      l: window.location.pathname.slice(0, 120),
      t: new Date().toISOString(),
    };
    const m = q.get('utm_medium') || (clickSource ? 'cpc' : '');
    const c = q.get('utm_campaign');
    if (m) src.m = m.slice(0, 60);
    if (c) src.c = c.slice(0, 100);
    if (ref) src.r = ref.slice(0, 120);

    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${SOURCE_COOKIE}=${encodeURIComponent(JSON.stringify(src))}; Max-Age=${SOURCE_DAYS * 86400}; Path=/; SameSite=Lax${secure}`;
  } catch {
    /* cookies blocked: leads just won't carry a source */
  }
}

/** one id per browser tab session, to group a visitor's clicks */
export function sessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'no-session';
  }
}

export type TrackEvent = {
  /** e.g. call_click, whatsapp_click, form_submit, 3d_open */
  event: string;
  label?: string;
  href?: string;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track({ event, label, href }: TrackEvent): void {
  try {
    const body = JSON.stringify({
      event,
      label: label?.slice(0, 120),
      href: href?.slice(0, 300),
      page: window.location.pathname.slice(0, 200),
      session: sessionId(),
    });
    const sent = navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }));
    if (!sent) {
      void fetch('/api/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
    // also show up in Google Analytics when GA is configured
    window.gtag?.('event', event, { event_label: label, link_url: href });
  } catch {
    /* never block a click */
  }
}
