'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { Move3d } from 'lucide-react';

// three.js + the viewer only load when the visitor gets near this block
const FlatViewer = dynamic(() => import('./FlatViewer'), { ssr: false });

const MODEL_URL = '/models/flat-premium.glb';

export default function FlatWalkthrough() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // warm the viewer chunk + model when the block nears the viewport
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          import('./FlatViewer');
          io.disconnect();
        }
      },
      { rootMargin: '600px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // lock page scroll while the walkthrough is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <div ref={wrapRef} style={{ marginBottom: 56 }}>
      <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a', fontSize: 28, marginBottom: 16, fontWeight: 700 }}>
        3D Walkthrough: Step Inside the Sample Flat
      </h2>
      <p style={{ fontSize: 16, lineHeight: 1.8, color: '#444', marginBottom: 24 }}>
        Walk through the fully furnished 3 BHK flat in real 3D on your phone or laptop. Use the on-screen joystick
        to move and drag to look around — or WASD and the mouse on a computer.
      </p>

      <button
        onClick={() => setOpen(true)}
        aria-label="Open the 3D walkthrough"
        style={{
          position: 'relative', display: 'block', width: '100%', aspectRatio: '16 / 9', maxHeight: 460,
          border: 'none', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', padding: 0,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #3a2f25 55%, #C0392B 130%)',
        }}
      >
        <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#fff' }}>
          <span style={{ width: 72, height: 72, borderRadius: '50%', background: '#C0392B', display: 'grid', placeItems: 'center', boxShadow: '0 8px 30px rgba(192,57,43,.5)' }}>
            <Move3d size={34} />
          </span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 700 }}>
            Enter the 3D Walkthrough
          </span>
          <span style={{ fontSize: 13, opacity: 0.75 }}>Tap to start · works on mobile &amp; desktop</span>
        </span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(<FlatViewer url={MODEL_URL} onClose={close} />, document.body)}
    </div>
  );
}
