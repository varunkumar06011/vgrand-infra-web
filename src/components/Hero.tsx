'use client'
import { useEffect, useRef, useState } from 'react'

const TOTAL_FRAMES = 174

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const framesRef = useRef<HTMLImageElement[]>([])
  const rafRef = useRef<number>(0)
  const currentFrameRef = useRef(-1)
  const sizeRef = useRef({ w: 0, h: 0 })
  const [loaded, setLoaded] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Preload all frames
  useEffect(() => {
    const imgs: HTMLImageElement[] = new Array(TOTAL_FRAMES)
    let count = 0

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image()
      const num = String(i + 1)
      img.src = `/frames/frame-${num}.png`
      img.onload = async () => {
        await img.decode().catch(() => {})

        // Fix 2: Draw frame 1 immediately as soon as it loads
        if (i === 0) {
          const canvas = canvasRef.current
          if (canvas) {
            const ctx = canvas.getContext('2d')
            if (ctx) {
              canvas.width = window.innerWidth
              canvas.height = window.innerHeight
              sizeRef.current = { w: window.innerWidth, h: window.innerHeight }
              const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
              const x = (canvas.width - img.naturalWidth * scale) / 2
              const y = (canvas.height - img.naturalHeight * scale) / 2
              ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale)
              // Show canvas immediately
              canvas.style.display = 'block'
            }
          }
        }

        count++
        setLoadProgress(Math.floor((count / TOTAL_FRAMES) * 100))
        
        // Progressively allow interaction after first 30 frames
        if (count >= 30 && !loaded) {
          setLoaded(true)
        }
        
        if (count === TOTAL_FRAMES) setLoaded(true)
      }
      img.onerror = () => {
        count++
        if (count >= 30 && !loaded) setLoaded(true)
        if (count === TOTAL_FRAMES) setLoaded(true)
      }
      imgs[i] = img
    }
    framesRef.current = imgs

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Draw loop — works on both mobile and desktop
  useEffect(() => {
    // We allow draw loop to start if at least partial loading happened
    if (!loaded && loadProgress < 15) return

    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Fix 4: Set size immediately
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    sizeRef.current = { w: window.innerWidth, h: window.innerHeight }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)

    const draw = () => {
      const scrolled = window.scrollY - container.offsetTop
      const scrollable = container.offsetHeight - window.innerHeight
      const progress = Math.max(0, Math.min(1, scrolled / Math.max(scrollable, 1)))
      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.floor(progress * (TOTAL_FRAMES - 1))
      )

      if (frameIndex !== currentFrameRef.current) {
        const img = framesRef.current[frameIndex]
        // Only update if image is actually loaded, otherwise keep current frame
        if (img?.complete && img.naturalWidth > 0) {
          currentFrameRef.current = frameIndex
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // Cover fit — same as CSS object-fit: cover
          const scale = Math.max(
            canvas.width / img.naturalWidth,
            canvas.height / img.naturalHeight
          )
          const x = (canvas.width - img.naturalWidth * scale) / 2
          const y = (canvas.height - img.naturalHeight * scale) / 2
          ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale)
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [loaded])

  return (
    <div
      ref={containerRef}
      style={{
        height: isMobile ? '250vh' : '500vh',
        position: 'relative',
        zIndex: 1
      }}
    >
      {/* Sticky viewport */}
      <div style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#000000'
      }}>

        {/* Fix 1: Always visible until canvas draws first frame */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/frames/frame-1.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
          opacity: loaded ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }} />

        {/* Canvas — same on mobile and desktop */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            display: 'block',
            willChange: 'contents',
            transform: 'translateZ(0)'
          }}
        />

        {/* Loading bar — thin red line at top */}
        {!loaded && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0,
            height: 3,
            background: '#C0392B',
            width: `${loadProgress}%`,
            zIndex: 20,
            transition: 'width 0.2s ease'
          }} />
        )}

        {/* Welcome text */}
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: 0, right: 0,
          textAlign: 'center',
          zIndex: 10,
          pointerEvents: 'none',
          userSelect: 'none'
        }}>
          <p style={{
            display: 'inline-block',
            color: '#ffffff',
            fontSize: 'clamp(11px, 1.5vw, 16px)',
            letterSpacing: '10px',
            fontFamily: 'var(--font-heading), Montserrat, sans-serif',
            textTransform: 'uppercase',
            fontWeight: 600,
            textShadow: '0 0 40px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,0.9)',
            borderBottom: '1px solid rgba(255,255,255,0.35)',
            paddingBottom: 8
          }}>
            WELCOME TO V GRAND INFRA
          </p>
        </div>
      </div>
    </div>
  )
}
