'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Phone, Mail, ChevronDown, ArrowUpRight } from 'lucide-react';
import EnquireModal from './EnquireModal';
import { navLinks, navProjects } from '@/data/nav';
import {
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  SITE_EMAIL,
  SITE_HOURS,
} from '@/lib/site';

// Pages whose first section is a full-bleed dark/photo hero: the bar starts transparent with light text.
const HERO_PATHS = ['/'];

const Navbar = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [enquireOpen, setEnquireOpen] = useState(false);

  const overHero = HERO_PATHS.includes(pathname) && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setProjectsOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  // The hero base is pale, so nav text stays dark on every page.
  const textTone = 'text-forest';

  return (
    <header className="fixed inset-x-0 top-0 z-[1000]">
      {/* Utility bar — collapses once the page is scrolled */}
      <div
        className={`hidden lg:block overflow-hidden bg-forest text-white/80 text-[12px] transition-all duration-300 ${
          scrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'
        }`}
      >
        <div className="container-x flex h-10 items-center justify-between px-8">
          <span className="tracking-wide">{SITE_HOURS}</span>
          <div className="flex items-center gap-6">
            <a href={`mailto:${SITE_EMAIL}`} className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail size={13} /> {SITE_EMAIL}
            </a>
            <a href={`tel:${SITE_PHONE_TEL}`} className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone size={13} /> {SITE_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </div>

      <nav
        aria-label="Main"
        className={`transition-all duration-300 ${
          overHero
            ? 'bg-transparent'
            : 'bg-petal/90 backdrop-blur-md border-b border-forest/10 shadow-[0_6px_24px_-12px_rgba(20,48,28,0.25)]'
        }`}
      >
        <div className="container-x flex h-[64px] lg:h-[76px] items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="V Grand Infra — home">
            <span className="relative block h-11 w-11 lg:h-12 lg:w-12">
              <Image
                src="/icon.io/apple-touch-icon.png"
                alt=""
                fill
                priority
                unoptimized
                className="rounded-xl object-contain"
              />
            </span>
            <span className={`hidden sm:block font-heading text-xl leading-none ${textTone}`}>
              V Grand <span className="italic text-meadow-400">Infra</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              'dropdown' in link && link.dropdown ? (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => setProjectsOpen(true)}
                  onMouseLeave={() => setProjectsOpen(false)}
                >
                  <Link
                    href={link.href}
                    className={`flex items-center gap-1 rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${textTone} ${
                      isActive(link.href) ? 'bg-meadow/15' : 'hover:bg-meadow/10'
                    }`}
                  >
                    {link.name}
                    <ChevronDown size={14} className={`transition-transform ${projectsOpen ? 'rotate-180' : ''}`} />
                  </Link>

                  <AnimatePresence>
                    {projectsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-1/2 top-full w-[380px] -translate-x-1/2 pt-3"
                      >
                        <div className="rounded-3xl bg-white p-3 shadow-lift border border-forest/10">
                          {(['Ongoing', 'Upcoming'] as const).map((group) => (
                            <div key={group} className="mb-1 last:mb-0">
                              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-meadow-600">
                                {group}
                              </p>
                              {navProjects
                                .filter((p) => p.group === group)
                                .map((p) => (
                                  <Link
                                    key={p.slug}
                                    href={`/projects/${p.slug}`}
                                    className="flex items-center justify-between rounded-2xl px-4 py-2.5 hover:bg-cream transition-colors"
                                  >
                                    <span>
                                      <span className="block font-heading text-[16px] text-forest">{p.name}</span>
                                      <span className="block text-[12px] text-forest/60">{p.note}</span>
                                    </span>
                                    <ArrowUpRight size={16} className="text-meadow" />
                                  </Link>
                                ))}
                            </div>
                          ))}
                          <Link
                            href="/projects"
                            className="mt-2 block rounded-2xl bg-forest px-4 py-3 text-center text-[13px] font-semibold text-white hover:bg-forest-700 transition-colors"
                          >
                            View all projects
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${textTone} ${
                    isActive(link.href) ? 'bg-meadow/15' : 'hover:bg-meadow/10'
                  }`}
                >
                  {link.name}
                </Link>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${SITE_PHONE_TEL}`}
              aria-label="Call us"
              className="hidden md:inline-flex lg:hidden xl:inline-flex h-11 w-11 items-center justify-center rounded-full border border-forest/20 text-forest transition-colors hover:bg-forest hover:text-white"
            >
              <Phone size={17} />
            </a>
            <button
              onClick={() => setEnquireOpen(true)}
              className="btn btn-primary !px-5 !py-2.5 text-[13px]"
            >
              Enquire
              <span className="hidden sm:inline"> Now</span>
            </button>
            <button
              className={`lg:hidden ml-1 flex h-11 w-11 items-center justify-center rounded-full ${textTone}`}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="lg:hidden fixed inset-x-0 top-[64px] bottom-0 overflow-y-auto bg-petal px-6 pb-10 pt-4"
          >
            <ul className="flex flex-col">
              {navLinks.map((link) => (
                <li key={link.name} className="border-b border-forest/10">
                  <Link
                    href={link.href}
                    className={`flex items-center justify-between py-4 font-heading text-2xl ${
                      isActive(link.href) ? 'text-meadow-600' : 'text-forest'
                    }`}
                  >
                    {link.name}
                    <ArrowUpRight size={20} className="text-meadow" />
                  </Link>
                  {'dropdown' in link && link.dropdown && (
                    <div className="pb-4 pl-1 grid gap-2">
                      {navProjects.map((p) => (
                        <Link
                          key={p.slug}
                          href={`/projects/${p.slug}`}
                          className="flex items-center justify-between rounded-xl bg-cream px-4 py-3 text-[15px] text-forest"
                        >
                          <span>{p.name}</span>
                          <span className="text-[11px] uppercase tracking-wider text-meadow-600">{p.group}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-8 grid gap-3">
              <a href={`tel:${SITE_PHONE_TEL}`} className="btn btn-dark w-full"><Phone size={16} /> {SITE_PHONE_DISPLAY}</a>
              <a href={`mailto:${SITE_EMAIL}`} className="btn btn-ghost w-full"><Mail size={16} /> {SITE_EMAIL}</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EnquireModal isOpen={enquireOpen} onClose={() => setEnquireOpen(false)} />
    </header>
  );
};

export default Navbar;
