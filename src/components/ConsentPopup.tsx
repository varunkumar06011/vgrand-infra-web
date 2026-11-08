'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const STORAGE_KEY = 'vgrand_consent_accepted';
const EXEMPT_PATHS = ['/terms-and-conditions', '/privacy-policy'];

/**
 * Compact bottom consent banner. It does not block the page: visitors can scroll and look around
 * while it is showing. Pressing "Accept" records agreement to the Terms and Privacy Policy;
 * permission to be contacted is a separate, unticked-by-default checkbox.
 */
export default function ConsentPopup() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [contactOk, setContactOk] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    setShow(!accepted && !EXEMPT_PATHS.includes(pathname));
  }, [pathname]);

  const accept = async () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accepted_terms: true,
          accepted_privacy: true,
          accepted_contact: contactOk,
        }),
      });
    } catch {
      // Best-effort logging — the visitor still proceeds.
    }
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Terms and privacy"
      className="consent-popup-card fixed inset-x-3 bottom-3 z-[99999] mx-auto max-w-[760px] rounded-lg border border-forest/10 bg-white/95 p-4 shadow-lift backdrop-blur-md md:bottom-5 md:p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <div className="min-w-0 flex-1">
          <p className="!text-[13px] !leading-relaxed !text-forest/80">
            By continuing you agree to our{' '}
            <Link href="/terms-and-conditions" className="font-semibold text-meadow-600 underline underline-offset-2">
              Terms &amp; Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="font-semibold text-meadow-600 underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
          <label className="mt-2 flex cursor-pointer items-start gap-2 text-[12px] leading-snug text-forest/70">
            <input
              type="checkbox"
              checked={contactOk}
              onChange={(e) => setContactOk(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-meadow-600"
            />
            <span>(Optional) I agree to be contacted by V Grand Infra by call, SMS, WhatsApp and email about properties and services.</span>
          </label>
        </div>
        <button
          onClick={accept}
          className="btn btn-primary w-full shrink-0 !px-7 !py-3 text-[14px] md:w-auto"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
