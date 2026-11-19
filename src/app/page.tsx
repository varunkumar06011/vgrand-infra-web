import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';
import { getTour } from '@/data/tours';
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
  { title: 'Eco-Friendly Housing', body: 'We focus on building <strong>eco-friendly housing projects in Ongole</strong> with sustainable practices and green spaces.' },
  { title: 'Trusted Infrastructure', body: 'As a premier <strong>infrastructure company in Ongole</strong>, we ensure our buildings exceed standard engineering norms.' },
  { title: 'Modern Gated Community', body: 'Each project is a <strong>modern gated community with security in Ongole</strong>, offering peace of mind for families.' },
  { title: 'EMI & Finance', body: 'We provide <strong>low cost flats in Ongole with EMI options</strong> to make your dream home a reality within your budget.' },
];

const nextSteps = [
  { title: 'EMI calculator', body: 'Work out the monthly instalment.', href: '/emi-calculator' },
  { title: 'Approvals & RERA', body: 'Registration details for every project.', href: '/approvals' },
  { title: 'Book a site visit', body: 'Walk the site with our team.', href: '/site-visit' },
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
  // One flagship gets a large feature; the rest sit below as smaller cards.
  const flagship: any = projects.find((p: any) => p.slug === 'elite-homes') ?? projects[0];
  const others = projects.filter((p: any) => p.slug !== flagship?.slug).slice(0, 3);

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

      {/* Projects: one flagship feature, the rest smaller */}
      <section className="section">
        <div className="container-x">
          <Reveal className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-heading text-forest">Homes in Koppolu, a hospital in Ongole</h2>
              <p className="mt-4">
                Discover our ongoing residential projects in Ongole, featuring 2BHK and 3BHK flats near highway locations with modern amenities and high appreciation potential.
              </p>
            </div>
            <Link href="/projects" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-forest underline underline-offset-4 decoration-forest/30 hover:decoration-forest">
              All projects <ArrowRight size={16} />
            </Link>
          </Reveal>

          {flagship && (
            <Reveal>
              <article className="card grid overflow-hidden lg:grid-cols-[1.35fr_1fr]">
                <div className="relative min-h-[280px] lg:min-h-[500px]">
                  <Image
                    src={flagship.image}
                    alt={flagship.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col p-7 md:p-10">
                  <span className="w-fit rounded-md bg-meadow-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                    {flagship.status}
                  </span>
                  <h3 className="mt-5 font-heading text-[clamp(30px,3.4vw,44px)] text-forest">{flagship.name}</h3>
                  <p className="mt-2 flex items-center gap-2 text-[14px] !text-forest/70">
                    <MapPin size={16} className="text-meadow-600" /> {flagship.location}
                  </p>
                  <p className="mt-5 line-clamp-4 !text-[15px]">{flagship.description}</p>
                  <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-forest/15 pt-7 text-[14px] tabular-nums">
                    {[
                      ['Type', flagship.type],
                      ['Area', flagship.area],
                      ['Handover', flagship.handover],
                      ['Starting price', flagship.startingPrice],
                    ]
                      .filter(([, v]) => !!v)
                      .map(([k, v]) => {
                        // "₹76 Lakhs (All Inclusive — …)" → big figure + small qualifier underneath
                        const [main, ...rest] = String(v).split(' (');
                        const note = rest.join(' (').replace(/\)$/, '');
                        const isPrice = k === 'Starting price';
                        return (
                          <div key={k}>
                            <dt className="text-[12px] uppercase tracking-[0.14em] text-forest/70">{k}</dt>
                            <dd className={`mt-1 font-medium ${isPrice ? 'font-heading text-[22px] text-sky-600' : 'text-forest'}`}>
                              {isPrice ? main : v}
                              {isPrice && note && (
                                <span className="mt-0.5 block font-body text-[12px] font-normal leading-snug text-forest/70">{note}</span>
                              )}
                            </dd>
                          </div>
                        );
                      })}
                  </dl>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href={`/projects/${flagship.slug}`} className="btn btn-primary">View project</Link>
                    {getTour(flagship.slug) && (
                      <Link href={`/projects/${flagship.slug}?tour=open`} className="btn btn-ghost">Walk through the flat</Link>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          )}

          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {others.map((project: any, index: number) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* About / founder, with the key numbers underneath */}
      <section className="section bg-forest text-white">
        <div className="container-x">
          <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
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
              <div className="mx-auto max-w-md">
                <Image
                  src="/images/founder-vinod-kumar.jpg"
                  alt="Vinod Kumar Talasila, founder of V Grand Infra"
                  width={1200}
                  height={1800}
                  className="aspect-[4/5] w-full rounded-xl object-cover"
                />
                <p className="mt-3 text-[13px] !text-white/65">Vinod Kumar Talasila — Founder, V Grand Infra</p>
              </div>
            </Reveal>
          </div>

          <dl className="mt-16 grid grid-cols-2 gap-y-8 border-t border-white/20 pt-10 md:grid-cols-4">
            {[
              { n: 25, s: '+', l: 'Years of experience', count: true },
              { n: 60, s: '+', l: 'Apartments built', count: true },
              { n: 4, s: '', l: 'Projects, all RERA registered', count: true },
              { n: 2025, s: '', l: 'V Grand Infra established', count: false },
            ].map((x) => (
              <div key={x.l}>
                <dd className="font-heading text-[clamp(36px,4.4vw,56px)] leading-none tabular-nums text-white">
                  {x.count ? <Counter to={x.n} suffix={x.s} /> : `${x.n}${x.s}`}
                </dd>
                <dt className="mt-2 text-[13px] text-white/65">{x.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* What you get — plain ruled list, no cards or icons */}
      <section className="section">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <h2 className="font-heading text-forest">What you get when you buy from V Grand Infra</h2>
          </Reveal>
          <div className="mt-12 grid gap-x-14 gap-y-10 md:grid-cols-2">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={(i % 2) * 0.06}>
                <div className="border-t border-forest/25 pt-5">
                  <h3 className="font-heading text-[24px] text-forest">{v.title}</h3>
                  <p className="mt-3 !text-[16px]">{renderSafeHtml(v.body)}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-20 grid gap-8 border-t border-forest/25 pt-8 md:grid-cols-3">
            {nextSteps.map((t) => (
              <Link key={t.title} href={t.href} className="group block">
                <span className="flex items-center justify-between font-heading text-[22px] text-forest">
                  {t.title}
                  <ArrowRight size={20} className="text-meadow-600 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="mt-1 block text-[15px] text-forest/70">{t.body}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Happy families — appears automatically once real testimonials are added to src/data/testimonials.ts */}
      {testimonials.length > 0 && (
        <section className="section border-t border-forest/15">
          <div className="container-x">
            <Reveal className="max-w-2xl">
              <h2 className="font-heading text-forest">In their own words</h2>
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
      <section className="section border-t border-forest/15">
        <div className="mx-auto max-w-[900px]">
          <Reveal>
            <h2 className="font-heading text-forest">Ongole real estate: your questions answered</h2>
          </Reveal>
          <div className="mt-10 divide-y divide-forest/15 border-y border-forest/15">
            {faqs.map((f) => (
              <details key={f.q} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-heading text-[20px] text-forest">
                  {f.q}
                  <span className="text-[28px] font-light leading-none text-meadow-600 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 !text-[15px]">{renderSafeHtml(f.a)}</p>
              </details>
            ))}
          </div>
          <div className="mt-10">
            <WhatsAppButton variant="banner" phoneNumber={SITE_WHATSAPP_NUMBER} title="Invest in the best real estate company in Ongole today!" />
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="border-t border-forest/15 bg-cream px-5 py-20 md:px-8 md:py-24">
        <div className="container-x grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="font-heading text-forest">Visit Elite Homes in Koppolu</h2>
            <p className="mt-4 max-w-xl">
              Looking for <strong>flats in Ongole for sale</strong>? Explore our <strong>new housing projects in Ongole 2026</strong> and secure your investment in the <strong>best infrastructure projects in Ongole</strong>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/site-visit" className="btn btn-primary">Book a site visit</Link>
            <WhatsAppButton variant="pill" phoneNumber={SITE_WHATSAPP_NUMBER} showText={true} />
          </div>
        </div>
      </section>
    </div>
  );
}
