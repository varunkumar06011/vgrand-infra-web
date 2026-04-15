'use client'
import { useEffect, useRef, useState } from 'react'

// ─── Constants ──────────────────────────────────────────────────────────────
const TOTAL_FRAMES  = 270
const NAVBAR_H      = 84          // fixed navbar height in px
const MOBILE_BP     = 1024        // breakpoint: below this = mobile/tablet
const BATCH_SIZE    = 8           // concurrent image loads at a time
const PRIORITY_HEAD = 20          // first N frames to load before batching rest

const FRAME_SRC = (i: number) =>
  `/NEW%20FRAMES/ezgif-frame-${String(i + 1).padStart(3, '0')}.png`

// ─── Hero Component ──────────────────────────────────────────────────────────
export default function Hero() {
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const containerRef    = useRef<HTMLDivElement>(null)
  const framesRef       = useRef<HTMLImageElement[]>([])
  const rafRef          = useRef<number>(0)
  const currentFrameRef = useRef<number>(-1)
  const scrollDirtyRef  = useRef<boolean>(false)   // true when scroll changed since last draw

  const [loadProgress, setLoadProgress]   = useState(0)
  const [canvasHasDrawn, setCanvasHasDrawn] = useState(false)
  const [isMobile, setIsMobile]           = useState(false)

  // Detect mobile client-side only (avoids SSR hydration mismatch)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BP)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Resize canvas to full viewport ──────────────────────────────────────
  const syncCanvasSize = (canvas: HTMLCanvasElement) => {
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
  }

  // ── Shared draw function ──────────────────────────────────────────────────
  // Draws the correct layout without mutating smoothing settings each call
  // (smoothing is set once on ctx init — no repeated state changes).
  const paintFrame = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement
  ) => {
    const isMob  = canvas.width < MOBILE_BP
    const availH = canvas.height - NAVBAR_H

    // alpha:false canvas — fillRect is faster than clearRect for opaque canvas
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (isMob) {
      const scale   = canvas.width / img.naturalWidth
      const scaledH = img.naturalHeight * scale
      const y       = NAVBAR_H + Math.max(0, (availH - scaledH) / 2)
      ctx.drawImage(img, 0, y, canvas.width, scaledH)
    } else {
      const scaleW  = canvas.width  / img.naturalWidth
      const scaleH  = availH        / img.naturalHeight
      const scale   = Math.max(scaleW, scaleH)
      const scaledW = img.naturalWidth  * scale
      const scaledH = img.naturalHeight * scale
      const x       = (canvas.width  - scaledW) / 2
      const y       = NAVBAR_H + (availH - scaledH) / 2
      ctx.drawImage(img, x, y, scaledW, scaledH)
    }
  }

  // ── Priority batch preload ────────────────────────────────────────────────
  // Loads PRIORITY_HEAD frames first (sequential), then bulk-loads the rest
  // in BATCH_SIZE concurrent chunks. Keeps network from being overwhelmed with
  // 270 simultaneous requests that starve early frames users actually scroll to.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // alpha:false = no compositing needed, much faster drawImage
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // Set smoothing once — no need to reset per draw call
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'medium'   // 'medium' vs 'high': imperceptible at scroll speed

    syncCanvasSize(canvas)

    const imgs: HTMLImageElement[] = new Array(TOTAL_FRAMES)
    let loadedCount = 0

    const loadOne = (i: number): Promise<void> =>
      new Promise<void>(resolve => {
        const img = new Image()
        imgs[i]   = img
        img.onload = async () => {
          await img.decode().catch(() => {})
          if (i === 0) {
            syncCanvasSize(canvas)
            paintFrame(canvas, ctx, img)
            setCanvasHasDrawn(true)
          }
          loadedCount++
          setLoadProgress(Math.floor((loadedCount / TOTAL_FRAMES) * 100))
          resolve()
        }
        img.onerror = () => { loadedCount++; resolve() }
        img.src = FRAME_SRC(i)
      })

    // Load first PRIORITY_HEAD frames one-by-one so they're ready immediately
    const loadPriority = async () => {
      const priorityEnd = Math.min(PRIORITY_HEAD, TOTAL_FRAMES)
      for (let i = 0; i < priorityEnd; i++) {
        await loadOne(i)
      }

      // Then load the rest in concurrent batches
      const remaining = Array.from(
        { length: TOTAL_FRAMES - priorityEnd },
        (_, k) => k + priorityEnd
      )
      const runBatch = async (startIdx: number) => {
        if (startIdx >= remaining.length) return
        const batch = remaining.slice(startIdx, startIdx + BATCH_SIZE)
        await Promise.all(batch.map(i => loadOne(i)))
        runBatch(startIdx + BATCH_SIZE)
      }
      runBatch(0)
    }

    loadPriority()
    framesRef.current = imgs

    return () => { cancelAnimationFrame(rafRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll-driven RAF loop ────────────────────────────────────────────────
  // Uses a "dirty flag" pattern: scroll events mark dirty=true, the RAF loop
  // only redraws when dirty. This avoids wasting GPU budget on frames where
  // nothing changed (60fps loop was running even when user wasn't scrolling).
  useEffect(() => {
    const canvas    = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'medium'
    syncCanvasSize(canvas)

    const onResize = () => {
      syncCanvasSize(canvas)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'medium'
      const idx = Math.max(0, currentFrameRef.current)
      const img = framesRef.current[idx]
      if (img?.complete && img.naturalWidth > 0) paintFrame(canvas, ctx, img)
    }
    window.addEventListener('resize', onResize)

    // Mark dirty on every scroll — passive listener has zero jank impact
    const onScroll = () => { scrollDirtyRef.current = true }
    window.addEventListener('scroll', onScroll, { passive: true })

    // ── RAF loop: only redraws canvas when scroll position has changed ──
    const loop = () => {
      if (scrollDirtyRef.current) {
        scrollDirtyRef.current = false

        const scrolled   = window.scrollY - container.offsetTop
        const scrollable = container.offsetHeight - window.innerHeight
        const progress   = Math.max(0, Math.min(1, scrolled / Math.max(scrollable, 1)))
        const idx        = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)))

        if (idx !== currentFrameRef.current) {
          const img = framesRef.current[idx]
          if (img?.complete && img.naturalWidth > 0) {
            currentFrameRef.current = idx
            if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
              syncCanvasSize(canvas)
              ctx.imageSmoothingEnabled = true
              ctx.imageSmoothingQuality = 'medium'
            }
            paintFrame(canvas, ctx, img)
            if (!canvasHasDrawn) setCanvasHasDrawn(true)
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    loop()
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [canvasHasDrawn]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{ height: isMobile ? '250vh' : '450vh', position: 'relative', zIndex: 1 }}
    >
      {/* ── Sticky viewport: full viewport, always top:0 ─────────────── */}
      <div
        style={{
          position : 'sticky',
          top      : 0,
          height   : '100vh',
          width    : '100%',
          overflow : 'hidden',
          background: '#000',
        }}
      >
        {/* ── Fallback image ────────────────────────────────────────────
            Uses a real <img> tag so it renders immediately — no black
            flash while JS / canvas initialises. Sits behind canvas
            (zIndex 0). Once canvas draws its first frame it takes over. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FRAME_SRC(0)}
          alt=""
          style={{
            position      : 'absolute',
            top           : NAVBAR_H,
            left          : 0,
            width         : '100%',
            height        : `calc(100% - ${NAVBAR_H}px)`,
            objectFit     : 'contain',
            objectPosition: 'center',
            zIndex        : 0,
            display       : 'block',
          }}
        />

        {/* ── Canvas ────────────────────────────────────────────────────
            alpha:false → browser skips transparency compositing.
            Hidden (opacity:0) until the first frame is painted so the
            fallback <img> shows through — no black flash on load.       */}
        <canvas
          ref={canvasRef}
          style={{
            position  : 'absolute',
            inset     : 0,
            width     : '100%',
            height    : '100%',
            zIndex    : 1,
            display   : 'block',
            opacity   : canvasHasDrawn ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* ── Loading progress bar ─────────────────────────────────── */}
        {loadProgress < 100 && (
          <div
            style={{
              position  : 'absolute',
              top       : 0,
              left      : 0,
              height    : 3,
              width     : `${loadProgress}%`,
              background: '#C0392B',
              zIndex    : 30,
              transition: 'width 0.2s ease',
            }}
          />
        )}

        {/* ── Welcome text ─────────────────────────────────────────── */}
        <div
          style={{
            position     : 'absolute',
            bottom       : '8%',
            left         : 0,
            right        : 0,
            textAlign    : 'center',
            zIndex       : 10,
            pointerEvents: 'none',
            userSelect   : 'none',
          }}
        >
          <p
            style={{
              display      : 'inline-block',
              color        : '#ffffff',
              fontSize     : 'clamp(10px, 1.4vw, 15px)',
              letterSpacing: '8px',
              fontFamily   : 'var(--font-heading), Montserrat, sans-serif',
              textTransform: 'uppercase',
              fontWeight   : 600,
              textShadow   : '0 0 40px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,0.9)',
              borderBottom : '1px solid rgba(255,255,255,0.35)',
              paddingBottom: 6,
              margin       : 0,
            }}
          >
            WELCOME TO V GRAND INFRA
          </p>
        </div>
      </div>
    </div>
  )
}
