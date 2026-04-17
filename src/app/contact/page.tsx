import Link from 'next/link'

export const metadata = {
  title: 'Contact V Grand Infra | Book Site Visit | Ongole',
  description: 'Contact V Grand Infra to book a free site visit for Elite Homes or Tripura in Koppolu, Ongole. Call +91 90301 43333 or WhatsApp us.',
  keywords: 'contact v grand infra, book site visit ongole, flat enquiry ongole, apartment booking ongole, v grand infra phone number'
}

export default function ContactPage() {
  return (
    <main style={{ background: '#fff5f5', minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>

        <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Get In Touch</p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 52px)', color: '#1a1a1a', marginBottom: 16, fontWeight: 700 }}>Contact Us</h1>
        <p style={{ color: '#555', fontSize: 16, marginBottom: 56, lineHeight: 1.7 }}>Whether you have a question about our projects, pricing, or locations, our team is ready to help.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>

          {/* Form */}
          <div style={{ background: '#fff', borderRadius: 8, padding: 32, border: '1px solid #e8d5d5' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, color: '#1a1a1a', marginBottom: 24, fontWeight: 700 }}>Send us a Message</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#C0392B', fontWeight: 700, marginBottom: 8 }}>Full Name</label>
                <input placeholder="Your name" style={{ width: '100%', border: '1px solid #e0d0d0', borderRadius: 6, padding: '12px 14px', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#C0392B', fontWeight: 700, marginBottom: 8 }}>Phone Number</label>
                <input placeholder="+91 XXXXX XXXXX" style={{ width: '100%', border: '1px solid #e0d0d0', borderRadius: 6, padding: '12px 14px', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#C0392B', fontWeight: 700, marginBottom: 8 }}>Project of Interest</label>
              <select style={{ width: '100%', border: '1px solid #e0d0d0', borderRadius: 6, padding: '12px 14px', fontSize: 15, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' }}>
                <option>Elite Homes — Koppolu, Ongole</option>
                <option>Tripura — Koppolu, Ongole</option>
                <option>Green Valley — Ongole</option>
                <option>General Enquiry</option>
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#C0392B', fontWeight: 700, marginBottom: 8 }}>Message</label>
              <textarea placeholder="Tell us what you are looking for..." rows={4} style={{ width: '100%', border: '1px solid #e0d0d0', borderRadius: 6, padding: '12px 14px', fontSize: 15, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <a href={`https://wa.me/919030143333?text=Hi`} style={{ display: 'block', width: '100%', background: '#C0392B', color: '#fff', padding: '14px', borderRadius: 6, textAlign: 'center', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxSizing: 'border-box' }}>
              Send via WhatsApp
            </a>
          </div>

          {/* Info */}
          <div>
            <div style={{ background: '#1a1a1a', borderRadius: 8, padding: 32, marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#fff', marginBottom: 24, fontWeight: 700 }}>Our Office</h2>
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: '#C0392B', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Address</p>
                <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.7 }}>V Grand Lounge, 2nd Floor, Guntur Road, Ongole, Andhra Pradesh</p>
              </div>
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: '#C0392B', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Phone</p>
                <a href="tel:+919030143333" style={{ color: '#ddd', fontSize: 15, textDecoration: 'none' }}>+91 90301 43333</a>
              </div>
              <div>
                <p style={{ color: '#C0392B', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Email</p>
                <a href="mailto:vgrandinfra@gmail.com" style={{ color: '#ddd', fontSize: 15, textDecoration: 'none' }}>vgrandinfra@gmail.com</a>
              </div>
            </div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3841.5!2d80.0476!3d15.5057!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4b6a6b6a6b6a6b%3A0x0!2zT25nb2xl!5e0!3m2!1sen!2sin!4v1"
              width="100%" height="280"
              style={{ border: 0, borderRadius: 8, display: 'block' }}
              allowFullScreen loading="lazy"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
