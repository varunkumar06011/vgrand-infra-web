'use client';

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * All home-page motion, driven by data attributes on server-rendered markup:
 *
 *   data-word          hero headline word (slides up out of its clipping box)
 *   data-hero-fade     hero copy, buttons and badge (fade up after the headline)
 *   data-hero-scene    the illustrated scene (.scene-* parts, see HeroScene)
 *   data-depth         scene layer that drifts with scroll (desktop only)
 *   data-reveal        block that rises in once when it scrolls into view
 *   data-stagger       its children rise in one after another
 *   data-img-reveal    image frame wiped open from the top
 *   data-draw          SVG stroke drawn in
 *   data-count         number counted up from 0 (data-suffix appended)
 *   data-magnetic      button that leans toward the cursor (desktop mouse only)
 *
 * Tiers keep slow devices smooth:
 *   full  – everything; parallax and magnetic buttons only on large screens with a mouse
 *   lite  – (≤4 CPU cores or ≤4 GB memory) short fades, no loops, no wipes or parallax
 *   none  – prefers-reduced-motion: nothing moves, everything is simply shown
 *
 * The inline script in page.tsx sets <html data-motion> before first paint, so CSS can hide
 * the hero pieces that are about to animate; this component runs the same test again.
 */

type Tier = 'full' | 'lite' | 'none';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function detectTier(): Tier {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'none';
  const n = navigator as Navigator & { deviceMemory?: number };
  const cores = n.hardwareConcurrency || 8;
  const mem = n.deviceMemory || 8;
  return cores <= 4 || mem <= 4 ? 'lite' : 'full';
}

