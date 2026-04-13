export const metadata = {
  title: 'Gallery | V Grand Infra | Real Estate in Ongole',
  description: 'View photos and progress updates for V Grand Infra residential projects in Ongole.'
}

export default function GalleryPage() {
  return (
    <main style={{ background: '#fff5f5', minHeight: '100vh', paddingTop: 100 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Visual Journey</p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 52px)', color: '#1a1a1a', marginBottom: 16, fontWeight: 700 }}>Gallery</h1>
        <p style={{ color: '#555', fontSize: 16, marginBottom: 56, lineHeight: 1.7, maxWidth: 600 }}>Capturing the progress and craftsmanship in every detail of our construction.</p>

        <div style={{ background: '#fff5f5', borderRadius: 12, padding: '100px 40px', textAlign: 'center', border: '1px solid #e8d5d5' }}>
          <p style={{ color: '#888', fontSize: 18 }}>Photos of our projects are currently being curated and will be uploaded soon.</p>
        </div>
      </div>
    </main>
  )
}
