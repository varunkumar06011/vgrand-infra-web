import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Leaf, ShieldCheck, Building2, Landmark, Calculator, FileCheck2, CalendarCheck } from 'lucide-react';
import DitherHero from '@/components/home/DitherHero';
import ProjectCard from '@/components/ProjectCard';
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton';
import Reveal from '@/components/ui/Reveal';
import Counter from '@/components/ui/Counter';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { mergeProjects } from '@/lib/mergeProjects';
import { renderSafeHtml } from '@/lib/safeHtml';
import { testimonials } from '@/data/testimonials';
import { SITE_WHATSAPP_NUMBER } from '@/lib/site';

export const dynamic = 'force-dynamic';

const marquee = [
  'Elite Homes — First Gated Community in Koppolu',
  'V Grand Gateway — Premium 2 & 3 BHK Flats',
  'Tripura — Affordable 2BHK Homes in Ongole',
  'V Grand Healthcare — Hospital in Ongole',
  'Trusted Builders in Ongole',
  'Low Cost Flats in Ongole with EMI Options',
];

const faqs = [
  {
    q: 'Is it safe to invest in Ongole real estate in 2026?',
    a: 'Absolutely. With <strong>Ongole property price trends 2026</strong> showing steady growth, especially near the NH-16 highway, investing in <strong>RERA approved projects in Ongole</strong> is a high-yield opportunity. The development of industrial corridors makes the <strong>Prakasam district</strong> a prime location for long-term real estate investment.',
  },
  {
    q: 'How to choose a builder in Ongole for premium flats?',
    a: "Look for <strong>trusted builders in Ongole</strong> with a track record of <strong>high quality construction</strong> and transparent documentation. V Grand Infra stands out among <strong>real estate developers in Andhra Pradesh</strong> for our commitment to 'Zero Compromise' quality and on-time delivery of <strong>ready to move apartments in Ongole</strong>.",
  },
  {
    q: 'What are the best areas to buy flats in Ongole?',
    a: 'Koppolu and areas adjacent to the NH-16 highway are currently the <strong>best areas to buy flats in Ongole</strong> due to their connectivity and infrastructure growth. Our projects offer <strong>premium lifestyle apartments</strong> and <strong>gated community flats under 30 lakhs</strong> in these high-appreciation zones.',
  },
  {
    q: 'Are there affordable apartments in Ongole for middle class families?',
    a: 'Yes, we specialize in <strong>affordable housing in Ongole</strong>. From <strong>2BHK flats near highway</strong> to <strong>budget housing projects</strong>, we offer <strong>ready to move flats in Ongole with amenities</strong> like security, parks, and 24/7 water supply, making luxury living accessible to everyone.',
  },
];

const values = [
  { icon: Leaf, title: 'Eco-Friendly Housing', body: 'We focus on building <strong>eco-friendly housing projects in Ongole</strong> with sustainable practices and green spaces.' },
  { icon: Building2, title: 'Trusted Infrastructure', body: 'As a premier <strong>infrastructure company in Ongole</strong>, we ensure our buildings exceed standard engineering norms.' },
  { icon: ShieldCheck, title: 'Modern Gated Community', body: 'Each project is a <strong>modern gated community with security in Ongole</strong>, offering peace of mind for families.' },
  { icon: Landmark, title: 'EMI & Finance', body: 'We provide <strong>low cost flats in Ongole with EMI options</strong> to make your dream home a reality within your budget.' },
];

const tools = [
  { icon: Calculator, title: 'EMI Calculator', body: 'Plan your home loan in seconds.', href: '/emi-calculator' },
  { icon: FileCheck2, title: 'Approvals & RERA', body: 'Every registration, in one place.', href: '/approvals' },
  { icon: CalendarCheck, title: 'Book a Site Visit', body: 'Walk the ground with our team.', href: '/site-visit' },
];

