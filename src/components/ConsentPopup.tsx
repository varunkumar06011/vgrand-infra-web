'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const STORAGE_KEY = 'vgrand_consent_accepted';
const CONTACT_TEXT =
  '(Optional) I agree to be contacted by V Grand Infra by call, SMS, WhatsApp and email about properties and services.';

/** 10-digit Indian mobile from what was typed (+91, 0 and spaces allowed); null if not valid */
function indianMobile(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}
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
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    let accepted: string | null = null;
    try {
      accepted = localStorage.getItem(STORAGE_KEY);
    } catch {
      accepted = null;
    }
    setShow(!accepted && !EXEMPT_PATHS.includes(pathname));
  }, [pathname]);

  const accept = async () => {
    // The phone number is optional. Only check it when someone has typed one.
    const typed = contactOk && phone.trim() !== '';
    const mobile = typed ? indianMobile(phone) : null;
    if (typed && !mobile) {
      setPhoneError('Please enter a 10-digit mobile number, or leave it empty.');
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      /* private mode: the banner may show again next time */
    }
    setShow(false);
    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accepted_terms: true,
          accepted_privacy: true,
          accepted_contact: contactOk,
          // sent only when the visitor ticked "contact me" and typed a number themselves
          phone: contactOk && mobile ? mobile : undefined,
          consent_text: contactOk ? CONTACT_TEXT : undefined,
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
              onChange={(e) => {
                setContactOk(e.target.checked);
                if (!e.target.checked) { setPhone(''); setPhoneError(''); }
              }}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-meadow-600"
            />
            <span>{CONTACT_TEXT}</span>
          </label>
          {contactOk && (
            <div className="mt-2 pl-6">
              <label htmlFor="consent-phone" className="block text-[12px] font-semibold text-forest/80">
                Your mobile number <span className="font-normal text-forest/60">(optional, for updates and offers)</span>
              </label>
              <div className="mt-1 flex max-w-[280px] items-center overflow-hidden rounded-md border border-forest/25 bg-white focus-within:border-meadow-600">
                <span className="px-2.5 text-[13px] text-forest/60">+91</span>
                <input
                  id="consent-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={20}
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') accept(); }}
                  placeholder="98765 43210"
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? 'consent-phone-error' : undefined}
                  className="w-full border-0 bg-transparent py-2 pr-2.5 text-[14px] text-forest outline-none"
                />
              </div>
              {phoneError && (
                <p id="consent-phone-error" role="alert" className="mt-1 !text-[12px] !text-red-700">{phoneError}</p>
              )}
            </div>
          )}
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
