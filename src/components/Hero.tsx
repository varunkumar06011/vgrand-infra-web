'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

// ─── Constants ──────────────────────────────────────────────────────────────
const TOTAL_FRAMES = 270
const NAVBAR_H = 84          // fixed navbar height in px
const MOBILE_BP = 1024        // breakpoint: below this = mobile/tablet
const BATCH_SIZE = 12
const PRIORITY_HEAD = 30

const FRAME_SRC = (i: number) =>
  `/NEW%20FRAMES/ezgif-frame-${String(i + 1).padStart(3, '0')}.png`

// Cache frames globally to prevent reload lag when navigating back to home
const GLOBAL_FRAMES: HTMLImageElement[] = []
let globalLoadProgress = 0

// ─── Hero Component ──────────────────────────────────────────────────────────
export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const framesRef = useRef<HTMLImageElement[]>([])
  const rafIdRef = useRef<number | null>(null)
  const currentFrameRef = useRef<number>(-1)
  const scrollDirtyRef = useRef<boolean>(true)
  const widthRef = useRef<number>(0)
  const heightRef = useRef<number>(0)
  const containerHeightRef = useRef<number>(0)
  const offsetTopRef = useRef<number>(0)
  const pathname = usePathname()

  const [loadProgress, setLoadProgress] = useState(0)
  const [canvasHasDrawn, setCanvasHasDrawn] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Detect mobile client-side only (avoids SSR hydration mismatch)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BP)
    check()
    window.addEventListener('resize', check)
    // Performance: Ultra-hardened JS Pre-warming for architectural renders
    const landmarkFrames = [0, 89, 179, 269];
    landmarkFrames.forEach(i => {
      const img = new Image();
      img.src = FRAME_SRC(i);
      img.decoding = 'async';
      img.decode().catch(() => {});
    });
    return () => window.removeEventListener('resize', check)
  }, [])

  // Store dims in refs to avoid layout thrashing during animation loop
  const updateDims = () => {
    widthRef.current = window.innerWidth
    heightRef.current = window.innerHeight
    if (containerRef.current) {
      containerHeightRef.current = containerRef.current.offsetHeight
      offsetTopRef.current = containerRef.current.offsetTop
    }
  }

  useEffect(() => {
    updateDims()
  }, [])

  // ── Intersection Observer to pause when off-screen ────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // ── Resize canvas to full viewport ──────────────────────────────────────
  const syncCanvasSize = (canvas: HTMLCanvasElement) => {
    canvas.width = widthRef.current || window.innerWidth
    canvas.height = heightRef.current || window.innerHeight
  }

  // ── Shared draw function ──────────────────────────────────────────────────
  // Draws the correct layout without mutating smoothing settings each call
  // (smoothing is set once on ctx init — no repeated state changes).
  const paintFrame = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement
  ) => {
    const isMob = canvas.width < MOBILE_BP
    const availH = canvas.height - NAVBAR_H

    // alpha:false canvas — fillRect is faster than clearRect for opaque canvas
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (isMob) {
      const scale = canvas.width / img.naturalWidth
      const scaledH = img.naturalHeight * scale
      const y = NAVBAR_H + Math.max(0, (availH - scaledH) / 2)
      ctx.drawImage(img, 0, y, canvas.width, scaledH)
    } else {
      const scaleW = canvas.width / img.naturalWidth
      const scaleH = availH / img.naturalHeight
      const scale = Math.max(scaleW, scaleH)
      const scaledW = img.naturalWidth * scale
      const scaledH = img.naturalHeight * scale
      const x = (canvas.width - scaledW) / 2
      const y = NAVBAR_H + (availH - scaledH) / 2
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

    // FIX 2: RESET SCROLL TO TOP ON MOUNT
    window.scrollTo({ top: 0, behavior: 'instant' });

    // alpha:false = no compositing needed, much faster drawImage
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // Set smoothing once — no need to reset per draw call
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'medium'   // 'medium' vs 'high': imperceptible at scroll speed

    syncCanvasSize(canvas)

    // Reuse global cache if available
    if (GLOBAL_FRAMES.length > 0 && GLOBAL_FRAMES.every(img => img && img.complete)) {
      framesRef.current = GLOBAL_FRAMES
      setLoadProgress(100)
      if (ctx && GLOBAL_FRAMES[0]) {
        paintFrame(canvas, ctx, GLOBAL_FRAMES[0])
        setCanvasHasDrawn(true)
      }
      return
    }

    const imgs: HTMLImageElement[] = GLOBAL_FRAMES.length > 0 ? GLOBAL_FRAMES : new Array(TOTAL_FRAMES)
    let loadedCount = GLOBAL_FRAMES.filter(img => img?.complete).length

    const loadOne = (i: number): Promise<void> =>
      new Promise<void>(resolve => {
        const img = GLOBAL_FRAMES[i] || new Image()
        if (!GLOBAL_FRAMES[i]) {
          GLOBAL_FRAMES[i] = img
          img.decoding = 'async'
        }
        imgs[i] = img
        img.onload = async () => {
          await img.decode().catch(() => { })
          if (i === 0 || i === initialTargetFrame) {
            syncCanvasSize(canvas)
            paintFrame(canvas, ctx, img)
            if (!canvasHasDrawn) setCanvasHasDrawn(true)
          }
          // Trigger redraw loop so if we were "stuck" waiting for this img, it paints now
          scrollDirtyRef.current = true
          loadedCount++
          setLoadProgress(Math.floor((loadedCount / TOTAL_FRAMES) * 100))
          resolve()
        }
        img.onerror = () => { loadedCount++; resolve() }
        if (!img.src) img.src = FRAME_SRC(i)
        else if (img.complete) resolve()
      })

    const initialTargetFrame = (() => {
      const scrolled = window.scrollY - offsetTopRef.current
      const scrollable = containerHeightRef.current - heightRef.current
      const progress = Math.max(0, Math.min(1, scrolled / Math.max(scrollable, 1)))
      return Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)))
    })()

    // Load first PRIORITY_HEAD frames AND the current scroll target immediately
    const loadPriority = async () => {
      // 1. Load frame 0 (fallback/start)
      await loadOne(0)

      // 2. Load first 10 frames sequentially for instant sequence start
      for (let i = 1; i <= Math.min(10, TOTAL_FRAMES - 1); i++) {
        await loadOne(i)
      }

      // 3. If scrolled deep, load initial target frame plus buffer
      if (initialTargetFrame > 10) {
        const start = Math.max(0, initialTargetFrame - 5)
        const end = Math.min(TOTAL_FRAMES - 1, initialTargetFrame + 10)
        for (let j = start; j <= end; j++) {
          if (!GLOBAL_FRAMES[j]?.complete) await loadOne(j)
        }
      }

      // 3. Load regular priority head
      const priorityEnd = Math.min(PRIORITY_HEAD, TOTAL_FRAMES)
      for (let i = 1; i < priorityEnd; i++) {
        // Skip if already loaded in step 2
        if (i < initialTargetFrame - 2 || i > initialTargetFrame + 5) {
          await loadOne(i)
        }
      }

      // Then load the rest...
      const remaining = Array.from({ length: TOTAL_FRAMES }, (_, k) => k).filter(i => !imgs[i])
      const runBatch = async (startInRem: number) => {
        if (startInRem >= remaining.length) return
        const batch = remaining.slice(startInRem, startInRem + BATCH_SIZE)
        await Promise.all(batch.map(i => loadOne(i)))
        runBatch(startInRem + BATCH_SIZE)
      }
      runBatch(0)
    }

    loadPriority()
    framesRef.current = imgs

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll-driven RAF loop ────────────────────────────────────────────────
  // Uses a "dirty flag" pattern: scroll events mark dirty=true, the RAF loop
  // only redraws when dirty. This avoids wasting GPU budget on frames where
  // nothing changed (60fps loop was running even when user wasn't scrolling).
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || !isVisible) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'medium'
    syncCanvasSize(canvas)

    // FIX 3: RESET FRAME INDEX AND INITIAL PAINT ON MOUNT
    if (ctx && framesRef.current[0]) {
      paintFrame(canvas, ctx, framesRef.current[0]);
      currentFrameRef.current = 0;
    }

    const onResize = () => {
      updateDims()
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

        const scrolled = window.scrollY - offsetTopRef.current
        const scrollable = containerHeightRef.current - heightRef.current
        const progress = Math.max(0, Math.min(1, scrolled / Math.max(scrollable, 1)))
        const idx = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1)))

        if (idx !== currentFrameRef.current) {
          const img = framesRef.current[idx]
          if (img?.complete && img.naturalWidth > 0) {
            currentFrameRef.current = idx
            if (canvas.width !== widthRef.current || canvas.height !== heightRef.current) {
              syncCanvasSize(canvas)
              ctx.imageSmoothingEnabled = true
              ctx.imageSmoothingQuality = 'medium'
            }
            paintFrame(canvas, ctx, img)
            if (!canvasHasDrawn) setCanvasHasDrawn(true)
          } else {
            // Frame not ready. Stay dirty so we check again next loop/frame load
            scrollDirtyRef.current = true
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(loop)
    }

    loop()
    return () => {
      // FIX 1 & 4: CANCEL RAF AND REMOVE LISTENERS
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
    }
  }, [canvasHasDrawn]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      key={pathname}
      className="hero-container hero-gpu-layer"
      style={{ height: isMobile ? '250vh' : '450vh', position: 'relative', zIndex: 1 }}
    >
      {/* ── Sticky viewport: full viewport, always top:0 ─────────────── */}
      <div
        className="hero-gpu-layer"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          background: '#000',
          willChange: 'transform',
          contain: 'paint'
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
          className="hero-image"
          fetchPriority="high"
          sizes="(max-width: 768px) 100vw, 100vw"
          decoding="sync"
          style={{
            position: 'absolute',
            top: NAVBAR_H,
            left: 0,
            width: '100%',
            height: `calc(100% - ${NAVBAR_H}px)`,
            objectFit: 'contain',
            objectPosition: 'center',
            zIndex: 0,
            display: 'block',
            transform: 'translate3d(0,0,1px)',
            backfaceVisibility: 'hidden',
            imageRendering: '-webkit-optimize-contrast'
          }}
        />

        {/* ── Canvas ────────────────────────────────────────────────────
            alpha:false → browser skips transparency compositing.
            Hidden (opacity:0) until the first frame is painted so the
            fallback <img> shows through — no black flash on load.       */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            display: 'block',
            opacity: canvasHasDrawn ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* ── Loading progress bar ─────────────────────────────────── */}
        {loadProgress < 100 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: 3,
              width: `${loadProgress}%`,
              background: '#C0392B',
              zIndex: 30,
              transition: 'width 0.2s ease',
            }}
          />
        )}

        {/* ── Welcome text ─────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 10,
            pointerEvents: 'none',
            userSelect: 'none',
            willChange: 'transform, opacity'
          }}
        >
          <p
            style={{
              display: 'inline-block',
              color: '#ffffff',
              fontSize: 'clamp(10px, 1.4vw, 15px)',
              letterSpacing: '8px',
              fontFamily: 'var(--font-heading), Montserrat, sans-serif',
              textTransform: 'uppercase',
              fontWeight: 600,
              textShadow: '0 0 40px rgba(0,0,0,1), 0 2px 8px rgba(0,0,0,0.9)',
              borderBottom: '1px solid rgba(255,255,255,0.35)',
              paddingBottom: 6,
              margin: 0,
            }}
          >
            WELCOME TO V GRAND INFRA
          </p>
        </div>
      </div>
    </div>
  );
}
