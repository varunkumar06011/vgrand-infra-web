'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Check, Copy, ExternalLink, Hospital, MapPin, UtensilsCrossed } from 'lucide-react';
import { GROUP_BUSINESSES, type GroupBusiness } from '@/data/group';

const SITE = 'vgrandgroup.com';

const ICON: Record<GroupBusiness['kind'], typeof Building2> = {
  infra: Building2,
  hospital: Hospital,
  restaurant: UtensilsCrossed,
};

/** the address people see, e.g. vgrandgroup.com/restaurant/ongole */
const shownUrl = (href: string) => (href === '/' ? SITE : `${SITE}${href}`);
/** short tab label: "Infra", "Hospital", "Restaurant Ongole" … */
const tabLabel = (b: GroupBusiness) =>
  b.kind === 'infra' ? 'V Grand Infra' : b.kind === 'hospital' ? 'Hospital' : `Restaurant ${b.place}`;

/**
 * /group: the 4 V Grand businesses as small tabs side by side in a top bar (like the
 * V Grand Infra navbar). Tap one and its web address shows below; tap the address to open it.
 */
export default function GroupChooser() {
  const [sel, setSel] = useState<GroupBusiness['id'] | null>(null);
  const [copied, setCopied] = useState(false);
  const b = GROUP_BUSINESSES.find((x) => x.id === sel) ?? null;

  const copy = async () => {
    if (!b) return;
    try {
      await navigator.clipboard.writeText(`https://${shownUrl(b.href)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the address is still visible to copy by hand */
    }
  };

  return (
    <>
      {/* top bar, styled like the Infra navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-forest/10 bg-petal/95 px-3 shadow-[0_6px_24px_-12px_rgba(20,48,28,0.25)] backdrop-blur-md lg:px-8">
        <div className="container-x flex items-center gap-4 py-2 lg:h-[76px] lg:py-0">
          <span className="hidden items-center gap-3 lg:flex">
            <span className="relative block h-11 w-11 shrink-0">
              <Image src="/icon.io/apple-touch-icon.png" alt="" fill unoptimized className="rounded-xl object-contain" />
            </span>
            <span className="whitespace-nowrap font-heading text-xl leading-none text-forest">
              V Grand <span className="text-meadow-600">Groups</span>
            </span>
          </span>
          <ul className="grid flex-1 grid-cols-4 gap-1.5 lg:ml-auto lg:flex lg:flex-none lg:gap-1" role="tablist" aria-label="V Grand businesses">
            {GROUP_BUSINESSES.map((x) => {
              const Icon = ICON[x.kind];
              const on = x.id === sel;
              return (
                <li key={x.id} className="min-w-0">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls="group-url"
                    onClick={() => { setSel(on ? null : x.id); setCopied(false); }}
                    className={`flex w-full flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-center text-[11px] font-semibold leading-tight transition-colors lg:flex-row lg:gap-2 lg:px-3.5 lg:py-2 lg:text-[14px] ${
                      on ? 'bg-forest text-white' : 'text-forest hover:bg-forest/10'
                    }`}
                  >
                    <Icon size={18} className={`shrink-0 ${on ? 'text-meadow-400' : 'text-meadow-600'}`} />
                    <span className="lg:whitespace-nowrap">{tabLabel(x)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* the chosen business and its address */}
      <div id="group-url" className="mt-8 max-w-3xl" aria-live="polite">
        {b ? (
          <div className="grid overflow-hidden rounded-2xl bg-white shadow-lift md:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-[180px]">
              <Image src={b.photo.src} alt={b.photo.alt} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
              {b.kind === 'hospital' && (
                <span className="absolute bottom-2 left-2 rounded bg-forest/80 px-2 py-1 text-[11px] text-white">Artist&apos;s impression</span>
              )}
            </div>
            <div className="p-6 md:p-7">
              <span className="flex flex-wrap items-center gap-3">
                {(() => { const Icon = ICON[b.kind]; return <Icon size={24} className="text-meadow-600" />; })()}
                <span className="font-heading text-[24px] leading-tight text-forest">{b.name}</span>
              </span>
              <span lang="te" className="mt-1 block text-[15px] text-forest/60">{b.te}</span>
              <span className="mt-2 flex items-center gap-1.5 text-[15px] font-semibold text-forest/80"><MapPin size={16} /> {b.place}</span>
              <p className="mt-2 !text-[15px] text-forest/70">{b.text}</p>

              <div className="mt-5 rounded-xl bg-cream p-4">
                <span className="block text-[12px] font-semibold uppercase tracking-[0.14em] text-forest/60">Website address · వెబ్‌సైట్ లింక్</span>
                <Link
                  href={b.href}
                  className="mt-2 flex items-center gap-2 break-all text-[18px] font-semibold text-sky-600 underline underline-offset-4 hover:text-sky-500"
                >
                  {shownUrl(b.href)} <ExternalLink size={16} className="shrink-0" />
                </Link>
                <span className="mt-1 block text-[13px] text-forest/60">Tap the link to open the page</span>
                <button
                  type="button"
                  onClick={copy}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-forest/20 bg-white px-3 py-2 text-[14px] font-medium text-forest hover:bg-petal"
                >
                  {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy link</>}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-white/25 bg-white/10 p-5 !text-[16px] !text-white/85">
            ☝️ Tap one of the 4 at the top to see its website address.
          </p>
        )}
      </div>

      {/* photos of the 4 businesses */}
      <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {GROUP_BUSINESSES.map((x) => (
          <li key={x.id} className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-lift">
            <Image src={x.photo.src} alt={x.photo.alt} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {x.badge && (
              <span className="absolute left-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-900">
                {x.badge}
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 p-3">
              <span className="block font-heading text-[16px] leading-tight text-white md:text-[18px]">{x.name}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-white/85">
                <MapPin size={12} /> {x.place}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
