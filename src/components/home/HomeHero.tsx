import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import HeroScene from './HeroScene';
import { Underline } from './Doodles';

/** Each word sits in its own clipping box so HomeMotion can slide it up into view. */
function Words({ text }: { text: string }) {
  const parts = text.split(' ');
  return (
    <>
      {parts.map((w, i) => (
        <span key={i}>
          <span className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
            <span data-word className="inline-block">{w}</span>
          </span>
          {i < parts.length - 1 ? ' ' : null}
        </span>
      ))}
    </>
  );
}

export default function HomeHero() {
  return (
    <section
      data-hero
      className="home-grain overflow-hidden bg-petal"
      style={{ paddingTop: 'calc(var(--page-top) + 24px)' }}
    >
      <div className="container-x relative z-10 grid items-center gap-12 px-5 pb-16 md:px-8 md:pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24">
        <div>
          <p
            data-hero-fade
            className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white/70 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-forest/80"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-meadow-400 opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-meadow-600" />
            </span>
            Now building in Koppolu
          </p>

          <h1 className="mt-6 font-heading !text-[clamp(40px,5.2vw,76px)] !leading-[1.03] tracking-[-0.015em] text-forest">
            <Words text="Gated community flats in" />{' '}
            <span className="relative inline-block whitespace-nowrap text-meadow-600">
              <Words text="Koppolu, Ongole." />
              <Underline className="pointer-events-none absolute -bottom-[0.06em] left-0 h-[0.2em] w-full text-meadow-400" />
            </span>
          </h1>

          <p data-hero-fade className="mt-7 max-w-[34rem] text-[17px] leading-relaxed text-forest/75">
            Elite Homes is the first gated community in Koppolu, next to the NH-16 highway. Quality construction, honest pricing and transparent timelines.
          </p>

          <div data-hero-fade className="mt-9 flex flex-wrap gap-3">
            <Link href="/site-visit" data-magnetic className="btn btn-primary">Book a site visit</Link>
            <Link href="/projects" data-magnetic className="btn btn-ghost">Explore projects</Link>
          </div>

          <p data-hero-fade className="mt-7 flex items-center gap-2 text-[14px] text-forest/70">
            <ShieldCheck size={18} className="text-meadow-600" /> RERA registered developer
          </p>
        </div>

        <div data-hero-scene className="relative">
          <div className="overflow-hidden rounded-[28px] shadow-lift ring-1 ring-forest/10">
            <HeroScene />
          </div>
        </div>
      </div>
    </section>
  );
}
