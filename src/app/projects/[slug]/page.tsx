import { projects } from '@/data/projects'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = projects.find(p => p.slug === slug)
  if (!project) return {}
  return {
    title: `${project.name} | V Grand Infra | Apartments in Ongole`,
    description: `${project.name} by V Grand Infra. ${project.type} in ${project.location}. ${project.startingPrice}.`
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = projects.find(p => p.slug === slug)
  if (!project) return notFound()

  return (
    <main style={{ background: '#fff5f5', minHeight: '100vh', paddingTop: 80 }}>

      {/* Hero */}
      <div style={{ width: '100%', height: '60vh', position: 'relative', overflow: 'hidden' }}>
        <img src={project.image} alt={project.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: 40, left: 40 }}>
          <p style={{ color: '#C0392B', letterSpacing: 3, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>V Grand Infra</p>
          <h1 style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 5vw, 52px)', margin: 0, fontWeight: 700 }}>{project.name}</h1>
          <p style={{ color: '#ddd', marginTop: 8, fontSize: 15 }}>{project.location}</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 5vw, 64px) 24px' }}>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 56 }}>
          {[['Location', project.location], ['Type', project.type], ['Area', project.area], ['Status', project.status], ['Handover', project.handover], ['Price', project.startingPrice]].map(([label, value]) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e8d5d5', borderRadius: 8, padding: '16px 20px' }}>
              <p style={{ color: '#C0392B', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 6px' }}>{label}</p>
              <p style={{ color: '#1a1a1a', fontWeight: 600, fontSize: 14, margin: 0, lineHeight: 1.4 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <p style={{ fontSize: 17, lineHeight: 1.9, color: '#444', marginBottom: 56 }}>{project.description}</p>

        {/* Highlights */}
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a', fontSize: 28, marginBottom: 24, fontWeight: 700 }}>Key Highlights</h2>
        <div style={{ marginBottom: 56 }}>
          {project.highlights.map((h, i) => (
            <div key={i} style={{ borderLeft: '3px solid #C0392B', paddingLeft: 18, marginBottom: 16, color: '#333', fontSize: 15, lineHeight: 1.7 }}>{h}</div>
          ))}
        </div>

        {/* Amenities */}
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a', fontSize: 28, marginBottom: 24, fontWeight: 700 }}>Amenities</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 56 }}>
          {project.amenities.map((a, i) => (
            <div key={i} style={{ border: '1px solid #e8d5d5', borderRadius: 6, padding: '12px 16px', color: '#333', fontSize: 14, background: '#fff', textAlign: 'center' }}>{a}</div>
          ))}
        </div>

        {/* Specs */}
        {Object.keys(project.specs).length > 0 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a', fontSize: 28, marginBottom: 24, fontWeight: 700 }}>Specifications & Materials</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 56 }}>
              <tbody>
                {Object.entries(project.specs).map(([key, val], i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff5f5' : '#fff' }}>
                    <td style={{ padding: '14px 18px', fontWeight: 700, color: '#C0392B', width: '28%', fontSize: 14, borderBottom: '1px solid #f0e0e0' }}>{key}</td>
                    <td style={{ padding: '14px 18px', color: '#333', fontSize: 14, borderBottom: '1px solid #f0e0e0', lineHeight: 1.6 }}>{val as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Location */}
        <h2 style={{ fontFamily: 'Georgia, serif', color: '#1a1a1a', fontSize: 28, marginBottom: 24, fontWeight: 700 }}>Location</h2>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3841.123!2d80.0537!3d15.5135!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4b23456789abcd%3A0x0!2zS29wcG9sdSwgT25nb2xl!5e0!3m2!1sen!2sin!4v1"
          width="100%" height="400"
          style={{ border: 0, borderRadius: 8, marginBottom: 56, display: 'block' }}
          allowFullScreen loading="lazy"
        />

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 80 }}>
          <a href={`https://wa.me/919030143333?text=Hi%2C%20I%20want%20to%20book%20a%20site%20visit%20for%20${encodeURIComponent(project.name)}`}
            target="_blank"
            style={{ background: '#C0392B', color: '#fff', padding: '14px 32px', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: 15, display: 'inline-block' }}>
            Book a Site Visit
          </a>
          <a href={project.brochure} download
            style={{ border: '2px solid #C0392B', color: '#C0392B', padding: '14px 32px', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: 15, background: 'transparent', display: 'inline-block' }}>
            Download Brochure
          </a>
        </div>
      </div>
    </main>
  )
}
