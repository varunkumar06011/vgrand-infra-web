'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const STORAGE_KEY = 'vgrand_consent_accepted';
const EXEMPT_PATHS = ['/terms-and-conditions', '/privacy-policy'];

const checklist = [
  {
    id: 'terms',
    label: 'I have read and agree to the',
    linkText: 'Terms & Conditions',
    href: '/terms-and-conditions',
  },
  {
    id: 'privacy',
    label: 'I have read and agree to the',
    linkText: 'Privacy Policy',
    href: '/privacy-policy',
  },
  {
    id: 'contact',
    label: 'I consent to be contacted by Vgrand Infra via call, SMS, WhatsApp, and email regarding properties and services.',
  },
];

export default function ConsentPopup() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({
    terms: false,
    privacy: false,
    contact: false,
  });

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    const isExempt = EXEMPT_PATHS.includes(pathname);
    if (!accepted && !isExempt) {
      setShow(true);
      document.body.style.overflow = 'hidden';
    } else {
      setShow(false);
      document.body.style.overflow = '';
    }
  }, [pathname]);

  const allChecked = checked.terms && checked.privacy && checked.contact;

  const handleContinue = async () => {
    if (!allChecked) return;
    localStorage.setItem(STORAGE_KEY, 'true');
    document.body.style.overflow = '';
    setShow(false);

    try {
      await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accepted_terms: checked.terms,
          accepted_privacy: checked.privacy,
          accepted_contact: checked.contact,
        }),
      });
    } catch {
      // Silently fail — user still proceeds; consent is best-effort logged
    }
  };

  const toggleCheck = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
      }}
    >
      <div
        className="consent-popup-card"
        style={{
          background: '#fff',
          borderRadius: 12,
          maxWidth: 380,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#1a1a1a',
            padding: '16px 18px',
            borderRadius: '12px 12px 0 0',
          }}
        >
          <p
            style={{
              color: '#C0392B',
              fontSize: 10,
              letterSpacing: 3,
              textTransform: 'uppercase',
              fontWeight: 700,
              margin: '0 0 8px',
            }}
          >
            Welcome to Vgrand Infra
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(14px, 4vw, 24px)',
              color: '#fff',
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            Please review and accept to continue
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px' }}>
          <p
            style={{
              color: '#555',
              fontSize: 11,
              lineHeight: 1.6,
              margin: '0 0 14px',
            }}
          >
            Before you explore our website, please confirm the following:
          </p>

          {/* Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {checklist.map((item) => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked[item.id]}
                  onChange={() => toggleCheck(item.id)}
                  style={{
                    marginTop: 1,
                    width: 14,
                    height: 14,
                    accentColor: '#C0392B',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: '#333',
                    fontSize: 11,
                    lineHeight: 1.5,
                  }}
                >
                  {item.label}{' '}
                  {item.linkText && item.href && (
                    <Link
                      href={item.href}
                      style={{
                        color: '#C0392B',
                        textDecoration: 'underline',
                        fontWeight: 600,
                      }}
                    >
                      {item.linkText}
                    </Link>
                  )}
                </span>
              </label>
            ))}
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!allChecked}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '10px 20px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              border: 'none',
              cursor: allChecked ? 'pointer' : 'not-allowed',
              background: allChecked ? '#C0392B' : '#e0d0d0',
              color: allChecked ? '#fff' : '#999',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            Continue to Website
          </button>

          {!allChecked && (
            <p
              style={{
                textAlign: 'center',
                color: '#999',
                fontSize: 10,
                marginTop: 8,
                marginBottom: 0,
              }}
            >
              Please tick all boxes to enable the continue button.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
