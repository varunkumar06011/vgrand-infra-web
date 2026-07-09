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
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 56px)', color: '#fff', fontWeight: 700, lineHeight: 1.2, marginBottom: 24, maxWidth: 700 }}>A foundation built on trust. A home built for life.</h1>
          <p style={{ color: '#ccc', fontSize: 17, lineHeight: 1.85, maxWidth: 640, marginBottom: 16 }}>For most of us, a home is the biggest dream we will ever work for. It holds our savings, our sacrifices, and our hopes for the future. At V Grand Infra, we do not just see brick and mortar; we see the trust you place in our hands.</p>
          <p style={{ color: '#ccc', fontSize: 17, lineHeight: 1.85, maxWidth: 640 }}>We were founded on a simple, unchanging truth: quality construction, honest pricing, and transparent timelines should never be a luxury you have to beg for. They are your right. From the foundation steel to the final coat of paint, we build with the kind of integrity that ensures your family stays safe, proud, and secure for generations.</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>

        {/* Story */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 60, marginBottom: 80, alignItems: 'center' }}>
          <div>
            <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Our Story</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(26px, 4vw, 40px)', color: '#1a1a1a', fontWeight: 700, marginBottom: 20, lineHeight: 1.3 }}>Legacy of Quality and Trust</h2>
            <p style={{ color: '#555', fontSize: 16, lineHeight: 1.85, marginBottom: 16 }}>
              T. Vinod Kumar was raised in a humble, lower middle-class family by his parents Sri Talasila Satyanarayana and Smt. Jayasree. He began working at the age of 15 alongside his father, learning the real meaning of effort, integrity, and sacrifice before he ever entered a classroom.
            </p>
            <p style={{ color: '#555', fontSize: 16, lineHeight: 1.85, marginBottom: 24 }}>
              After completing his Electrical Engineering in 2007, he gained international exposure in New Zealand before returning to India in 2010. Under the guidance of his mentor Sri Chirumamilla Rambabu garu, he built a strong reputation in the granite mining industry for precision, reliability, and zero compromise on quality. In 2016, he brought that same dedication to the hospitality sector by launching V Grand Family Restaurant in Ongole, now one of the city’s most trusted dining names.
            </p>

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(22px, 3vw, 28px)', color: '#1a1a1a', fontWeight: 700, marginBottom: 16, lineHeight: 1.3 }}>From Living the Struggle to Building the Dream</h3>
            <p style={{ color: '#555', fontSize: 16, lineHeight: 1.85, marginBottom: 24 }}>
              V Grand Infra was born in 2025 out of a deeply personal emotion. Vinod has lived the struggles of middle-class families: paying rent, compromising on cramped living spaces, and silently dreaming of a permanent roof for his family. Because he has walked in those exact shoes, V Grand Infra operates differently. We do not see construction as just a business of brick and cement. For us, it is a sacred responsibility. Our mission is simple: to build safe, rock-solid homes that common families can genuinely afford, be immensely proud of, and safely pass down to the next generation.
            </p>
            <div style={{ borderLeft: '3px solid #C0392B', paddingLeft: 20, marginBottom: 12 }}>
              <p style={{ color: '#1a1a1a', fontSize: 17, fontStyle: 'italic', lineHeight: 1.6, marginBottom: 8, fontWeight: 500 }}>
                "I know what it takes for a family to save up for a home. Every project we build carries my family’s name and my personal word. We promise you quality you can see with your eyes, honesty you can feel in our pricing, and the secure home your family truly deserves."
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
          {[['60+', 'Apartments Built'], ['2', 'Active Projects'], ['25+', 'Years Experience'], ['2025', 'Established']].map(([num, label]) => (
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
            ["Uncompromised Quality", "We understand that a home protects your family's future. By sourcing proven, premium materials and maintaining strict engineering checks at every stage, we build structures meant to safely endure for generations."],
            ["Absolute Transparency", "Your trust is our greatest asset. From straightforward, fixed pricing to clear legal documentation and honest construction updates, we ensure you are fully informed at every single step — with zero hidden surprises."],
            ["Punctual Delivery", "We deeply respect the value of your time and the financial planning behind your investment. For us, delivering your keys on schedule is not just a commercial deadline; it is a sacred commitment we work hard to keep."],
            ["A Humble Approach", "We never forget that we are building spaces for real people, not just executing blueprints. Every decision we make is guided by a sincere desire to make the home-buying journey simple, respectful, and deeply rewarding for your family."]
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
          <p style={{ color: '#555', fontSize: 16, lineHeight: 1.85, margin: 0 }}>For the past 25 years, our journey across different business fields has been shaped by the invaluable trust of the people. Whether managing large-scale operations in granite mining or welcoming families to the V Grand Family Restaurant in Ongole and Kandukur, we have learned that long-term success only comes from absolute honesty. V Grand Infra is the natural extension of this 25-year legacy. We bring the same grounded values, strict quality controls, and humble dedication to the real estate sector, ensuring your hard-earned investment is entirely safe with us.</p>
        </div>
      </div>
    </main>
  )
}
