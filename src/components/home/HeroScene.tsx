/**
 * Illustrated hero scene for the home page: Elite Homes (5 floors, 60 homes) on the meadow
 * beside NH-16. Plain SVG; HomeMotion animates it through the `scene-*` class names.
 * Every animated group uses transform-box: fill-box so GSAP can scale/rotate from its own edge.
 */

const FLOORS = 5;
const COLS = 4;
const box = { transformBox: 'fill-box' as const };

export default function HeroScene() {
  const windows = [];
  for (let f = 0; f < FLOORS; f++) {
    for (let c = 0; c < COLS; c++) {
      windows.push(
        <rect
          key={`${f}-${c}`}
          className="scene-window"
          x={212 + c * 45}
          y={202 + f * 38}
          width={26}
          height={20}
          rx={3}
          fill="#f6f3e8"
          style={{ ...box, transformOrigin: '50% 50%' }}
        />,
      );
    }
  }

  return (
    <svg
      viewBox="0 0 560 520"
      role="img"
      aria-label="Illustration of the Elite Homes building, five floors tall, on the meadow next to the NH-16 highway"
      className="block h-auto w-full"
    >
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dce9f6" />
          <stop offset="0.65" stopColor="#eef4fb" />
          <stop offset="1" stopColor="#f6f3e8" />
        </linearGradient>
        <clipPath id="hs-card">
          <rect width="560" height="520" rx="28" />
        </clipPath>
      </defs>

      <g clipPath="url(#hs-card)">
        <rect width="560" height="520" fill="url(#hs-sky)" />

        {/* sun (outer group: scroll parallax, inner group: intro) */}
        <g data-depth="0.6">
          <g className="scene-sun">
            <circle cx="430" cy="128" r="72" fill="#f2b35b" opacity="0.18" />
            <circle cx="430" cy="128" r="44" fill="#f2b35b" />
          </g>
        </g>

        {/* clouds (outer group: scroll parallax, inner group: drift) */}
        <g data-depth="0.35">
          <g className="scene-cloud" fill="#ffffff">
            <rect x="70" y="92" width="118" height="34" rx="17" />
            <circle cx="112" cy="90" r="24" />
            <circle cx="146" cy="96" r="18" />
          </g>
          <g className="scene-cloud" fill="#ffffff" opacity="0.9">
            <rect x="300" y="58" width="92" height="26" rx="13" />
            <circle cx="332" cy="58" r="18" />
            <circle cx="358" cy="62" r="13" />
          </g>
        </g>

        {/* birds */}
        <g fill="none" stroke="#14301c" strokeWidth="2.2" strokeLinecap="round">
          <path className="scene-bird" d="M236 112 q7 -7 14 0 q7 -7 14 0" />
          <path className="scene-bird" d="M268 134 q5 -5 10 0 q5 -5 10 0" />
        </g>

        {/* hills */}
        <path className="scene-hill" d="M-20 360 C 90 290 190 300 300 340 S 480 300 580 330 L 580 520 L -20 520 Z" fill="#6aa83e" opacity="0.55" />
        <path className="scene-hill" d="M-20 400 C 110 352 240 372 330 392 S 500 370 580 386 L 580 520 L -20 520 Z" fill="#4a8a2a" />

        {/* building */}
        <g className="scene-building" style={{ ...box, transformOrigin: '50% 100%' }}>
          <rect x="196" y="176" width="200" height="12" rx="3" fill="#24512f" />
          <rect x="200" y="186" width="192" height="234" rx="6" fill="#14301c" />
          {[0, 1, 2, 3, 4].map((f) => (
            <rect key={f} x="200" y={226 + f * 38} width="192" height="3" fill="#24512f" />
          ))}
          {windows}
          <rect x="281" y="392" width="30" height="28" rx="4" fill="#f2b35b" />
        </g>

        {/* label */}
        <g className="scene-tag" style={{ ...box, transformOrigin: '0% 100%' }}>
          <path d="M392 229 L 406 229" stroke="#14301c" strokeWidth="1.6" />
          <rect x="406" y="214" width="128" height="30" rx="15" fill="#f6f3e8" stroke="#14301c" strokeOpacity="0.15" />
          <text x="470" y="234" textAnchor="middle" fontSize="13" fontWeight="600" fill="#14301c" style={{ fontFamily: 'var(--font-body), Inter, sans-serif' }}>
            5 floors · 60 homes
          </text>
        </g>

        {/* trees */}
        {[
          { x: 120, y: 420, s: 1 },
          { x: 152, y: 424, s: 0.72 },
          { x: 440, y: 420, s: 0.9 },
        ].map((t, i) => (
          <g key={i} className="scene-tree" style={{ ...box, transformOrigin: '50% 100%' }}>
            <rect x={t.x - 3 * t.s} y={t.y - 30 * t.s} width={6 * t.s} height={30 * t.s} rx={2} fill="#5b4a35" />
            <circle cx={t.x} cy={t.y - 46 * t.s} r={24 * t.s} fill="#3b7122" />
            <circle cx={t.x - 8 * t.s} cy={t.y - 54 * t.s} r={11 * t.s} fill="#6aa83e" opacity="0.8" />
          </g>
        ))}

        {/* NH-16 road */}
        <rect y="430" width="560" height="54" fill="#1b3f27" />
        <line x1="0" y1="457" x2="560" y2="457" stroke="#f6f3e8" strokeWidth="3" strokeDasharray="22 18" opacity="0.7" />
        <rect y="484" width="560" height="36" fill="#3b7122" />
        <g>
          <rect x="474" y="398" width="4" height="32" fill="#5b4a35" />
          <rect x="452" y="380" width="48" height="22" rx="5" fill="#2f6fdc" />
          <text x="476" y="395" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff" style={{ fontFamily: 'var(--font-body), Inter, sans-serif' }}>
            NH-16
          </text>
        </g>

        {/* car */}
        <g className="scene-car">
          <rect x="40" y="440" width="62" height="20" rx="7" fill="#2f6fdc" />
          <path d="M54 440 L 62 428 L 86 428 L 94 440 Z" fill="#2459b8" />
          <rect x="64" y="431" width="10" height="8" rx="1.5" fill="#eef4fb" />
          <rect x="77" y="431" width="10" height="8" rx="1.5" fill="#eef4fb" />
          <circle cx="56" cy="461" r="6" fill="#14301c" />
          <circle cx="88" cy="461" r="6" fill="#14301c" />
        </g>
      </g>
    </svg>
  );
}
