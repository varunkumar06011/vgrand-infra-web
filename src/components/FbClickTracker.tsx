'use client';

import { useEffect } from 'react';
import { trackFb } from '@/lib/fbq';

/**
 * One delegated listener that fires Meta "Contact" when a visitor taps a
 * phone (tel:) or email (mailto:) link anywhere on the public site.
 * WhatsApp is tracked separately in WhatsAppButton.
 */
export default function FbClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (href.startsWith('tel:')) trackFb('Contact', { content_category: 'phone_call', content_name: window.location.pathname });
      else if (href.startsWith('mailto:')) trackFb('Contact', { content_category: 'email', content_name: window.location.pathname });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}
