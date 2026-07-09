'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

type GalleryItem =
  | { type: 'image'; src: string; title: string; desc: string }
  | { type: 'video'; src: string; title: string; desc: string };

const galleryItems: GalleryItem[] = [
  { type: 'video', src: '/images/WhatsApp Video 2026-07-09 at 11.45.24.mp4', title: 'Site Walkthrough', desc: 'Latest progress from the ground — July 2026' },
  { type: 'image', src: '/images/gallery 1.png', title: 'Site Overview', desc: 'Aerial view of our ongoing project in Koppolu, Ongole' },
  { type: 'image', src: '/images/gallery 2.png', title: 'Construction Progress', desc: 'Structural work advancing with precision engineering' },
  { type: 'image', src: '/images/gallery 3.png', title: 'Quality Materials', desc: 'Premium grade materials sourced for lasting strength' },
  { type: 'image', src: '/images/gallery 4.png', title: 'On-Site Activity', desc: 'Skilled workforce building with dedication and care' },
  { type: 'image', src: '/images/gallery 5.png', title: 'Project Milestone', desc: 'Another step closer to delivering your dream home' },
];

const imageItems = galleryItems.filter((item) => item.type === 'image');

export default function GalleryContent() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? prev : (prev + 1) % imageItems.length));
  }, []);

  const prevImage = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? prev : (prev - 1 + imageItems.length) % imageItems.length));
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, closeLightbox, nextImage, prevImage]);

  return (
    <>
      <main style={{ background: '#fff5f5', minHeight: '100vh', paddingTop: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 100px' }}>
          {/* Header */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Visual Journey</p>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 5vw, 44px)', color: '#1a1a1a', marginBottom: 16, fontWeight: 700 }}>Gallery</h1>
            <p style={{ color: '#555', fontSize: 15, lineHeight: 1.6, maxWidth: 650 }}>
              Stay updated with our latest project milestones and construction progress directly from our site.
            </p>
          </div>

          {/* Instagram-style Gallery Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {galleryItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                onClick={() => {
                  if (item.type === 'image') {
                    setLightboxIndex(imageItems.findIndex((img) => img.src === item.src));
                  }
                }}
                style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                  cursor: item.type === 'image' ? 'pointer' : 'default',
                  background: '#fff',
                  boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                className="group"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.14)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.08)';
                }}
              >
                {/* Square Media */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  overflow: 'hidden',
                  background: '#0a0a0a',
                }}>
                  {item.type === 'video' ? (
                    <video
                      src={item.src}
                      controls
                      playsInline
                      muted
                      loop
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <>
                      <img
                        src={item.src}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease',
                        }}
                        className="group-hover:scale-110"
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.18)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        pointerEvents: 'none',
                      }}
                           className="group-hover:opacity-100"
                      />
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 44, height: 44,
                        borderRadius: '50%',
                        background: 'rgba(192,57,43,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        pointerEvents: 'none',
                      }}
                           className="group-hover:opacity-100"
                      >
                        <ZoomIn size={18} color="white" />
                      </div>
                    </>
                  )}

                  {/* Type Badge */}
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    padding: '5px 10px',
                    borderRadius: 20,
                    background: 'rgba(26,26,26,0.75)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(4px)',
                  }}>
                    {item.type === 'video' ? 'Video' : 'Photo'}
                  </div>
                </div>

                {/* Caption below media (Instagram-style) */}
                <div style={{ padding: '16px 18px' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-heading), Montserrat, sans-serif',
                    fontSize: 15,
                    fontWeight: 700,
                    margin: '0 0 5px',
                    color: '#1a1a1a',
                    lineHeight: 1.3,
                  }}>{item.title}</h3>
                  <p style={{
                    fontFamily: 'var(--font-body), Inter, sans-serif',
                    fontSize: 12,
                    lineHeight: 1.55,
                    margin: 0,
                    color: '#666',
                  }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeLightbox}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(10,10,10,0.92)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              style={{
                position: 'absolute',
                top: 20, right: 20,
                width: 44, height: 44,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              aria-label="Close"
            >
              <X size={22} />
            </button>

            {/* Prev Arrow */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              style={{
                position: 'absolute',
                left: 20,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 48, height: 48,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              aria-label="Previous"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#1a1a1a',
                boxShadow: '0 20px 80px rgba(0,0,0,0.5)',
              }}
            >
              <img
                src={imageItems[lightboxIndex].src}
                alt={imageItems[lightboxIndex].title}
                style={{
                  width: '100%',
                  maxHeight: '85vh',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
              <div style={{ padding: '20px 28px', background: '#1a1a1a' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>
                  {imageItems[lightboxIndex].title}
                </h3>
                <p style={{ color: '#aaa', fontSize: 14, margin: 0 }}>
                  {imageItems[lightboxIndex].desc}
                </p>
              </div>
            </motion.div>

            {/* Next Arrow */}
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              style={{
                position: 'absolute',
                right: 20,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 48, height: 48,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              aria-label="Next"
            >
              <ChevronRight size={24} />
            </button>

            {/* Counter */}
            <div style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 1,
            }}>
              {lightboxIndex + 1} / {imageItems.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
