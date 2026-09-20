import Hero from '@/components/Hero';
import ProjectCard from '@/components/ProjectCard';
import { getAdminClient } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton';
import { renderSafeHtml } from '@/lib/safeHtml';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = getAdminClient();
  const { data: dbProjects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  const projectPriority: Record<string, number> = { 'elite-homes': 0, 'v-grand-gateway': 1, 'tripura': 2 };
  const projects = (dbProjects || []).map((p: any) => ({
    ...p,
    image: p.images?.[0] || '/images/ban a.png',
    startingPrice: p.starting_price || 'Contact for details',
    description: p.description || 'Premium residential project by V Grand Infra.'
  })).sort((a: any, b: any) => {
    const pa = projectPriority[a.slug] ?? 99;
    const pb = projectPriority[b.slug] ?? 99;
    if (pa !== pb) return pa - pb;
    return 0;
  });

  const featuredProjects = projects.slice(0, 3);

  const siteUrl = 'https://vgrandgroup.com';

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'V Grand Infra',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/projects?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is it safe to invest in Ongole real estate in 2026?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. With Ongole property price trends showing steady growth, especially near the NH-16 highway, investing in RERA approved projects in Ongole is a high-yield opportunity. The development of industrial corridors makes Prakasam district a prime location for long-term real estate investment.'
        }
      },
      {
        '@type': 'Question',
        name: 'How to choose a builder in Ongole for premium flats?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Look for trusted builders in Ongole with a track record of high quality construction and transparent documentation. V Grand Infra stands out among real estate developers in Andhra Pradesh for our commitment to Zero Compromise quality and on-time delivery of ready to move apartments in Ongole.'
        }
      },
      {
        '@type': 'Question',
        name: 'What are the best areas to buy flats in Ongole?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Koppolu and areas adjacent to the NH-16 highway are currently the best areas to buy flats in Ongole due to their connectivity and infrastructure growth. V Grand Infra offers premium lifestyle apartments and gated community flats in these high-appreciation zones.'
        }
      },
      {
        '@type': 'Question',
        name: 'Are there affordable apartments in Ongole for middle class families?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. V Grand Infra specializes in affordable housing in Ongole. From 2BHK flats near highway to budget housing projects, we offer ready to move flats in Ongole with amenities like security, parks, and 24/7 water supply, making luxury living accessible to everyone.'
        }
      }
    ]
  };

  const labelClass = 'block text-[11px] tracking-[3px] uppercase text-[#C0392B] font-bold mb-4';

  return (
    <main className="min-h-screen bg-[#fff5f5]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />
      <Hero />

      {/* Marquee Scroller */}
      <div className="marquee-mask relative w-full overflow-hidden whitespace-nowrap bg-[#C0392B] py-[14px]">
        <div className="marquee-track">
          {[1, 2].map(n => (
            <span key={n} className="inline-block">
              <span className="text-white text-[13px] font-bold tracking-[2px] uppercase mr-12">★ Elite Homes — First Gated Community in Koppolu</span>
              <span className="text-white/50 mr-12">+</span>
              <span className="text-white text-[13px] font-bold tracking-[2px] uppercase mr-12">V Grand Gateway — Premium 2 &amp; 3 BHK Flats</span>
              <span className="text-white/50 mr-12">+</span>
              <span className="text-white text-[13px] font-bold tracking-[2px] uppercase mr-12">Tripura — Affordable 2BHK Homes in Ongole</span>
              <span className="text-white/50 mr-12">+</span>
              <span className="text-white text-[13px] font-bold tracking-[2px] uppercase mr-12">Best Construction Company in Ongole</span>
              <span className="text-white/50 mr-12">+</span>
              <span className="text-white text-[13px] font-bold tracking-[2px] uppercase mr-12">Top Real Estate Developers in Ongole</span>
              <span className="text-white/50 mr-12">+</span>
              <span className="text-white text-[13px] font-bold tracking-[2px] uppercase mr-12">Budget Housing Projects in Ongole — 29 Lakhs</span>
              <span className="text-white/50 mr-12">+</span>
              <span className="text-white text-[13px] font-bold tracking-[2px] uppercase mr-12">Low Cost Flats in Ongole with EMI Options</span>
              <span className="text-white/50 mr-12">+</span>
              <span className="text-white text-[13px] font-bold tracking-[2px] uppercase mr-12">Newly Launched Flats in Ongole</span>
              <span className="text-white/50 mr-12">+</span>
            </span>
          ))}
        </div>
      </div>

      {/* Featured Projects Section */}
      <section className="py-[100px] px-6 bg-[#fff5f5]">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
            <div>
              <p className={labelClass}>Latest Developments</p>
              <h2 className="font-heading text-[clamp(32px,5vw,40px)] text-[#1a1a1a] font-bold m-0">Best Apartments in Ongole</h2>
              <p className="mt-4 text-slate-600 max-w-2xl">Discover our ongoing residential projects in Ongole, featuring 2BHK and 3BHK flats near highway locations with modern amenities and high appreciation potential.</p>
            </div>
            <Link
              href="/projects"
              className="w-fit self-center md:self-auto text-[#C0392B] font-bold no-underline text-sm tracking-[1px] border-b-2 border-[#C0392B] pb-1"
            >
              VIEW ALL PROJECTS
            </Link>
          </div>
          <div className="projects-grid grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8">
            {featuredProjects.map((project, index) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* About Strip */}
      <section className="about-grid-section bg-[#1a1a1a] py-[100px] px-6">
        <div className="about-grid max-w-[1100px] mx-auto grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[60px] items-center">
          <div>
            <p className="text-[#C0392B] text-[11px] tracking-[3px] uppercase font-bold mb-4">Trusted Builders in Ongole</p>
            <h2 className="font-heading text-[clamp(28px,4vw,44px)] text-white font-bold mb-5 leading-[1.2]">Infrastructure Company in Prakasam District</h2>
            <p className="text-[#bbb] text-base leading-[1.85] mb-8">
              V Grand Infra, led by T. Vinod Kumar, has emerged as one of the <strong>top real estate developers in Ongole</strong>. With a foundation built on 25+ years of cross-industry expertise, we are the preferred choice for families seeking <strong>high quality construction in Ongole</strong>. Our mission is to deliver premium <strong>residential projects in Ongole</strong> at honest prices, starting with <strong>Elite Homes</strong>—the first gated community in Koppolu near the NH-16 highway. As <strong>trusted builders in Ongole</strong>, we prioritize structural integrity and long-term value in every home.
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              {[['25+', 'Years Experience'], ['2', 'Active Projects'], ['Best', 'Infra Projects'], ['RERA', 'Approved']].map(([num, label]) => (
                <div key={label}>
                  <p className="font-heading text-[32px] font-extrabold text-[#C0392B] m-0">{num}</p>
                  <p className="text-[#888] text-[13px] m-0">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Image src="/images/founder-vinod-kumar.jpg"
              alt="Vinod Kumar Talasila Founder V Grand Infra - Real Estate Developers in Andhra Pradesh"
              width={1200} height={1800}
              className="w-full rounded-lg object-cover aspect-[4/5]" />
            <p className="text-[#666] text-[13px] mt-2.5 text-center">Vinod Kumar Talasila — Best Real Estate Company in Ongole</p>
          </div>
        </div>
      </section>

      {/* Expert FAQ Section - Strategic SEO Content */}
      <section className="py-[100px] px-6 bg-[#fff5f5]">
        <div className="max-w-[900px] mx-auto">
          <p className={labelClass}>Expert Guidance</p>
          <h2 className="font-heading text-[clamp(28px,4vw,40px)] text-[#1a1a1a] font-bold mb-12">Ongole Real Estate Market Insights</h2>

          <div className="flex flex-col gap-8">
            {[
              {
                q: "Is it safe to invest in Ongole real estate in 2026?",
                a: "Absolutely. With <strong>Ongole property price trends 2026</strong> showing steady growth, especially near the NH-16 highway, investing in <strong>RERA approved projects in Ongole</strong> is a high-yield opportunity. The development of industrial corridors makes the <strong>Prakasam district</strong> a prime location for long-term real estate investment."
              },
              {
                q: "How to choose a builder in Ongole for premium flats?",
                a: "Look for <strong>trusted builders in Ongole</strong> with a track record of <strong>high quality construction</strong> and transparent documentation. V Grand Infra stands out among <strong>real estate developers in Andhra Pradesh</strong> for our commitment to 'Zero Compromise' quality and on-time delivery of <strong>ready to move apartments in Ongole</strong>."
              },
              {
                q: "What are the best areas to buy flats in Ongole?",
                a: "Koppolu and areas adjacent to the NH-16 highway are currently the <strong>best areas to buy flats in Ongole</strong> due to their connectivity and infrastructure growth. Our projects offer <strong>premium lifestyle apartments</strong> and <strong>gated community flats under 30 lakhs</strong> in these high-appreciation zones."
              },
              {
                q: "Are there affordable apartments in Ongole for middle class families?",
                a: "Yes, we specialize in <strong>affordable housing in Ongole</strong>. From <strong>2BHK flats near highway</strong> to <strong>budget housing projects</strong>, we offer <strong>ready to move flats in Ongole with amenities</strong> like security, parks, and 24/7 water supply, making luxury living accessible to everyone."
              }
            ].map((faq, i) => (
              <div key={i} className="border-b border-[#e8d5d5] pb-6">
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-3">{faq.q}</h3>
                <p className="text-[#555] leading-[1.7] text-[15px]">{renderSafeHtml(faq.a)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-[100px] px-6 bg-[#fff5f5]">
        <div className="max-w-[1100px] mx-auto">
          <p className={labelClass}>Quality Commitment</p>
          <h2 className="font-heading text-[clamp(28px,4vw,44px)] text-[#1a1a1a] font-bold mb-12">Why Choose V Grand Infra?</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-16">
            {[
              ['Eco-Friendly Housing', 'We focus on building <strong>eco-friendly housing projects in Ongole</strong> with sustainable practices and green spaces.'],
              ['Trusted Infrastructure', 'As a premier <strong>infrastructure company in Ongole</strong>, we ensure our buildings exceed standard engineering norms.'],
              ['Modern Gated Community', 'Each project is a <strong>modern gated community with security in Ongole</strong>, offering peace of mind for families.'],
              ['EMI & Finance', 'We provide <strong>low cost flats in Ongole with EMI options</strong> to make your dream home a reality within your budget.']
            ].map(([title, desc]) => (
              <div key={title} className="bg-[#fff5f5] border border-[#e8d5d5] rounded-lg py-8 px-7 border-l-4 border-l-[#C0392B]">
                <h3 className="font-heading text-xl text-[#1a1a1a] font-bold mb-3">{title}</h3>
                <p className="text-[#555] text-[15px] leading-[1.75] m-0">{renderSafeHtml(desc)}</p>
              </div>
            ))}
          </div>
          
          <WhatsAppButton variant="banner" phoneNumber="919030143333" title="Invest in the best real estate company in Ongole today!" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#C0392B] py-[100px] px-6 text-center">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-heading text-[clamp(28px,4vw,44px)] text-white font-bold mb-4 leading-[1.3]">Premium Lifestyle Apartments in Ongole.</h2>
          <p className="text-white/85 text-base mb-10 leading-[1.75]">Looking for <strong>flats in Ongole for sale</strong>? Explore our <strong>new housing projects in Ongole 2026</strong> and secure your investment in the <strong>best infrastructure projects in Ongole</strong>.</p>
          <div className="cta-buttons flex gap-4 justify-center flex-wrap">
            <Link href="/projects"
              className="bg-white text-[#C0392B] py-4 px-9 rounded-md font-bold text-[15px] no-underline">
              Explore Projects in Prakasam
            </Link>
            <WhatsAppButton variant="pill" phoneNumber="919030143333" showText={true} />
          </div>
        </div>
      </section>

    </main>
  );
}