export default async function Home() {
  // Fall back to the built-in project data if the database is unreachable or not configured.
  let dbProjects: any[] | null = null;
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    dbProjects = data;
  } catch (err) {
    console.error('Home: could not load projects from Supabase, using static data', err);
  }

  const projects = mergeProjects(dbProjects);
  const featuredProjects = projects.slice(0, 4);

  const siteUrl = 'https://vgrandgroup.com';
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'V Grand Infra',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/projects?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
    })),
  };

  return (
    <div className="bg-petal">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }} />

      <DitherHero />

      {/* Marquee */}
      <div className="marquee-mask relative overflow-hidden whitespace-nowrap bg-forest py-4">
        <div className="marquee-track">
          {[1, 2].map((n) => (
            <span key={n} className="inline-block">
              {marquee.map((m) => (
                <span key={m} className="mr-10 text-[13px] font-medium tracking-[0.14em] uppercase text-white/85">
                  {m} <span className="ml-10 text-meadow-400">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Featured projects */}
      <section className="section">
        <div className="container-x">
          <Reveal className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Latest Developments</p>
              <h2 className="mt-4 font-heading text-forest">Best apartments in Ongole</h2>
              <p className="mt-4">
                Discover our ongoing residential projects in Ongole, featuring 2BHK and 3BHK flats near highway locations with modern amenities and high appreciation potential.
              </p>
            </div>
            <Link href="/projects" className="btn btn-ghost w-fit">
              View all projects <ArrowRight size={16} />
            </Link>
          </Reveal>
          <div className="grid gap-8 md:grid-cols-2">
            {featuredProjects.map((project: any, index: number) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="relative bg-sky-50 dither-bg py-16 md:py-20 px-5 md:px-8">
        <div className="container-x grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { n: 25, s: '+', l: 'Years of experience', count: true },
            { n: 60, s: '+', l: 'Apartments built', count: true },
            { n: 4, s: '', l: 'Projects, all RERA registered', count: true },
            { n: 2025, s: '', l: 'V Grand Infra established', count: false },
          ].map((s) => (
            <Reveal key={s.l} className="text-center">
              <p className="font-heading text-[clamp(40px,6vw,68px)] leading-none !text-forest">
                {s.count ? <Counter to={s.n} suffix={s.s} /> : `${s.n}${s.s}`}
              </p>
              <p className="mt-3 text-[13px] uppercase tracking-[0.16em] !text-forest/60">{s.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* About / founder */}
      <section className="section bg-forest text-white relative overflow-hidden">
        <div className="dither-bg-dark absolute inset-0 pointer-events-none" aria-hidden />
        <div className="container-x relative grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <p className="eyebrow !text-meadow-400">Trusted Builders in Ongole</p>
            <h2 className="mt-4 font-heading text-white">Infrastructure company in Prakasam district</h2>
            <p className="mt-6 !text-white/75 !text-[17px]">
              V Grand Infra, led by T. Vinod Kumar, has emerged as one of the <strong className="text-white">top real estate developers in Ongole</strong>. With a foundation built on 25+ years of cross-industry expertise, we are the preferred choice for families seeking <strong className="text-white">high quality construction in Ongole</strong>. Our mission is to deliver premium <strong className="text-white">residential projects in Ongole</strong> at honest prices, starting with <strong className="text-white">Elite Homes</strong> — the first gated community in Koppolu near the NH-16 highway. As <strong className="text-white">trusted builders in Ongole</strong>, we prioritize structural integrity and long-term value in every home.
            </p>
            <Link href="/about" className="btn btn-light mt-8">
              Our story <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative mx-auto max-w-md">
              <div className="absolute -inset-3 rounded-organic border border-meadow-400/40" aria-hidden />
              <Image
                src="/images/founder-vinod-kumar.jpg"
                alt="Vinod Kumar Talasila, founder of V Grand Infra"
                width={1200}
                height={1800}
                className="relative aspect-[4/5] w-full rounded-organic object-cover"
              />
              <p className="mt-4 text-center text-[13px] !text-white/60">Vinod Kumar Talasila — Founder, V Grand Infra</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Why choose us */}
      <section className="section">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Quality Commitment</p>
            <h2 className="mt-4 font-heading text-forest">Why choose V Grand Infra?</h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.07}>
                <div className="card h-full p-7 transition-transform duration-300 hover:-translate-y-1">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-meadow/12 text-meadow-600">
                    <v.icon size={24} />
                  </span>
                  <h3 className="mt-5 font-heading text-[22px] text-forest">{v.title}</h3>
                  <p className="mt-3 !text-[15px]">{renderSafeHtml(v.body)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="px-5 md:px-8 pb-20 md:pb-28">
        <div className="container-x grid gap-5 md:grid-cols-3">
          {tools.map((t, i) => (
            <Reveal key={t.title} delay={i * 0.07}>
              <Link href={t.href} className="group flex items-center gap-5 rounded-[1.5rem] border border-forest/10 bg-cream p-6 transition-all hover:bg-forest hover:border-forest">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-meadow-600">
                  <t.icon size={26} />
                </span>
                <span className="flex-1">
                  <span className="block font-heading text-[20px] text-forest group-hover:text-white transition-colors">{t.title}</span>
                  <span className="block text-[14px] text-forest/60 group-hover:text-white/70 transition-colors">{t.body}</span>
                </span>
                <ArrowRight size={20} className="text-meadow-600 transition-transform group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Happy families — appears automatically once real testimonials are added to src/data/testimonials.ts */}
      {testimonials.length > 0 && (
        <section className="section bg-cream">
          <div className="container-x">
            <Reveal className="max-w-2xl">
              <p className="eyebrow">Happy families</p>
              <h2 className="mt-4 font-heading text-forest">In their own words</h2>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i * 0.07}>
                  <figure className="card h-full p-7">
                    <blockquote className="font-heading text-[20px] leading-snug text-forest">“{t.quote}”</blockquote>
                    <figcaption className="mt-5 text-[14px] text-forest/70">
                      <strong className="text-forest">{t.name}</strong> · {t.role ?? t.project}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="section bg-cream">
        <div className="mx-auto max-w-[900px]">
          <Reveal>
            <p className="eyebrow">Expert Guidance</p>
            <h2 className="mt-4 font-heading text-forest">Ongole real estate market insights</h2>
          </Reveal>
          <div className="mt-10 divide-y divide-forest/10 border-y border-forest/10">
            {faqs.map((f) => (
              <details key={f.q} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-heading text-[20px] text-forest">
                  {f.q}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-forest/20 text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 !text-[15px]">{renderSafeHtml(f.a)}</p>
              </details>
            ))}
          </div>
          <div className="mt-12">
            <WhatsAppButton variant="banner" phoneNumber={SITE_WHATSAPP_NUMBER} title="Invest in the best real estate company in Ongole today!" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-meadow-700 px-5 py-24 text-center md:px-8">
        <div className="dither-bg-dark absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-[720px]">
          <h2 className="font-heading text-white">Premium lifestyle apartments in Ongole.</h2>
          <p className="mt-5 !text-white/85">
            Looking for <strong>flats in Ongole for sale</strong>? Explore our <strong>new housing projects in Ongole 2026</strong> and secure your investment in the <strong>best infrastructure projects in Ongole</strong>.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/projects" className="btn btn-light">Explore projects in Prakasam</Link>
            <WhatsAppButton variant="pill" phoneNumber={SITE_WHATSAPP_NUMBER} showText={true} />
          </div>
        </div>
      </section>
    </div>
  );
}
