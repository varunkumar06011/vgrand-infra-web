import { getAdminClient } from '@/lib/supabaseAdmin'
import { notFound } from 'next/navigation'
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = getAdminClient()
  const { data: project } = await supabase.from('projects').select('*').eq('slug', slug).single()
  
  if (!project) return {}
  return {
    title: `${project.name} | ${project.type} in ${project.location} | V Grand Infra`,
    description: `${project.description?.substring(0, 160) || project.name}`,
    keywords: `${project.name.toLowerCase()} ongole, ${project.type.toLowerCase()}, property in ${project.location.toLowerCase()}`
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = getAdminClient()
  const { data: project, error } = await supabase.from('projects').select('*').eq('slug', slug).single()
  
  if (!project || error) return notFound()

  // Map database fields to UI keys (handling snake_case conversion if needed)
  const uiProject = {
    ...project,
    image: project.images?.[0] || '/images/elite-homes.jpg',
    startingPrice: project.starting_price || 'Contact for details',
    brochure: project.brochure_url || '#',
    highlights: project.highlights || [],
    amenities: project.amenities || [],
    specs: project.specs || {},
  }

  return (
    <main style={{ background: '#fff5f5', minHeight: '100vh', paddingTop: 80 }}>

      {/* Hero */}
      <div style={{ width: '100%', height: '60vh', position: 'relative', overflow: 'hidden' }}>
        <img src={uiProject.image} alt={uiProject.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: 40, left: 40 }}>
          <p style={{ color: '#C0392B', letterSpacing: 3, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>V Grand Infra</p>
          <h1 style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 5vw, 52px)', margin: 0, fontWeight: 700 }}>{uiProject.name}</h1>
          <p style={{ color: '#ddd', marginTop: 8, fontSize: 15 }}>{uiProject.location}</p>
        </div>
      </div>


      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(32px, 5vw, 64px) 24px' }}>

        {/* RERA Badge */}
        {uiProject.rera && (
          <div style={{
            background: '#fff',
            border: '1.5px solid #C0392B',
            borderRadius: 6,
            padding: '10px 20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 32
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#C0392B' }}>RERA Registered</span>
            <span style={{ width: 1, height: 16, background: '#e0d0d0' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', fontFamily: 'monospace' }}>{uiProject.rera}</span>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 56 }}>
          {[['Location', uiProject.location], ['Type', uiProject.type], ['Area', uiProject.area], ['Status', uiProject.status], ['Handover', uiProject.handover], ['Price', uiProject.startingPrice], ['RERA No.', uiProject.rera || 'Applied']].map(([label, value]) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e8d5d5', borderRadius: 8, padding: '16px 20px' }}>
              <p style={{ color: '#C0392B', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 6px' }}>{label}</p>
              <p style={{ color: '#1a1a1a', fontWeight: 600, fontSize: 14, margin: 0, lineHeight: 1.4 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <p style={{ fontSize: 17, lineHeight: 1.9, color: '#444', marginBottom: 56 }}>{uiProject.description}</p>

        {/* Highlights */}
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a', fontSize: 28, marginBottom: 24, fontWeight: 700 }}>Key Highlights</h2>
        <div style={{ marginBottom: 56 }}>
          {uiProject.highlights.map((h: string, i: number) => (
            <div key={i} style={{ borderLeft: '3px solid #C0392B', paddingLeft: 18, marginBottom: 16, color: '#333', fontSize: 15, lineHeight: 1.7 }}>{h}</div>
          ))}
        </div>

        {/* Amenities */}
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a', fontSize: 28, marginBottom: 24, fontWeight: 700 }}>Amenities</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 56 }}>
          {uiProject.amenities.map((a: string, i: number) => (
            <div key={i} style={{ border: '1px solid #e8d5d5', borderRadius: 6, padding: '12px 16px', color: '#333', fontSize: 14, background: '#fff', textAlign: 'center' }}>{a}</div>
          ))}
        </div>

        {/* Specs */}
        {Object.keys(uiProject.specs).length > 0 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: '#1a1a1a', fontSize: 28, marginBottom: 24, fontWeight: 700 }}>Specifications & Materials</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 56 }}>
              <tbody>
                {Object.entries(uiProject.specs).map(([key, val], i) => (
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
        <div className="space-y-6">
          <WhatsAppButton 
            variant="banner" 
            projectName={uiProject.name} 
            phoneNumber="919030143333"
          />
          
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 80 }}>
            <a href={uiProject.brochure} download
              style={{ flex: 1, textAlign: 'center', border: '2px solid #C0392B', color: '#C0392B', padding: '14px 32px', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: 15, background: 'transparent', display: 'inline-block' }}>
              Download Brochure
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
