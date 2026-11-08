'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const presets = [
  { name: 'Tripura', price: 36 },
  { name: 'Elite Homes', price: 76 },
];

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(n));

function Slider({
  id, label, value, min, max, step, onChange, display,
}: {
  id: string; label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; display: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-[13px] font-semibold uppercase tracking-[0.14em] text-forest/70">{label}</label>
        <span className="font-heading text-[22px] text-forest">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-meadow-600"
        style={{ background: `linear-gradient(to right, #3b7122 ${pct}%, rgba(20,48,28,0.12) ${pct}%)` }}
      />
    </div>
  );
}

export default function EmiCalculator() {
  const [priceL, setPriceL] = useState(50);       // property price, in lakhs
  const [downPct, setDownPct] = useState(20);     // down payment %
  const [rate, setRate] = useState(8.75);         // % p.a.
  const [years, setYears] = useState(20);

  const r = useMemo(() => {
    const price = priceL * 100000;
    const loan = price * (1 - downPct / 100);
    const n = years * 12;
    const i = rate / 12 / 100;
    const emi = i === 0 ? loan / n : (loan * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    const total = emi * n;
    return { price, loan, emi, total, interest: total - loan, down: price - loan };
  }, [priceL, downPct, rate, years]);

  // Donut: principal vs interest
  const C = 2 * Math.PI * 70;
  const principalShare = r.total ? r.loan / r.total : 1;

  return (
    <div className="grid gap-8 tabular-nums lg:grid-cols-[1.15fr_0.85fr]">
      <div className="card p-6 md:p-10">
        <div className="mb-8">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-forest/70">Quick-fill from a project</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setPriceL(p.price)}
                className={`rounded-md border px-4 py-2 text-[13px] font-medium transition ${
                  priceL === p.price ? 'border-meadow-600 bg-meadow-600 text-white' : 'border-forest/20 text-forest hover:border-forest'
                }`}
              >
                {p.name} · ₹{p.price} L
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-9">
          <Slider id="price" label="Property price" value={priceL} min={10} max={150} step={1} onChange={setPriceL} display={`₹${priceL} Lakhs`} />
          <Slider id="down" label="Down payment" value={downPct} min={10} max={80} step={5} onChange={setDownPct} display={`${downPct}%  ·  ${inr(r.down)}`} />
          <Slider id="rate" label="Interest rate (p.a.)" value={rate} min={6} max={14} step={0.05} onChange={setRate} display={`${rate.toFixed(2)}%`} />
          <Slider id="years" label="Loan tenure" value={years} min={5} max={30} step={1} onChange={setYears} display={`${years} years`} />
        </div>
        <p className="mt-8 text-[12px] !text-forest/70">
          Estimates only. Actual rates, eligibility and charges depend on your bank. Down-payment, registration and other charges are not included.
        </p>
      </div>

      <div className="grid content-start gap-6">
        <div className="relative overflow-hidden rounded-xl bg-forest p-8 text-white">
          <div className="relative">
            <p className="text-[12px] uppercase tracking-[0.2em] text-white/60">Your monthly EMI</p>
            <p key={Math.round(r.emi)} className="anim-tick mt-2 font-heading text-[clamp(38px,5vw,56px)] leading-none !text-white" aria-live="polite">{inr(r.emi)}</p>

            <div className="mt-8 flex items-center gap-6">
              <svg viewBox="0 0 180 180" className="h-36 w-36 shrink-0 -rotate-90" role="img" aria-label={`Principal ${Math.round(principalShare * 100)} percent, interest ${Math.round((1 - principalShare) * 100)} percent`}>
                <circle cx="90" cy="90" r="70" fill="none" stroke="#6aa83e" strokeWidth="22" opacity="0.35" />
                <circle
                  cx="90" cy="90" r="70" fill="none" stroke="#6aa83e" strokeWidth="22"
                  strokeDasharray={`${C * principalShare} ${C}`}
                  style={{ transition: 'stroke-dasharray 400ms ease' }}
                />
                <circle
                  cx="90" cy="90" r="70" fill="none" stroke="#9cc6f5" strokeWidth="22"
                  strokeDasharray={`${C * (1 - principalShare)} ${C}`}
                  strokeDashoffset={-C * principalShare}
                  style={{ transition: 'stroke-dasharray 400ms ease, stroke-dashoffset 400ms ease' }}
                />
              </svg>
              <ul className="grid gap-4 text-[14px]">
                <li><span className="mb-1 flex items-center gap-2 text-white/60"><i className="h-2.5 w-2.5 rounded-full bg-meadow-400" />Loan amount</span><b className="font-heading text-[19px] font-medium">{inr(r.loan)}</b></li>
                <li><span className="mb-1 flex items-center gap-2 text-white/60"><i className="h-2.5 w-2.5 rounded-full bg-[#9cc6f5]" />Total interest</span><b className="font-heading text-[19px] font-medium">{inr(r.interest)}</b></li>
              </ul>
            </div>

            <div className="mt-8 flex items-baseline justify-between border-t border-white/15 pt-5 text-[14px]">
              <span className="text-white/60">Total payable</span>
              <b className="font-heading text-[20px] font-medium">{inr(r.total)}</b>
            </div>
          </div>
        </div>

        <Link href="/site-visit" className="btn btn-primary w-full">Book a site visit</Link>
      </div>
    </div>
  );
}
