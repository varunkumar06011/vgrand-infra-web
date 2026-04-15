'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * RouteHandler: Global client component to handle cross-route UI stability.
 * FIX 5: Explicitly resets scroll to top with behavior: 'instant' to prevent
 * black flashes on canvas-dependent pages.
 */
export default function RouteHandler() {
  const pathname = usePathname();

  useEffect(() => {
    // FIX 5: SCOPE THE RouteHandler SCROLL RESET
    window.scrollTo({ top: 0, behavior: 'instant' });

    // RE-INITIALISE ANIMATIONS ON ROUTE CHANGE (AOS/GSAP SAFETY)
    if (typeof window !== 'undefined' && (window as any).AOS) {
      (window as any).AOS.refresh();
    }

    if (typeof window !== 'undefined' && (window as any).gsap && (window as any).ScrollTrigger) {
      (window as any).ScrollTrigger.refresh();
    }
  }, [pathname]);

  return null;
}
