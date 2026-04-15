export const metadata = {
  title: 'About Us | V Grand Infra | Trusted Builder in Ongole',
  description: 'V Grand Infra — trusted real estate developer in Ongole since 2017. Founded by Vinod Kumar Talasila. Building quality homes for every family in Andhra Pradesh.',
  keywords: 'best builder ongole, trusted real estate ongole, v grand infra about, vinod kumar talasila, construction company ongole andhra pradesh'
}

export default function AboutPage() {
  return (
    <main style={{ background: '#fff5f5', minHeight: '100vh', paddingTop: 80 }}>

      {/* Hero strip */}
      <div style={{ background: '#1a1a1a', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>About V Grand Infra</p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 56px)', color: '#fff', fontWeight: 700, lineHeight: 1.2, marginBottom: 24, maxWidth: 700 }}>Our goal is to build a home for every family</h1>
          <p style={{ color: '#ccc', fontSize: 17, lineHeight: 1.85, maxWidth: 640 }}>Every family deserves a home they are proud of. V Grand Infra was built on this belief — that quality construction, honest pricing, and timely delivery should not be a luxury. It should be the standard.</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>

        {/* Story */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 60, marginBottom: 80, alignItems: 'center' }}>
          <div>
            <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Our Story</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(26px, 4vw, 40px)', color: '#1a1a1a', fontWeight: 700, marginBottom: 20, lineHeight: 1.3 }}>Legacy of Quality and Trust</h2>
            <p style={{ color: '#555', fontSize: 16, lineHeight: 1.85, marginBottom: 16 }}>V Grand Infra is led by Vinod Kumar Talasila, an entrepreneur with over 22 years of experience across advertising, sales, granite mining, and hospitality. In 2017, he established V Grand Family Restaurant in Ongole — a brand now known for quality and service.</p>
            <p style={{ color: '#555', fontSize: 16, lineHeight: 1.85, marginBottom: 16 }}>With a passion for creating meaningful living spaces, the company expanded into real estate under V Grand Infra. In 2025, the company launched Elite Homes — the first gated community in Koppolu, Ongole.</p>
            <p style={{ color: '#555', fontSize: 16, lineHeight: 1.85 }}>Every brick we lay is centered around the people who will call it home. We build not just structures, but communities where families thrive.</p>
          </div>
          <div>
            <img src="/images/founder-vinod-kumar.jpg"
              alt="Vinod Kumar Talasila - Founder V Grand Infra"
              style={{ width: '100%', borderRadius: 8, objectFit: 'cover', aspectRatio: '4/5' }} />
            <p style={{ color: '#888', fontSize: 13, marginTop: 12, textAlign: 'center' }}>Vinod Kumar Talasila — Founder, V Grand Infra</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 80 }}>
          {[['2017', 'Established'], ['60+', 'Apartments Built'], ['2', 'Active Projects'], ['22+', 'Years Experience']].map(([num, label]) => (
            <div key={label} style={{ background: '#fff5f5', border: '1px solid #e8d5d5', borderRadius: 8, padding: '28px 20px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 700, color: '#C0392B', margin: '0 0 8px' }}>{num}</p>
              <p style={{ color: '#555', fontSize: 14, margin: 0, letterSpacing: 1 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Values */}
        <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>What We Stand For</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(26px, 4vw, 40px)', color: '#1a1a1a', fontWeight: 700, marginBottom: 40 }}>Our Values</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 80 }}>
          {[
            ['Quality', 'We use only the finest materials and employ stringent quality control so every project we deliver is built to last.'],
            ['Transparency', 'Honest pricing, clear documentation, and open communication at every stage — no surprises.'],
            ['On-Time Delivery', 'We respect your time and your investment. Timely handover is a commitment, not a promise.'],
            ['Customer First', 'Every decision we make is centered around the families who will call our buildings home.']
          ].map(([title, desc]) => (
            <div key={title} style={{ background: '#fff5f5', border: '1px solid #e8d5d5', borderRadius: 8, padding: '28px 24px', borderLeft: '3px solid #C0392B' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#1a1a1a', fontWeight: 700, marginBottom: 12 }}>{title}</h3>
              <p style={{ color: '#555', fontSize: 14, lineHeight: 1.75, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
