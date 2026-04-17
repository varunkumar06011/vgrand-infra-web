export const metadata = {
  title: 'About Us | V Grand Infra | Trusted Builder in Ongole',
  description: 'V Grand Infra — trusted real estate developer in Ongole since 2025. Founded by Vinod Kumar Talasila. Building quality homes for every family in Andhra Pradesh.',
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
            <p style={{ color: '#555', fontSize: 16, lineHeight: 1.85, marginBottom: 16 }}>
              T. Vinod Kumar was raised in a humble, lower middle-class family by his parents Sri Talasila Satyanarayana and Smt. Jayasree — whose values of hard work, integrity, and sacrifice are the cornerstone of everything he builds today. He began working at the age of 15 alongside his father, learning the real meaning of effort before he ever entered a classroom.
            </p>
            <p style={{ color: '#555', fontSize: 16, lineHeight: 1.85, marginBottom: 16 }}>
              After completing his Electrical Engineering in 2007, he gained international exposure in New Zealand before returning to India in 2010. Under the guidance of his mentor Sri Chirumamilla Rambabu garu, he established himself in the granite mining industry — building a reputation for precision, reliability, and zero compromise on quality. In 2016, he expanded further by launching V Grand Family Restaurant in Ongole, today one of the most trusted dining names in the city.
            </p>
            <p style={{ color: '#555', fontSize: 16, lineHeight: 1.85, marginBottom: 24 }}>
              V Grand Infra was born in 2025 from a deeply personal vision — Vinod has lived through the struggles of middle-class families: paying rent, compromising on space, and silently dreaming of a better home. That experience drives every decision we make. Our mission is simple — to build homes that families are proud of, at prices that are honest, with quality that lasts a lifetime.
            </p>
            <div style={{ borderLeft: '3px solid #C0392B', paddingLeft: 20, marginBottom: 12 }}>
              <p style={{ color: '#1a1a1a', fontSize: 17, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 8, fontWeight: 500 }}>
                "Every project we deliver carries a personal promise from the founder — quality you can see, trust you can feel, and a home your family deserves."
              </p>
              <p style={{ color: '#C0392B', fontSize: 13, fontWeight: 700, margin: 0 }}>
                — T. Vinod Kumar, Founder — V Grand Infra
              </p>
            </div>
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
          {[['60+', 'Apartments Built'], ['2', 'Active Projects'], ['20+', 'Years Experience'], ['2025', 'Established']].map(([num, label]) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e8d5d5', borderRadius: 8, padding: '28px 20px', textAlign: 'center' }}>
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

        {/* Our Businesses & Experience */}
        <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Our Businesses &amp; Experience</p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(26px, 4vw, 40px)', color: '#1a1a1a', fontWeight: 700, marginBottom: 40 }}>Our Businesses &amp; Experience</h2>
        <div style={{ background: '#fff5f5', border: '1px solid #e8d5d5', borderRadius: 8, padding: '32px 28px', borderLeft: '3px solid #C0392B', marginBottom: 80 }}>
          <p style={{ color: '#555', fontSize: 16, lineHeight: 1.85, margin: 0 }}>Our founder and team bring 15+ years of rich experience in the business field. We successfully operate V Grand Family Restaurant in Ongole and Kandukur, run a granite mining business, and develop premium real estate projects under V Grand Infra. With 50+ happy clients, we are committed to delivering quality and building lasting communities.</p>
        </div>
      </div>
    </main>
  )
}
