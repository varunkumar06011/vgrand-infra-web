'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface UpdateImage {
  id: number;
  image_url: string;
  label?: string;
  created_at: string;
}

interface Props {
  projectId: number | string;
  initialImages?: UpdateImage[];
}

export default function ConstructionUpdateSlideshow({ projectId, initialImages }: Props) {
  const [images, setImages] = useState<UpdateImage[]>(initialImages || []);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(!initialImages);

  useEffect(() => {
    if (initialImages) return;
    fetch(`/api/construction-updates?project_id=${projectId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setImages(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId, initialImages]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIdx === null) return;
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight') setLightboxIdx((i) => (i !== null ? Math.min(i + 1, images.length - 1) : null));
      if (e.key === 'ArrowLeft') setLightboxIdx((i) => (i !== null ? Math.max(i - 1, 0) : null));
    },
    [lightboxIdx, images.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    document.body.style.overflow = lightboxIdx !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxIdx]);

  if (loading) return null;
  if (!images.length) return null;

  return (
    <>
      {/* ── Section ── */}
      <section style={{ marginBottom: 56 }}>
        {/* Heading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 3, height: 18, background: '#C0392B', borderRadius: 2, flexShrink: 0 }} />
          <h2 style={{
            fontFamily: 'var(--font-heading, Georgia, serif)',
            color: '#1a1a1a', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.3px',
          }}>
            Construction Update
          </h2>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
            color: '#C0392B', background: '#fff5f5', border: '1px solid #f5c6c6',
            borderRadius: 4, padding: '2px 8px',
          }}>
            {images.length} photos
          </span>
        </div>

        {/* Horizontal scroll strip */}
        <div
          className="construction-scroll"
          style={{
            display: 'flex', gap: 12, overflowX: 'auto', overflowY: 'hidden',
            paddingBottom: 12, scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
          }}
        >
          {images.map((img, idx) => (
            <button
              key={`${img.id}-${idx}`}
              onClick={() => setLightboxIdx(idx)}
              className="construction-thumb"
              style={{
                flexShrink: 0, scrollSnapAlign: 'start',
                width: 160, height: 120, borderRadius: 8, overflow: 'hidden',
                border: '1.5px solid #e8d5d5', background: '#f5f5f5',
                padding: 0, cursor: 'pointer', position: 'relative',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              }}
              title={img.label || `Construction update ${idx + 1}`}
              aria-label={`View construction update image ${idx + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={img.label || `Construction update ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <div
                className="thumb-overlay"
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.18s',
                }}
              >
                <ZoomIn size={22} color="white" className="thumb-zoom-icon" style={{ opacity: 0, transition: 'opacity 0.18s' }} />
              </div>
            </button>
          ))}
        </div>

        {/* Hidden preload: caches full-size images so lightbox opens instantly */}
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
          {images.map((img, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`preload-${img.id}-${idx}`} src={img.image_url} alt="" fetchPriority="low" />
          ))}
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <div
          onClick={() => setLightboxIdx(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.93)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 16, animation: 'fadeInLightbox 0.2s ease',
          }}
          role="dialog" aria-modal="true" aria-label="Image lightbox"
        >
          {/* Close */}
          <button
            onClick={() => setLightboxIdx(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%', width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(192,57,43,0.7)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            aria-label="Close lightbox"
          >
            <X size={20} />
          </button>

          {/* Counter */}
          <div style={{
            position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, letterSpacing: 1,
          }}>
            {lightboxIdx + 1} / {images.length}
          </div>

          {/* Full image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '90vw',
              maxWidth: 1000,
              height: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightboxIdx].image_url}
              alt={images[lightboxIdx].label || `Construction update ${lightboxIdx + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>

          {/* Label */}
          {images[lightboxIdx].label && (
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 14, textAlign: 'center', maxWidth: 600 }}>
              {images[lightboxIdx].label}
            </p>
          )}

          {/* Prev */}
          {lightboxIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%', width: 48, height: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', fontSize: 26, fontWeight: 200,
              }}
              aria-label="Previous image"
            >‹</button>
          )}

          {/* Next */}
          {lightboxIdx < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%', width: 48, height: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff', fontSize: 26, fontWeight: 200,
              }}
              aria-label="Next image"
            >›</button>
          )}
        </div>
      )}

      <style>{`
        .construction-scroll::-webkit-scrollbar { display: none; }
        .construction-thumb:hover { transform: scale(1.04); box-shadow: 0 6px 20px rgba(192,57,43,0.2) !important; }
        .construction-thumb:hover .thumb-overlay { background: rgba(0,0,0,0.32) !important; }
        .construction-thumb:hover .thumb-zoom-icon { opacity: 1 !important; }
        @keyframes fadeInLightbox { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  );
}
