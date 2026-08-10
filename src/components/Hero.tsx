'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Constants ──────────────────────────────────────────────────────────────
const NAVBAR_H = 84          // fixed navbar height in px
const SLIDE_DURATION = 2500   // 2.5 seconds
const TRANSITION_DURATION = 500 // 500ms

const slides = [
  { 
    src: '/images/ban a.png', 
    title: 'Elite Homes',
    description: ''
  },
  { 
    src: '/images/ban c (1).png', 
    title: 'V Grand Gateway',
    description: ''
  },
  { 
    src: '/images/ban b.png', 
    title: 'V Grand Tripura',
    description: ''
  }
]

// Extended slides: [clone-of-last, ...real, clone-of-first] for infinite loop
const extendedSlides = [
  { ...slides[slides.length - 1] },
  ...slides,
  { ...slides[0] }
]

// ─── Hero Component ──────────────────────────────────────────────────────────
export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(1) // start at first real slide
  const [disableTransition, setDisableTransition] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pathname = usePathname()

  // Snap back from clone to real slide after transition completes
  useEffect(() => {
    if (currentIndex === 0) {
      const t = setTimeout(() => {
        setDisableTransition(true)
        setCurrentIndex(slides.length)
      }, TRANSITION_DURATION)
      return () => clearTimeout(t)
    }
    if (currentIndex === extendedSlides.length - 1) {
      const t = setTimeout(() => {
        setDisableTransition(true)
        setCurrentIndex(1)
      }, TRANSITION_DURATION)
      return () => clearTimeout(t)
    }
  }, [currentIndex])

  // Re-enable transition after snap (double rAF ensures DOM painted first)
  useEffect(() => {
    if (disableTransition) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setDisableTransition(false)
        })
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [disableTransition])

  // Reset timer for auto-play
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setDisableTransition(false)
      setCurrentIndex((prev) => prev + 1)
    }, SLIDE_DURATION)
  }, [])

  // Navigation handlers
  const nextSlide = useCallback(() => {
    setDisableTransition(false)
    setCurrentIndex((prev) => prev + 1)
    resetTimer()
  }, [resetTimer])

  const prevSlide = useCallback(() => {
    setDisableTransition(false)
    setCurrentIndex((prev) => prev - 1)
    resetTimer()
  }, [resetTimer])

  const goToSlide = useCallback((index: number) => {
    setDisableTransition(false)
    setCurrentIndex(index + 1)
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

  // Map extended index to real slide index for dot indicators
  const activeDotIndex =
    currentIndex === 0 ? slides.length - 1
    : currentIndex === extendedSlides.length - 1 ? 0
    : currentIndex - 1

  return (
    <div
      className="relative w-full h-[45vh] sm:h-[50vh] md:h-[60vh] lg:h-[100vh] min-h-[320px] sm:min-h-[380px] md:min-h-[500px] lg:min-h-[600px] overflow-hidden bg-[#0a0a0a]"
      style={{ marginTop: '84px' }}
    >
      {/* ── Slides Container ───────────────────────────────────────────────── */}
      <div
        className="flex h-full w-full ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transitionDuration: disableTransition ? '0ms' : `${TRANSITION_DURATION}ms`
        }}
      >
        {extendedSlides.map((slide, i) => (
          <div key={i} className="min-w-full h-full relative flex items-center justify-center bg-black">
            <Image
              src={slide.src}
              alt={slide.title}
              fill
              priority={i === 1}
              quality={90}
              className="object-contain lg:object-cover object-center lg:object-top"
              sizes="100vw"
            />
            {/* Gradient Overlay for Text Readability & Professional Finish */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* ── Navigation Arrows ─────────────────────────────────────────────── */}
      <button
        onClick={prevSlide}
        className="absolute left-1 md:left-4 top-1/2 -translate-y-1/2 z-20 p-1.5 md:p-3 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors group"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} className="md:w-8 md:h-8 group-active:scale-90 transition-transform" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-1 md:right-4 top-1/2 -translate-y-1/2 z-20 p-1.5 md:p-3 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors group"
        aria-label="Next slide"
      >
        <ChevronRight size={20} className="md:w-8 md:h-8 group-active:scale-90 transition-transform" />
      </button>

      {/* ── Welcome Text Overlay ─────────────────────────────────────────── */}
      <div className="absolute bottom-[18%] left-0 right-0 text-center z-10 pointer-events-none px-4">
        <p className="inline-block text-white text-[10px] lg:text-[14px] tracking-[6px] lg:tracking-[10px] uppercase font-semibold border-b border-white/30 pb-2 shadow-2xl drop-shadow-lg">
          Welcome to V Grand Infra
        </p>
      </div>

      {/* ── Dot Indicators ────────────────────────────────────────────────── */}
      <div className="absolute bottom-6 md:bottom-10 left-0 right-0 flex justify-center gap-3 md:gap-4 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goToSlide(i)}
            className={`transition-all duration-300 rounded-full border border-white/50 ${
              activeDotIndex === i ? 'w-8 md:w-10 bg-white border-white' : 'w-2.5 h-2.5 md:w-3 md:h-3 bg-transparent hover:bg-white/20'
            }`}
            style={{ height: activeDotIndex === i ? '6px' : '10px', borderRadius: '999px' }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
