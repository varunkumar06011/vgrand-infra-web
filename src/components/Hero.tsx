'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Constants ──────────────────────────────────────────────────────────────
const NAVBAR_H = 84          // fixed navbar height in px
const SLIDE_DURATION = 3500   // 3.5 seconds
const TRANSITION_DURATION = 700 // 700ms

const slides = [
  { 
    src: '/images/elite-homes.jpg', 
    title: 'Elite Homes',
    description: 'Premium Luxury Apartments'
  },
  { 
    src: '/images/swimming pool elite .png', 
    title: 'Swimming Pool',
    description: 'Serene & Refreshing Amenities'
  },
  { 
    src: '/images/tripura.jpg', 
    title: 'Tripura',
    description: 'Modern Living Reimagined'
  }
]

// ─── Hero Component ──────────────────────────────────────────────────────────
export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pathname = usePathname()

  // Reset timer for auto-play
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, SLIDE_DURATION)
  }, [])

  // Navigation handlers
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
    resetTimer()
  }, [resetTimer])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
    resetTimer()
  }, [resetTimer])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    resetTimer()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [resetTimer])

  // Ensure scroll is at top on mount (inherited requirement)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname])

  return (
    <div
      className="relative w-full h-[70vh] lg:h-[100vh] min-h-[550px] lg:min-h-[600px] overflow-hidden bg-black pt-[84px]"
      style={{ marginTop: 0 }}
    >
      {/* ── Slides Container ───────────────────────────────────────────────── */}
      <div 
        className="flex h-full w-full transition-transform ease-in-out"
        style={{ 
          transform: `translateX(-${currentIndex * 100}%)`,
          transitionDuration: `${TRANSITION_DURATION}ms`
        }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="min-w-full h-full relative flex items-center justify-center bg-black">
            <img
              src={slide.src}
              alt={slide.title}
              className="w-full h-full object-contain"
            />
            {/* Subtle Overlay for Title Readability */}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

      {/* ── Navigation Arrows ─────────────────────────────────────────────── */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors group"
        aria-label="Previous slide"
      >
        <ChevronLeft size={32} className="group-active:scale-90 transition-transform" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors group"
        aria-label="Next slide"
      >
        <ChevronRight size={32} className="group-active:scale-90 transition-transform" />
      </button>

      {/* ── Welcome Text Overlay ─────────────────────────────────────────── */}
      <div className="absolute bottom-[18%] left-0 right-0 text-center z-10 pointer-events-none px-4">
        <p className="inline-block text-white text-[10px] lg:text-[14px] tracking-[6px] lg:tracking-[10px] uppercase font-semibold border-b border-white/30 pb-2 shadow-2xl drop-shadow-lg">
          Welcome to V Grand Infra
        </p>
      </div>

      {/* ── Dot Indicators ────────────────────────────────────────────────── */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`transition-all duration-300 rounded-full border border-white/50 ${
              currentIndex === i ? 'w-10 bg-white border-white' : 'w-3 h-3 bg-transparent hover:bg-white/20'
            }`}
            style={{ height: currentIndex === i ? '8px' : '12px', borderRadius: '999px' }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