export default function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const html = document.documentElement;
    const tier = detectTier();
    html.dataset.motion = tier;
    html.dataset.motionRan = '1';
    if (tier === 'none') return;

    gsap.registerPlugin(ScrollTrigger);
    const full = tier === 'full';
    const desktop = window.matchMedia('(min-width: 1024px)').matches;
    const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const listeners = new AbortController();
    const all = (sel: string, scope: Element = el) => gsap.utils.toArray<HTMLElement>(sel, scope);

    const prepDraw = (p: Element) => {
      const len = (p as SVGGeometryElement).getTotalLength?.() ?? 0;
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    };

    const ctx = gsap.context(() => {
      /* ------------------------------------------------------------ hero intro */
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      const words = all('[data-word]');
      // y:0 clears the translateY(110%) the boot CSS put on the words (GSAP reads it in as y)
      if (full) tl.fromTo(words, { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, stagger: 0.06 }, 0.05);
      else tl.fromTo(words, { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.03 }, 0);

      const heroDraw = all('[data-hero][data-draw]');
      heroDraw.forEach(prepDraw);
      tl.to(heroDraw, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, full ? 0.75 : 0.3);

      tl.fromTo(
        all('[data-hero-fade]'),
        { y: full ? 20 : 0, opacity: 0 },
        { y: 0, opacity: 1, duration: full ? 0.9 : 0.5, stagger: 0.08 },
        full ? 0.45 : 0.1,
      );

      const scene = el.querySelector<HTMLElement>('[data-hero-scene]');
      if (scene) {
        const part = (sel: string) => all(sel, scene);
        tl.fromTo(scene, { opacity: 0, y: full ? 24 : 0 }, { opacity: 1, y: 0, duration: full ? 1 : 0.5 }, 0.15);

        if (full) {
          tl.fromTo(part('.scene-sun'), { y: 70 }, { y: 0, duration: 1.6, ease: 'power3.out' }, 0.3)
            .fromTo(part('.scene-hill'), { y: 50 }, { y: 0, duration: 1.2, stagger: 0.1, ease: 'power3.out' }, 0.3)
            .fromTo(part('.scene-building'), { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 1.1, ease: 'power4.out' }, 0.55)
            .fromTo(
              part('.scene-window'),
              { scale: 0, transformOrigin: '50% 50%' },
              { scale: 1, duration: 0.35, ease: 'back.out(2.4)', stagger: { each: 0.03, from: 'end' } },
              1.0,
            )
            .fromTo(part('.scene-tree'), { scale: 0, transformOrigin: '50% 100%' }, { scale: 1, duration: 0.8, ease: 'back.out(2)', stagger: 0.12 }, 0.9)
            .fromTo(part('.scene-tag'), { scale: 0.6, opacity: 0, transformOrigin: '0% 100%' }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2.2)' }, 1.7);

          // small idle loops, paused whenever the hero is off screen
          const loops: gsap.core.Animation[] = [];
          part('.scene-cloud').forEach((c, i) =>
            loops.push(gsap.to(c, { x: i ? -26 : 34, duration: 7 + i * 2, ease: 'sine.inOut', yoyo: true, repeat: -1 })),
          );
          part('.scene-tree').forEach((t, i) =>
            loops.push(
              gsap.to(t, { rotation: i % 2 ? -2.5 : 2.5, transformOrigin: '50% 100%', duration: 2.4 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.7 }),
            ),
          );
          part('.scene-bird').forEach((b, i) =>
            loops.push(gsap.to(b, { y: i ? 5 : -6, x: 10, duration: 1.8 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 })),
          );
          loops.push(gsap.fromTo(part('.scene-car'), { x: -140 }, { x: 640, duration: 8, ease: 'none', repeat: -1, repeatDelay: 1.2, delay: 1.4 }));
          ScrollTrigger.create({
            trigger: scene,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: (self) => loops.forEach((l) => (self.isActive ? l.play() : l.pause())),
          });

          if (desktop) {
            part('[data-depth]').forEach((layer) => {
              const depth = Number(layer.getAttribute('data-depth')) || 0;
              gsap.to(layer, {
                y: 70 * depth,
                ease: 'none',
                scrollTrigger: { trigger: el.querySelector('[data-hero]') ?? scene, start: 'top top', end: 'bottom top', scrub: true },
              });
            });
          }
        }
      }

      /* ------------------------------------------------------------ on scroll */
      all('[data-reveal]').forEach((r) =>
        gsap.fromTo(
          r,
          { y: full ? (desktop ? 40 : 24) : 0, opacity: 0 },
          { y: 0, opacity: 1, duration: full ? 1 : 0.6, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 88%', once: true } },
        ),
      );

      all('[data-stagger]').forEach((g) =>
        gsap.fromTo(
          g.children,
          { y: full ? 28 : 0, opacity: 0 },
          { y: 0, opacity: 1, duration: full ? 0.9 : 0.5, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: g, start: 'top 85%', once: true } },
        ),
      );

      if (full) {
        all('[data-img-reveal]').forEach((frame) => {
          const st = { trigger: frame, start: 'top 85%', once: true };
          gsap.fromTo(frame, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: st });
          const img = frame.querySelector('img');
          if (img) gsap.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: st });
        });
      }

      all('[data-draw]').forEach((p) => {
        if (p.hasAttribute('data-hero')) return;
        prepDraw(p);
        gsap.to(p, {
          strokeDashoffset: 0,
          duration: full ? 1.3 : 0.7,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: p.closest('svg') ?? p, start: 'top 90%', once: true },
        });
      });

      all('[data-count]').forEach((n) => {
        const to = Number(n.getAttribute('data-count')) || 0;
        const suffix = n.getAttribute('data-suffix') ?? '';
        const o = { v: 0 };
        n.textContent = `0${suffix}`;
        gsap.to(o, {
          v: to,
          duration: full ? 1.8 : 1,
          ease: 'power2.out',
          onUpdate: () => { n.textContent = `${Math.round(o.v)}${suffix}`; },
          scrollTrigger: { trigger: n, start: 'top 92%', once: true },
        });
      });

      if (full && desktop && mouse) {
        all('[data-magnetic]').forEach((b) => {
          const xTo = gsap.quickTo(b, 'x', { duration: 0.45, ease: 'power3.out' });
          const yTo = gsap.quickTo(b, 'y', { duration: 0.45, ease: 'power3.out' });
          b.addEventListener(
            'pointermove',
            (e) => {
              const r = b.getBoundingClientRect();
              const pe = e as PointerEvent;
              xTo((pe.clientX - r.left - r.width / 2) * 0.25);
              yTo((pe.clientY - r.top - r.height / 2) * 0.3);
            },
            { signal: listeners.signal },
          );
          b.addEventListener('pointerleave', () => { xTo(0); yTo(0); }, { signal: listeners.signal });
        });
      }
    }, el);

    return () => {
      listeners.abort();
      ctx.revert();
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
