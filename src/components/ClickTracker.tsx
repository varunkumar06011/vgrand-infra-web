'use client';

import { useEffect } from 'react';
import { captureSource, track } from '@/lib/visitor';

/** Work out what kind of click this is from the link or button itself. */
function classify(el: HTMLElement): { event: string; href?: string } {
  const tagged = el.getAttribute('data-track');
  const href = el instanceof HTMLAnchorElement ? el.getAttribute('href') || undefined : undefined;
  if (tagged) return { event: tagged, href };
  if (href) {
    if (href.startsWith('tel:')) return { event: 'call_click', href };
    if (href.startsWith('mailto:')) return { event: 'email_click', href };
    if (/wa\.me|whatsapp\.com/i.test(href)) return { event: 'whatsapp_click', href };
    if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(href)) return { event: 'directions_click', href };
    if (/\.pdf($|\?)/i.test(href)) return { event: 'brochure_click', href };
    if (/^https?:\/\//i.test(href) && !href.includes(window.location.host)) return { event: 'outbound_click', href };
    return { event: 'link_click', href };
  }
  return { event: 'button_click' };
}

function labelOf(el: HTMLElement): string {
  const own = el.getAttribute('data-track-label') || el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || '';
  return own.replace(/\s+/g, ' ').trim().slice(0, 120);
}

/**
 * Records every link / button click, form submit and 3D-walkthrough open on the public site,
 * and remembers where the visitor first came from (see lib/visitor.ts).
 * Mounted once in the root layout; not mounted on /admin.
 */
export default function ClickTracker() {
  useEffect(() => {
    captureSource();

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('a, button, [data-track]');
      if (!el || el.closest('[data-no-track]')) return;
      const { event, href } = classify(el);
      track({ event, label: labelOf(el), href });
    };

    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form) return;
      const name = form.getAttribute('data-track-label') || form.getAttribute('name') || form.getAttribute('aria-label') || form.id || 'form';
      track({ event: 'form_submit', label: name });
    };

    const on3d = (e: Event) => {
      if ((e as CustomEvent).detail === true) track({ event: '3d_open', label: document.title });
    };

    document.addEventListener('click', onClick, { capture: true });
    document.addEventListener('submit', onSubmit, { capture: true });
    window.addEventListener('flat3d:open', on3d);
    return () => {
      document.removeEventListener('click', onClick, { capture: true });
      document.removeEventListener('submit', onSubmit, { capture: true });
      window.removeEventListener('flat3d:open', on3d);
    };
  }, []);

  return null;
}
