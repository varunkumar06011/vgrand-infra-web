import Hero from '@/components/Hero';
import ProjectCard from '@/components/ProjectCard';
import { getAdminClient } from '@/lib/supabaseAdmin';
import Link from 'next/link';
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton';

import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = getAdminClient();
  const { data: dbProjects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  const projects = (dbProjects || []).map((p: any) => ({
    ...p,
    image: p.images?.[0] || '/images/elite-homes.jpg',
    startingPrice: p.starting_price || 'Contact for details',
    description: p.description || 'Premium residential project by V Grand Infra.'
  }));

  const featuredProjects = projects.slice(0, 3);

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    letterSpacing: '3px',
    textTransform: 'uppercase' as const,
    color: '#C0392B',
    fontWeight: 700,
    marginBottom: 16
  };

  return (
    <main className="min-h-screen bg-[#fff5f5]">
      <Hero />

      {/* Marquee Scroller */}
      <div className="marquee-mask" style={{
        background: '#C0392B',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        padding: '14px 0',
        width: '100%',
        position: 'relative'
      }}>
        <div className="marquee-track" style={{
          display: 'inline-block',
          animation: 'marquee 30s linear infinite',
          whiteSpace: 'nowrap'
        }}>
          {[1, 2].map(n => (
            <span key={n} style={{ display: 'inline-block' }}>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginRight: 48 }}>Best Construction Company in Ongole</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 48 }}>+</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginRight: 48 }}>Top Real Estate Developers in Ongole</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 48 }}>+</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginRight: 48 }}>Budget Housing Projects in Ongole — 29 Lakhs</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 48 }}>+</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginRight: 48 }}>Low Cost Flats in Ongole with EMI Options</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 48 }}>+</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginRight: 48 }}>Newly Launched Flats in Ongole</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 48 }}>+</span>
            </span>
          ))}
        </div>
      </div>

      {/* Featured Projects Section */}
      <section style={{ padding: '100px 24px', background: '#fff5f5' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
            <div>
              <p style={labelStyle}>Latest Developments</p>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 40px)', color: '#1a1a1a', fontWeight: 700, margin: 0 }}>Best Apartments in Ongole</h2>
              <p className="mt-4 text-slate-600 max-w-2xl">Discover our ongoing residential projects in Ongole, featuring 2BHK and 3BHK flats near highway locations with modern amenities and high appreciation potential.</p>
            </div>
            <Link
              href="/projects"
              className="w-fit self-center md:self-auto"
              style={{
                color: '#C0392B',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: 14,
                letterSpacing: 1,
                borderBottom: '2px solid #C0392B',
                paddingBottom: 4
              }}
            >
              VIEW ALL PROJECTS
            </Link>
          </div>
          <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
            {featuredProjects.map((project, index) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* About Strip */}
      <section className="about-grid-section" style={{ background: '#1a1a1a', padding: '100px 24px' }}>
        <div className="about-grid" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 60, alignItems: 'center' }}>
          <div>
            <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Trusted Builders in Ongole</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,4vw,44px)', color: '#fff', fontWeight: 700, marginBottom: 20, lineHeight: 1.2 }}>Infrastructure Company in Prakasam District</h2>
            <p style={{ color: '#bbb', fontSize: 16, lineHeight: 1.85, marginBottom: 32 }}>
              V Grand Infra, led by T. Vinod Kumar, has emerged as one of the <strong>top real estate developers in Ongole</strong>. With a foundation built on 20+ years of cross-industry expertise, we are the preferred choice for families seeking <strong>high quality construction in Ongole</strong>. Our mission is to deliver premium <strong>residential projects in Ongole</strong> at honest prices, starting with Elite Homes—the first gated community in Koppolu near the NH-16 highway. As <strong>trusted builders in Ongole</strong>, we prioritize structural integrity and long-term value in every home.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 32px' }}>
              {[['20+', 'Years Experience'], ['2', 'Active Projects'], ['Best', 'Infra Projects'], ['RERA', 'Approved']].map(([num, label]) => (
                <div key={label}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 800, color: '#C0392B', margin: 0 }}>{num}</p>
                  <p style={{ color: '#888', fontSize: 13, margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <img src="/images/founder-vinod-kumar.jpg"
              alt="Vinod Kumar Talasila Founder V Grand Infra - Real Estate Developers in Andhra Pradesh"
              style={{ width: '100%', borderRadius: 8, objectFit: 'cover', aspectRatio: '4/5' }} />
            <p style={{ color: '#666', fontSize: 13, marginTop: 10, textAlign: 'center' }}>Vinod Kumar Talasila — Best Real Estate Company in Ongole</p>
          </div>
        </div>
      </section>

      {/* Expert FAQ Section - Strategic SEO Content */}
      <section style={{ padding: '100px 24px', background: '#fff5f5' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={labelStyle}>Expert Guidance</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,4vw,40px)', color: '#1a1a1a', fontWeight: 700, marginBottom: 48 }}>Ongole Real Estate Market Insights</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
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
              <div key={i} style={{ borderBottom: '1px solid #e8d5d5', paddingBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>{faq.q}</h3>
                <p style={{ color: '#555', lineHeight: 1.7, fontSize: 15 }} dangerouslySetInnerHTML={{ __html: faq.a }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section style={{ padding: '100px 24px', background: '#fff5f5' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={labelStyle}>Quality Commitment</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,4vw,44px)', color: '#1a1a1a', fontWeight: 700, marginBottom: 48 }}>Why Choose V Grand Infra?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 64 }}>
            {[
              ['Eco-Friendly Housing', 'We focus on building <strong>eco-friendly housing projects in Ongole</strong> with sustainable practices and green spaces.'],
              ['Trusted Infrastructure', 'As a premier <strong>infrastructure company in Ongole</strong>, we ensure our buildings exceed standard engineering norms.'],
              ['Modern Gated Community', 'Each project is a <strong>modern gated community with security in Ongole</strong>, offering peace of mind for families.'],
              ['EMI & Finance', 'We provide <strong>low cost flats in Ongole with EMI options</strong> to make your dream home a reality within your budget.']
            ].map(([title, desc]) => (
              <div key={title} style={{ background: '#fff5f5', border: '1px solid #e8d5d5', borderRadius: 8, padding: '32px 28px', borderLeft: '4px solid #C0392B' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#1a1a1a', fontWeight: 700, marginBottom: 12 }}>{title}</h3>
                <p style={{ color: '#555', fontSize: 15, lineHeight: 1.75, margin: 0 }} dangerouslySetInnerHTML={{ __html: desc }} />
              </div>
            ))}
          </div>
          
          <WhatsAppButton variant="banner" phoneNumber="919030143333" title="Invest in the best real estate company in Ongole today!" />
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ background: '#C0392B', padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,4vw,44px)', color: '#fff', fontWeight: 700, marginBottom: 16, lineHeight: 1.3 }}>Premium Lifestyle Apartments in Ongole.</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 40, lineHeight: 1.75 }}>Looking for <strong>flats in Ongole for sale</strong>? Explore our <strong>new housing projects in Ongole 2026</strong> and secure your investment in the <strong>best infrastructure projects in Ongole</strong>.</p>
          <div className="cta-buttons" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/projects"
              style={{ background: '#fff', color: '#C0392B', padding: '16px 36px', borderRadius: 6, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Explore Projects in Prakasam
            </Link>
            <WhatsAppButton variant="pill" phoneNumber="919030143333" showText={true} />
          </div>
        </div>
      </section>

    </main>
  );
}
