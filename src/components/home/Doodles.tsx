/**
 * Small line doodles for the home page. Paths marked data-draw are stroked in by HomeMotion
 * when they scroll into view; without JavaScript they simply show.
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function LeafDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path data-draw {...stroke} d="M10 38 C 10 20 22 9 40 8 C 40 26 29 38 10 38 Z" />
      <path data-draw {...stroke} d="M10 38 C 18 30 25 23 33 15" />
    </svg>
  );
}

export function BuildingDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path data-draw {...stroke} d="M12 40 V 10 H 36 V 40" />
      <path data-draw {...stroke} d="M7 40 H 41" />
      <path data-draw {...stroke} d="M18 16 H 22 M 26 16 H 30 M 18 23 H 22 M 26 23 H 30 M 18 30 H 22 M 26 30 H 30" />
    </svg>
  );
}

export function GateDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path data-draw {...stroke} d="M24 6 L 39 12 V 23 C 39 32 32 39 24 42 C 16 39 9 32 9 23 V 12 Z" />
      <path data-draw {...stroke} d="M17 24 L 22 29 L 31 19" />
    </svg>
  );
}

export function CoinsDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <ellipse data-draw {...stroke} cx="22" cy="14" rx="12" ry="5" />
      <path data-draw {...stroke} d="M10 14 V 22 C 10 25 15 27 22 27 C 29 27 34 25 34 22 V 14" />
      <path data-draw {...stroke} d="M14 30 V 34 C 14 37 19 39 26 39 C 33 39 38 37 38 34 V 26 C 38 24 36 23 34 22" />
    </svg>
  );
}

/** a little house with smoke curling from the chimney, for the closing call to action */
export function HouseDoodle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <path data-draw {...stroke} strokeWidth={2.4} d="M20 110 H 140" />
      <path data-draw {...stroke} strokeWidth={2.4} d="M36 110 V 58 L 80 24 L 124 58 V 110" />
      <path data-draw {...stroke} strokeWidth={2.4} d="M68 110 V 80 H 92 V 110" />
      <path data-draw {...stroke} strokeWidth={2.4} d="M48 64 H 62 V 76 H 48 Z M 98 64 H 112 V 76 H 98 Z" />
      <path data-draw {...stroke} strokeWidth={2.4} d="M104 40 V 22 H 114 V 48" />
      <path data-draw {...stroke} strokeWidth={2} d="M109 16 C 103 10 115 6 109 0" />
    </svg>
  );
}

/** hand-drawn underline that sits under a word in the hero headline */
export function Underline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 18" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path data-draw data-hero fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" d="M4 12 C 60 4 140 4 296 9" />
    </svg>
  );
}
