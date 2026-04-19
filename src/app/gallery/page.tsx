'use client';

import { motion } from 'framer-motion';

export default function GalleryPage() {
  return (
    <main style={{ background: '#fff', minHeight: '100vh', paddingTop: 100 }}>
      <div style={{ maxWidth: 935, margin: '0 auto', padding: '0 0 80px' }}>
        {/* Header Section */}
        <div style={{ padding: '0 24px', marginBottom: 44 }}>
          <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Visual Journey</p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 5vw, 44px)', color: '#1a1a1a', marginBottom: 16, fontWeight: 700 }}>Gallery</h1>
          <p style={{ color: '#555', fontSize: 15, lineHeight: 1.6, maxWidth: 650 }}>
            Stay updated with our latest project milestones and construction progress directly from our site.
          </p>
        </div>

        {/* Coming Soon Placeholder */}
        <div className="border-t border-slate-100 mt-12 pt-24 pb-40 flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-16 h-1 bg-[#C0392B]/20 mb-12 mx-auto" />
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Coming Soon</h2>
            <p className="text-slate-400 text-sm md:text-base max-w-sm mx-auto leading-relaxed uppercase tracking-[0.2em] font-medium">
              We are currently curating the latest site captures and visual updates for our ongoing projects.
            </p>
            <div className="mt-16 text-[#C0392B] opacity-50">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="mx-auto animate-bounce"
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}


