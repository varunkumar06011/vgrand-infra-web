'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ShieldCheck } from 'lucide-react';

/**
 * Signature hero.
 *
 *   base layer   – the meadow rendered as blue halftone dots (canvas, drawn once per resize)
 *   photo layer  – the real photo, revealed through a CSS mask made of two radial gradients:
 *                    1. a "lens" that eases toward the pointer
 *                    2. a "sunrise" circle that grows from the bottom edge as the page scrolls
 *
 * Mask positions/sizes are driven by CSS variables written in one rAF loop, so there is no
 * React re-render while moving or scrolling. Reduced-motion users get the plain photo.
 */

const HERO_SRC = '/images/earth/hills.webp';

const DOT = '#2f6fdc';
const PAPER = '#eef4fb';

function drawHalftone(canvas: HTMLCanvasElement, img: HTMLImageElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  const cell = w < 640 ? 7 : w < 1100 ? 8 : 10;
  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / (cell * 0.866)) + 1; // hex-staggered rows

  // Sample the photo with the same "cover" crop the <Image> uses.
  const sample = document.createElement('canvas');
  sample.width = cols;
  sample.height = rows;
  const sctx = sample.getContext('2d', { willReadFrequently: true });
  if (!sctx) return;
  const targetAspect = w / h;
  const imgAspect = img.naturalWidth / img.naturalHeight;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (imgAspect > targetAspect) {
    sw = img.naturalHeight * targetAspect;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / targetAspect;
    sy = (img.naturalHeight - sh) / 2;
  }
  sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
  const px = sctx.getImageData(0, 0, cols, rows).data;

  ctx.fillStyle = DOT;
  for (let r = 0; r < rows; r++) {
    const y = r * cell * 0.866;
    const offset = r % 2 ? cell / 2 : 0;
    for (let c = 0; c < cols; c++) {
      const i = (r * cols + c) * 4;
      const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
      const radius = cell * 0.4 * (0.04 + 0.96 * Math.pow(1 - lum, 1.35));
      if (radius < 0.35) continue;
      ctx.beginPath();
      ctx.arc(c * cell + offset, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default function DitherHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const copy2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const photo = photoRef.current;
    if (!section || !stage || !canvas || !photo) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      // Static fallback: plain photo with the closing line only (no animation, no lens).
      photo.style.setProperty('--sr', '3000px');
      if (copyRef.current) copyRef.current.style.display = 'none';
      if (copy2Ref.current) {
        copy2Ref.current.style.opacity = '1';
        copy2Ref.current.style.pointerEvents = 'auto';
      }
      return;
    }

    // ---- halftone base ----
    const img = new window.Image();
    img.src = HERO_SRC;
    const paint = () => img.complete && img.naturalWidth && drawHalftone(canvas, img);
    img.onload = paint;
    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        paint();
        needsFrame();
      }, 150);
    };
    window.addEventListener('resize', onResize);

    // ---- lens + sunrise state ----
    const state = {
      tx: -999, ty: -999, // pointer target
      x: -999, y: -999,   // eased lens position
      lr: 0, lrTarget: 0, // lens radius
      p: 0,               // scroll progress 0..1
      demo: false,        // touch devices: lens drifts by itself until the first touch
    };
    let raf = 0;
    let running = false;
    let lingerTimer: number | undefined;
    let demoTimer: number | undefined;
    const coarse = window.matchMedia('(pointer: coarse)').matches;

    const render = () => {
      const rect = stage.getBoundingClientRect();
      const diag = Math.hypot(rect.width, rect.height);

      // Idle hint on touch screens: a lens wanders across the dots until the user touches or scrolls.
      if (state.demo) {
        if (state.p > 0.06) {
          state.demo = false;
          state.lrTarget = 0;
        } else {
          const s = performance.now() / 1000;
          state.tx = rect.width * (0.5 + 0.3 * Math.sin(s * 0.8));
          state.ty = rect.height * (0.62 + 0.14 * Math.sin(s * 1.3 + 1));
          state.lrTarget = 110;
          if (state.x < -900) { state.x = state.tx; state.y = state.ty; }
        }
      }

      // Ease lens toward pointer
      state.x += (state.tx - state.x) * 0.16;
      state.y += (state.ty - state.y) * 0.16;
      state.lr += (state.lrTarget - state.lr) * 0.14;

      // Sunrise radius: eased, finishes around 70% of the pinned scroll
      const t = Math.min(1, state.p / 0.7);
      const eased = 1 - Math.pow(1 - t, 3);
      const sr = eased * diag * 1.15;

      photo.style.setProperty('--px', `${state.x}px`);
      photo.style.setProperty('--py', `${state.y}px`);
      photo.style.setProperty('--lr', `${state.lr}px`);
      photo.style.setProperty('--sr', `${sr}px`);

      if (copyRef.current) {
        const fade = Math.max(0, 1 - state.p / 0.55);
        copyRef.current.style.opacity = String(fade);
        copyRef.current.style.transform = `translate3d(0, ${state.p * -80}px, 0)`;
      }
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - state.p * 6));
      if (copy2Ref.current) {
        const k = Math.min(1, Math.max(0, (state.p - 0.5) / 0.22));
        copy2Ref.current.style.opacity = String(k);
        copy2Ref.current.style.transform = `translate3d(0, ${(1 - k) * 40}px, 0)`;
        copy2Ref.current.style.pointerEvents = k > 0.6 ? 'auto' : 'none';
      }

      const settled =
        Math.abs(state.tx - state.x) < 0.4 &&
        Math.abs(state.ty - state.y) < 0.4 &&
        Math.abs(state.lrTarget - state.lr) < 0.4;
      if (settled && !state.demo) {
        running = false;
      } else {
        raf = requestAnimationFrame(render);
      }
    };
    function needsFrame() {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(render);
      }
    }

    const readScroll = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      state.p = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));
      needsFrame();
    };

    const onMove = (e: PointerEvent) => {
      const touch = e.pointerType === 'touch';
      const rect = stage.getBoundingClientRect();
      // Touch: user took over, stop the idle hint and cancel any pending close.
      state.demo = false;
      window.clearTimeout(lingerTimer);
      window.clearTimeout(demoTimer);

      const x = e.clientX - rect.left;
      // On touch, centre the lens a little above the fingertip so the thumb doesn't hide the reveal.
      const y = e.clientY - rect.top - (touch ? 64 : 0);
      if (state.lrTarget === 0 && state.x < -900) {
        state.x = x;
        state.y = y;
      }
      state.tx = x;
      state.ty = y;
      state.lrTarget = touch ? 130 : 190;
      needsFrame();
    };
    const close = () => {
      state.lrTarget = 0;
      needsFrame();
    };
    // Mouse: close immediately. Touch: let the reveal linger briefly after the finger lifts.
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        window.clearTimeout(lingerTimer);
        lingerTimer = window.setTimeout(close, 1400);
      } else {
        close();
      }
    };

    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerdown', onMove);
    stage.addEventListener('pointerleave', onLeave);
    stage.addEventListener('pointerup', onLeave);
    stage.addEventListener('pointercancel', onLeave);
    window.addEventListener('scroll', readScroll, { passive: true });
    readScroll();

    if (coarse) {
      demoTimer = window.setTimeout(() => {
        if (state.p < 0.06) {
          state.demo = true;
          needsFrame();
        }
      }, 1200);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.clearTimeout(lingerTimer);
      window.clearTimeout(demoTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', readScroll);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerdown', onMove);
      stage.removeEventListener('pointerleave', onLeave);
      stage.removeEventListener('pointerup', onLeave);
      stage.removeEventListener('pointercancel', onLeave);
    };
  }, []);

  const mask =
    'radial-gradient(circle at var(--px, -999px) var(--py, -999px), #000 calc(var(--lr, 0px) * 0.55), transparent var(--lr, 0px)),' +
    'radial-gradient(circle at 50% 108%, #000 calc(var(--sr, 0px) * 0.8), transparent var(--sr, 0px))';

  return (
    <section ref={sectionRef} className="relative h-[230vh]" aria-label="V Grand Infra introduction">
      <div ref={stageRef} className="sticky top-0 h-screen w-full overflow-hidden bg-sky-50 touch-pan-y">
        {/* 1 · halftone base */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

        {/* 2 · real photo, shown through the lens/sunrise mask */}
        <div
          ref={photoRef}
          className="absolute inset-0"
          style={{
            WebkitMaskImage: mask,
            maskImage: mask,
          }}
        >
          <Image
            src={HERO_SRC}
            alt="Green meadow hills dotted with wildflowers under a soft morning sky"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest/55 via-transparent to-transparent" />
        </div>

        {/* 3 · copy */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {/* soft paper wash so the headline stays readable over the dots */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 70% 60% at 30% 46%, rgba(238,244,251,0.92), rgba(238,244,251,0) 72%)' }}
          />
          <div ref={copyRef} className="container-x relative w-full px-5 md:px-8 pt-24 will-change-transform">
            <p className="eyebrow mb-5 !text-forest">V Grand Infra · Ongole, Andhra Pradesh</p>
            <h1 className="max-w-[900px] font-heading text-forest leading-[1.02]">
              Premium apartments &amp; flats <span className="italic text-meadow-600">in Ongole.</span>
            </h1>
            <p className="mt-6 max-w-[520px] !text-[17px] !text-forest/75">
              Gated community homes near the NH-16 highway — quality construction, honest pricing and transparent timelines.
            </p>
            <div className="mt-9 flex flex-wrap gap-3 pointer-events-auto">
              <Link href="/projects" className="btn btn-dark">Explore projects</Link>
              <Link href="/site-visit" className="btn btn-ghost bg-white/50 backdrop-blur">Book a site visit</Link>
            </div>
            <p className="mt-6 inline-flex items-center gap-2 text-[13px] !text-forest/70">
              <ShieldCheck size={16} className="text-meadow-600" /> RERA registered developer
            </p>
          </div>
        </div>

        {/* 3b · second chapter, fades in once the photo is revealed */}
        <div className="absolute inset-x-0 bottom-0 pb-16 md:pb-20 pointer-events-none">
          <div ref={copy2Ref} className="container-x px-5 md:px-8 opacity-0 will-change-transform">
            <p className="eyebrow !text-white/90">Our promise</p>
            <h2 className="mt-4 max-w-[760px] font-heading text-white leading-[1.05] [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
              Building with honesty, <span className="italic text-cream">delivering with pride.</span>
            </h2>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/projects" className="btn btn-light">See our projects</Link>
              <Link href="/about" className="btn border border-white/50 text-white hover:bg-white hover:text-forest">Our story</Link>
            </div>
          </div>
        </div>

        {/* 4 · hint */}
        <div
          ref={hintRef}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-forest/70 pointer-events-none"
        >
          <span className="hidden md:block">Move your cursor · scroll to bring it to life</span>
          <span className="md:hidden whitespace-nowrap">Tap or drag · swipe up</span>
          <ArrowDown size={16} className="floaty" />
        </div>
      </div>
    </section>
  );
}
