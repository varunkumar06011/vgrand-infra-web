'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

/** Counts from 0 to `to` the first time it scrolls into view. */
export default function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, to, { duration: 1.6, ease: 'easeOut', onUpdate: (v) => setVal(Math.round(v)) });
    return () => c.stop();
  }, [inView, to, reduce]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}
