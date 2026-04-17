import Hero from '@/components/Hero';
import ProjectCard from '@/components/ProjectCard';
import { projects } from '@/data/projects';
import Link from 'next/link';

import Image from 'next/image';

export default function Home() {
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
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginRight: 48 }}>Your Dream Home from just 29 Lakhs</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 48 }}>+</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginRight: 48 }}>Luxury 3BHK Apartments in Ongole</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 48 }}>+</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginRight: 48 }}>First Gated Community in Koppolu</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 48 }}>+</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginRight: 48 }}>NH-16 Highway Frontage — High Land Value</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', marginRight: 48 }}>+</span>
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginRight: 48 }}>Lifetime Structural Guarantee</span>
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
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 48px)', color: '#1a1a1a', fontWeight: 700, margin: 0 }}>Featured Projects</h2>
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
            <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Who We Are</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,4vw,44px)', color: '#fff', fontWeight: 700, marginBottom: 20, lineHeight: 1.2 }}>Building Communities Since 2025</h2>
            <p style={{ color: '#bbb', fontSize: 16, lineHeight: 1.85, marginBottom: 32 }}>
              V Grand Infra was founded by T. Vinod Kumar — an entrepreneur with 20+ years of experience across granite mining, hospitality, and business. Built on the same values he was raised with — hard work, zero compromise, and genuine care for families — V Grand Infra launched in 2025 with one mission: quality homes at honest prices for every family in Ongole. Our first project, Elite Homes, is the first gated community in Koppolu — built near NH-16 highway, ensuring lasting value for every investment.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px 32px' }}>
              {[['20+', 'Years Experience'], ['2', 'Active Projects'], ['2025', 'Established'], ['60+', 'Apartments']].map(([num, label]) => (
                <div key={label}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 800, color: '#C0392B', margin: 0 }}>{num}</p>
                  <p style={{ color: '#888', fontSize: 13, margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <img src="/images/founder-vinod-kumar.jpg"
              alt="Vinod Kumar Talasila Founder V Grand Infra"
              style={{ width: '100%', borderRadius: 8, objectFit: 'cover', aspectRatio: '4/5' }} />
            <p style={{ color: '#666', fontSize: 13, marginTop: 10, textAlign: 'center' }}>Vinod Kumar Talasila — Founder, V Grand Infra</p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section style={{ padding: '100px 24px', background: '#fff5f5' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={labelStyle}>What We Stand For</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,4vw,44px)', color: '#1a1a1a', fontWeight: 700, marginBottom: 48 }}>Our Core Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {[
              ['Quality', 'We use only the finest materials and employ stringent quality control so every project we deliver is built to last.'],
              ['Transparency', 'Honest pricing, clear documentation, and open communication at every stage — no surprises.'],
              ['On-Time Delivery', 'We respect your time and your investment. Timely handover is a commitment, not a promise.'],
              ['Customer First', 'Every decision we make is centered around the families who will call our buildings home.']
            ].map(([title, desc]) => (
              <div key={title} style={{ background: '#fff5f5', border: '1px solid #e8d5d5', borderRadius: 8, padding: '32px 28px', borderLeft: '4px solid #C0392B' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#1a1a1a', fontWeight: 700, marginBottom: 12 }}>{title}</h3>
                <p style={{ color: '#555', fontSize: 15, lineHeight: 1.75, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ background: '#C0392B', padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px,4vw,44px)', color: '#fff', fontWeight: 700, marginBottom: 16, lineHeight: 1.3 }}>A home is the dream of every family. We make it happen.</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 40, lineHeight: 1.75 }}>Quality construction. Honest pricing. On-time delivery. Starting from just 29 Lakhs in Ongole.</p>
          <div className="cta-buttons" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/contact"
              style={{ background: '#fff', color: '#C0392B', padding: '16px 36px', borderRadius: 6, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Contact Us Today
            </a>
            <a href="https://wa.me/919030143333?text=Hi"
              target="_blank"
              style={{ background: 'rgba(0,0,0,0.25)', color: '#fff', padding: '16px 36px', borderRadius: 6, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
