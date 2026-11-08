import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';
import { navProjects } from '@/data/nav';
import {
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  SITE_EMAIL,
  SITE_ADDRESS_LINES,
  SITE_MAPS_URL,
  SITE_INSTAGRAM,
  SITE_FACEBOOK,
  SITE_HOURS,
} from '@/lib/site';

const quickLinks = [
  { name: 'Home', href: '/' },
  { name: 'All Projects', href: '/projects' },
  { name: 'About Us', href: '/about' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Approvals & RERA', href: '/approvals' },
  { name: 'EMI Calculator', href: '/emi-calculator' },
  { name: 'Book a Site Visit', href: '/site-visit' },
  { name: 'Contact', href: '/contact' },
];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-forest text-white/70">
      <div className="dither-bg-dark absolute inset-0 opacity-60 pointer-events-none" aria-hidden />

      <div className="relative container-x px-5 md:px-8 pt-20 pb-10">
        {/* Big closing line */}
        <div className="mb-16 grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <h2 className="font-heading text-[clamp(34px,5vw,64px)] leading-[1.05] text-white">
            Homes that grow <span className="italic text-meadow-400">with the land</span> they stand on.
          </h2>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/site-visit" className="btn btn-primary">Book a site visit</Link>
            <a href={`tel:${SITE_PHONE_TEL}`} className="btn border border-white/25 text-white hover:bg-white hover:text-forest">
              <Phone size={16} /> Call us
            </a>
          </div>
        </div>

        <div className="grid gap-12 border-t border-white/10 pt-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
          <div>
            <div className="font-heading text-2xl text-white leading-none mb-4">
              V Grand <span className="italic text-meadow-400">Infra</span>
            </div>
            <p className="text-[14px] text-white/60 leading-relaxed max-w-xs">
              Quality construction, honest pricing and transparent timelines — building homes for families across Ongole and Prakasam district.
            </p>
            <div className="mt-5 flex items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-[12px] leading-relaxed text-white/70">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-meadow-400" />
              <span>
                RERA registered developer.{' '}
                <Link href="/approvals" className="text-white underline underline-offset-4 hover:text-meadow-400">
                  View registrations
                </Link>
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/40 mb-5 font-body">Explore</h3>
            <ul className="grid gap-2.5 text-[14px]">
              {quickLinks.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="hover:text-white transition-colors">{l.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/40 mb-5 font-body">Projects</h3>
            <ul className="grid gap-2.5 text-[14px]">
              {navProjects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/projects/${p.slug}`} className="hover:text-white transition-colors">
                    {p.name}
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-meadow-400">{p.group}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/40 mb-5 font-body">Visit & contact</h3>
            <address className="not-italic grid gap-3.5 text-[14px]">
              <a href={SITE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-white transition-colors">
                <MapPin size={16} className="mt-1 shrink-0 text-meadow-400" />
                <span>{SITE_ADDRESS_LINES.map((l, i) => (<span key={l}>{l}{i < SITE_ADDRESS_LINES.length - 1 && <br />}</span>))}</span>
              </a>
              <a href={`tel:${SITE_PHONE_TEL}`} className="flex items-center gap-3 hover:text-white transition-colors">
                <Phone size={16} className="shrink-0 text-meadow-400" /> {SITE_PHONE_DISPLAY}
              </a>
              <a href={`mailto:${SITE_EMAIL}`} className="flex items-center gap-3 hover:text-white transition-colors break-all">
                <Mail size={16} className="shrink-0 text-meadow-400" /> {SITE_EMAIL}
              </a>
              <span className="flex items-center gap-3">
                <Clock size={16} className="shrink-0 text-meadow-400" /> {SITE_HOURS}
              </span>
            </address>
            <div className="mt-5 flex gap-3 text-[13px]">
              <a href={SITE_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-4 py-1.5 hover:bg-white hover:text-forest transition-colors">Instagram</a>
              <a href={SITE_FACEBOOK} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-4 py-1.5 hover:bg-white hover:text-forest transition-colors">Facebook</a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-[12px] text-white/45 md:flex-row md:items-center md:justify-between">
          <p className="!text-[12px] !text-white/45">© {new Date().getFullYear()} V Grand Infra. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
