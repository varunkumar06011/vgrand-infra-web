import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, MapPin, Phone } from 'lucide-react';
import { GROUP_BUSINESSES, telHref } from '@/data/group';

function Logo({ name, place, light }: { name: string; place: string; light?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="relative block h-11 w-11 shrink-0">
        <Image src="/icon.io/apple-touch-icon.png" alt="" fill unoptimized className="rounded-xl object-contain" />
      </span>
      <span className={`font-heading text-xl leading-none ${light ? 'text-white' : 'text-forest'}`}>
        {name} <span className="text-meadow-400">{place}</span>
      </span>
    </span>
  );
}

/**
 * Header + footer for the restaurant / hospital pages, styled like the V Grand Infra navbar and
 * footer (the Infra ones link to flat projects, so these pages use their own).
 * The header is fixed like the Infra navbar, so PageHero's top padding fits under it.
 */
export default function GroupShell({
  name, place, phone, address, mapsHref, children,
}: {
  name: string;
  place: string;
  phone: string;
  address: string[];
  /** Google Maps link; null when the place isn't on Maps yet */
  mapsHref: string | null;
  children: ReactNode;
}) {
  const others = GROUP_BUSINESSES.filter((b) => !(b.name === name && b.place === place));
  const addr = (
    <>
      <MapPin size={18} className="mt-1 shrink-0 text-meadow-400" /> {address.join(', ')}
    </>
  );
  return (
    <div className="bg-petal">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-forest/10 bg-petal/90 px-5 shadow-[0_6px_24px_-12px_rgba(20,48,28,0.25)] backdrop-blur-md lg:px-8">
        <div className="container-x flex h-[64px] items-center justify-between gap-4 lg:h-[76px]">
          <Link href="/group" aria-label="V Grand Groups: all businesses">
            <Logo name={name} place={place} />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/group" className="hidden items-center gap-1.5 px-3 py-2 text-[15px] font-medium text-forest/80 hover:text-forest sm:inline-flex">
              <ArrowLeft size={16} /> V Grand Groups
            </Link>
            <a href={telHref(phone)} className="btn btn-primary !px-4 !py-2.5">
              <Phone size={16} /> Call
            </a>
          </div>
        </div>
      </nav>

      {children}

      <footer className="bg-forest px-5 py-14 text-white/80 md:px-8">
        <div className="container-x grid gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <Logo name={name} place={place} light />
            {mapsHref ? (
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="mt-6 flex gap-2 text-[15px] hover:text-white">{addr}</a>
            ) : (
              <p className="mt-6 flex gap-2 !text-[15px] !text-white/80">{addr}</p>
            )}
            <a href={telHref(phone)} className="mt-2 flex gap-2 text-[15px] hover:text-white">
              <Phone size={18} className="mt-1 shrink-0 text-meadow-400" /> {phone}
            </a>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] !text-white/60">Also from V Grand Groups</p>
            <ul className="mt-4 grid gap-2">
              {others.map((b) => (
                <li key={b.id}>
                  <Link href={b.href} className="text-[15px] hover:text-white">
                    {b.name} <span className="text-white/55">· {b.place}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="container-x mt-10 border-t border-white/10 pt-6 !text-[13px] !text-white/50">
          © {new Date().getFullYear()} V Grand Groups, Ongole
        </p>
      </footer>
    </div>
  );
}
