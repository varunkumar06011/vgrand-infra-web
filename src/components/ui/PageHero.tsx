import type { ReactNode } from 'react';
import Reveal from './Reveal';

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}

/** Shared page header: pale sky wash + dither texture, sits under the fixed navbar. */
export default function PageHero({ eyebrow, title, intro, children }: PageHeroProps) {
  return (
    <header className="relative overflow-hidden bg-sky-50 px-5 pb-16 pt-[148px] md:px-8 md:pb-20 md:pt-[176px]">
      <div className="dither-bg absolute inset-0 opacity-70" aria-hidden />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-petal to-transparent"
      />
      <div className="container-x relative">
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-5 max-w-[880px] font-heading text-forest">{title}</h1>
          {intro && <p className="mt-6 max-w-[640px] !text-[18px] !text-forest/70">{intro}</p>}
          {children}
        </Reveal>
      </div>
    </header>
  );
}
