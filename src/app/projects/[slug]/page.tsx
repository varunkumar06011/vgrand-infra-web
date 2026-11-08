import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { MapPin, Phone, Calculator, CalendarCheck, Check } from 'lucide-react';
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton';
import ConstructionUpdateSlideshow from '@/components/ConstructionUpdateSlideshow';
import BrochureDownload from '@/components/BrochureDownload';
import ProjectTour from '@/components/tour/ProjectTour';
import ScrollFlatHero from '@/components/home/ScrollFlatHero';
import Reveal from '@/components/ui/Reveal';
import { getFlatTour } from '@/data/flatTours';
import { getProject } from '@/lib/getProject';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { SITE_WHATSAPP_NUMBER, SITE_PHONE_TEL } from '@/lib/site';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  return {
    title: `${project.name} | ${project.type} in ${project.location} | V Grand Infra`,
    description: `Explore ${project.name}, a ${project.type} project in ${project.location} by V Grand Infra. RERA registered, quality construction and transparent pricing.`,
    keywords: `${project.name.toLowerCase()}, flats in ongole, apartments in ${project.location.toLowerCase()}, real estate in prakasam`,
    alternates: { canonical: `https://vgrandgroup.com/projects/${slug}` },
  };
}

const statusTone: Record<string, string> = {
  Ongoing: 'bg-meadow-600 text-white',
  Upcoming: 'bg-sky text-white',
  Completed: 'bg-forest text-white',
};

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return notFound();

  // Local construction-update media (already in /public/images), matched by slug keyword.
  const staticImageMap: Record<string, { id: number; image_url: string; label: string; created_at: string }[]> = {
    elite: [
      { id: -1, image_url: '/images/elite%20construction%20update%201%20.jpeg', label: 'Elite Homes – Construction Update 1', created_at: '' },
      { id: -2, image_url: '/images/elite%20construction%20update%202%20%20copy.jpeg', label: 'Elite Homes – Construction Update 2', created_at: '' },
    ],
    tripura: [
      { id: -1, image_url: '/images/tripura%20construction%20update.png', label: 'Tripura – Construction Update', created_at: '' },
      { id: -2, image_url: '/images/WhatsApp%20Video%202026-07-09%20at%2011.45.24.mp4', label: 'Tripura – Construction Update Video', created_at: '' },
    ],
  };
  const matchedKey = Object.keys(staticImageMap).find((key) => slug.toLowerCase().includes(key));
  const staticImages = matchedKey ? staticImageMap[matchedKey] : [];

  let dbImages: { id: number; image_url: string; label?: string; created_at: string }[] = [];
  if (project.fromDb && project.id) {
    try {
      const supabase = getAdminClient();
      const { data } = await supabase
        .from('construction_updates')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });
      if (Array.isArray(data)) dbImages = data;
    } catch {
      // Table may not exist yet — fine
    }
  }
  const constructionImages = [...staticImages, ...dbImages];

  const siteUrl = 'https://vgrandgroup.com';
  const realEstateSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: project.name,
    description: project.description,
    url: `${siteUrl}/projects/${slug}`,
    image: project.image?.startsWith('http') ? project.image : `${siteUrl}${project.image}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: project.location,
      addressLocality: 'Ongole',
      addressRegion: 'Andhra Pradesh',
      addressCountry: 'IN',
    },
    accommodationCategory: project.type,
  };

  const flatTour = getFlatTour(slug);
  const inKoppolu = /koppolu/i.test(project.location || '');
  const hasRera = !!project.rera && !/to be added|applied/i.test(project.rera);

  const facts: [string, string][] = [
    ['Location', project.location],
    ['Type', project.type],
    ['Area', project.area],
    ['Handover', project.handover],
    ['Price', project.startingPrice],
  ].filter(([, v]) => !!v) as [string, string][];

  const staticHero = (
    <div className="relative h-[78vh] min-h-[520px] w-full overflow-hidden bg-forest">
      <Image src={project.image} alt={project.name} fill priority sizes="100vw" className="object-cover" quality={90} />
      <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/35 to-forest/10" />
      <div className="mx-auto w-full max-w-[1264px] absolute inset-x-0 bottom-0 px-5 pb-14 md:px-8 md:pb-20">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-md px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusTone[project.status] ?? 'bg-forest text-white'}`}>
            {project.status}
          </span>
        </div>
        <h1 className="mt-5 max-w-4xl font-heading text-white">{project.name}</h1>
        <p className="mt-3 flex items-center gap-2 text-[17px] !text-white/85">
          <MapPin size={18} className="text-meadow-400" /> {project.location}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/site-visit`} className="btn btn-primary">Book a site visit</Link>
          <a href={`tel:${SITE_PHONE_TEL}`} className="btn border border-white/40 text-white hover:bg-white hover:text-forest">
            <Phone size={16} /> Call us
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-petal">
      <Script id="schema-realestate" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(realEstateSchema) }} />

      {flatTour ? (
        <ScrollFlatHero tour={flatTour} projectName={project.name} fallback={staticHero} />
      ) : (
        staticHero
      )}

      <div className="mx-auto w-full max-w-[1264px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_0.9fr]">
          {/* Main column */}
          <div className="min-w-0">
            <Reveal>
              <p className="!text-[18px] !leading-[1.85]">{project.description}</p>
            </Reveal>

            {/* Virtual tour — renders only for slugs with a tour config */}
            <div className="mt-16">
              <ProjectTour slug={slug} />
            </div>

            {project.highlights.length > 0 && (
              <section className="mt-16">
                <Reveal>
                  <h2 className="font-heading text-forest">Key highlights</h2>
                </Reveal>
                <ul className="mt-8 divide-y divide-forest/15 border-y border-forest/15">
                  {project.highlights.map((h: string, i: number) => (
                    <li key={i} className="flex gap-3 py-4 text-[16px] text-forest">
                      <Check size={18} className="mt-1 shrink-0 text-meadow-600" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {project.amenities.length > 0 && (
              <section className="mt-16">
                <Reveal><h2 className="font-heading text-forest">Amenities</h2></Reveal>
                <div className="mt-8 flex flex-wrap gap-3">
                  {project.amenities.map((a: string) => (
                    <span key={a} className="rounded-md border border-meadow/30 bg-meadow/10 px-5 py-2.5 text-[14px] text-forest">{a}</span>
                  ))}
                </div>
              </section>
            )}

            {Object.keys(project.specs).length > 0 && (
              <section className="mt-16">
                <Reveal><h2 className="font-heading text-forest">Specifications &amp; materials</h2></Reveal>
                <div className="mt-8 overflow-hidden rounded-xl border border-forest/10 bg-white">
                  {Object.entries(project.specs).map(([key, val], i) => (
                    <div key={key} className={`grid gap-1 px-6 py-4 sm:grid-cols-[200px_1fr] sm:gap-6 ${i % 2 ? 'bg-cream/50' : ''}`}>
                      <dt className="font-heading text-[16px] text-forest">{key}</dt>
                      <dd className="text-[15px] text-forest/75">{val as string}</dd>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {constructionImages.length > 0 || (project.fromDb && project.id) ? (
              <section className="mt-16">
                <ConstructionUpdateSlideshow projectId={project.id ?? 0} initialImages={constructionImages} />
              </section>
            ) : null}

            {inKoppolu && (
              <section className="mt-16">
                <Reveal><h2 className="font-heading text-forest">Location</h2></Reveal>
                <iframe
                  title={`${project.name} location map`}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3841.123!2d80.0537!3d15.5135!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4b23456789abcd%3A0x0!2zS29wcG9sdSwgT25nb2xl!5e0!3m2!1sen!2sin!4v1"
                  width="100%"
                  height="420"
                  className="mt-8 block rounded-xl border-0"
                  allowFullScreen
                  loading="lazy"
                />
              </section>
            )}
          </div>

          {/* Sticky sidebar */}
          <aside className="lg:sticky lg:top-[104px] lg:self-start">
            <Reveal>
              <div className="card p-7">
                <p className="text-[12px] uppercase tracking-[0.18em] text-forest/70">Starting price</p>
                <p className="mt-2 font-heading text-[28px] leading-tight tabular-nums text-sky-600">{project.startingPrice}</p>

                <dl className="mt-6 divide-y divide-forest/10 text-[14px]">
                  {facts.filter(([k]) => k !== 'Price').map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 py-3">
                      <dt className="text-forest/70">{k}</dt>
                      <dd className="text-right font-medium tabular-nums text-forest">{v}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 py-3">
                    <dt className="text-forest/70">RERA</dt>
                    <dd className="text-right font-mono text-[13px] text-forest">
                      {hasRera ? project.rera : <Link href="/approvals" className="font-sans font-medium text-meadow-600 underline underline-offset-4">View on approvals</Link>}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 grid gap-3">
                  <Link href="/site-visit" className="btn btn-primary w-full"><CalendarCheck size={16} /> Book a site visit</Link>
                  <Link href="/emi-calculator" className="btn btn-ghost w-full"><Calculator size={16} /> Calculate EMI</Link>
                  {project.brochure && <BrochureDownload brochureUrl={project.brochure} projectName={project.name} />}
                </div>
              </div>
            </Reveal>
          </aside>
        </div>

        <div className="mt-20">
          <WhatsAppButton variant="banner" projectName={project.name} phoneNumber={SITE_WHATSAPP_NUMBER} />
        </div>
      </div>
    </div>
  );
}
