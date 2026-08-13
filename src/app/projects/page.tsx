'use client'
import { useState, useEffect } from 'react'
import ProjectCard from '@/components/ProjectCard'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState('all')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')

  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/projects')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load projects')
        return res.json()
      })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid response from server')
        setProjects(data.map((p: any) => ({
          ...p,
          image: p.images?.[0] || '/images/ban a.png',
          startingPrice: p.starting_price || 'Contact for details',
          description: p.description || 'Premium residential project by V Grand Infra.'
        })))
        setLoading(false)
      })
      .catch(() => {
        console.error('Failed to load projects');
        setError(true);
        setLoading(false);
      })
  }, [])

  const filtered = projects.filter((p: any) => {
    const locMatch = location === 'all' || p.location.toLowerCase().includes(location)
    const statusMatch = status === 'all' || p.status.toLowerCase() === status
    const typeMatch = type === 'all' || p.type.toLowerCase().includes(type)
    return locMatch && statusMatch && typeMatch
  })

  const selectStyle = {
    border: '1.5px solid #e0d0d0',
    borderRadius: 6,
    padding: '11px 16px',
    fontSize: 14,
    color: '#1a1a1a',
    background: '#fff5f5',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
    minWidth: 160
  }

  const labelStyle = {
    display: 'block',
    fontSize: 10,
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    color: '#C0392B',
    fontWeight: 700,
    marginBottom: 6
  }

  return (
    <main style={{ background: '#fff5f5', minHeight: '100vh', paddingTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px' }}>

        <p style={labelStyle}>Our Portfolio</p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px,5vw,52px)', color: '#1a1a1a', marginBottom: 12 }}>Our Projects</h1>
        <p style={{ color: '#555', fontSize: 16, marginBottom: 48, lineHeight: 1.7 }}>Building communities where families thrive. Explore our ongoing and upcoming residential projects in Ongole.</p>

        {/* Filter bar */}
        <div className="bg-white border border-[#e8d5d5] rounded-xl p-6 md:p-8 mb-12 flex flex-col sm:flex-row gap-6 items-start sm:items-end flex-wrap shadow-sm">
          <div className="w-full sm:w-auto">
            <label style={labelStyle}>Location</label>
            <select style={{ ...selectStyle, width: '100%', minWidth: 'unset' }} value={location} onChange={e => setLocation(e.target.value)}>
              <option value="all">All Locations</option>
              <option value="koppolu">Koppolu</option>
              <option value="ongole">Ongole</option>
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label style={labelStyle}>Status</label>
            <select style={{ ...selectStyle, width: '100%', minWidth: 'unset' }} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="ongoing">Ongoing</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label style={labelStyle}>Type</label>
            <select style={{ ...selectStyle, width: '100%', minWidth: 'unset' }} value={type} onChange={e => setType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="3 bhk">3 BHK</option>
              <option value="2 bhk">2 BHK</option>
              <option value="gated">Gated Community</option>
            </select>
          </div>
          <button
            onClick={() => { setLocation('all'); setStatus('all'); setType('all') }}
            className="text-[#C0392B] text-sm font-bold border-b border-[#C0392B] pb-1 hover:text-[#a93226] hover:border-[#a93226] transition-all cursor-pointer whitespace-nowrap mt-2 sm:mt-0"
          >
            Clear Filters
          </button>
        </div>

        {/* Honest intro */}
        <div className="bg-white border border-[#e8d5d5] rounded-xl p-6 md:p-8 mb-12 shadow-sm">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 4vw, 32px)', color: '#1a1a1a', fontWeight: 700, marginBottom: 16 }}>Building with Honesty, Delivering with Pride</h2>
          <p style={{ color: '#555', fontSize: 16, lineHeight: 1.75, marginBottom: 24 }}>Buying a home is not just a financial transaction; it is the culmination of years of hard work, sacrifices, and a lifelong dream for your family. At V Grand Infra, we understand the value of every single rupee you invest with us. We do not believe in flashy promises or unreachable luxuries. Our foundation is built on ground reality, transparent conversations, and a straightforward commitment to quality.</p>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: '#1a1a1a', fontWeight: 700, marginBottom: 12 }}>Why Ongole Trusts Us:</h3>
          <ul style={{ color: '#555', fontSize: 15, lineHeight: 1.8, marginBottom: 20, paddingLeft: 20 }}>
            <li style={{ marginBottom: 8 }}><strong style={{ color: '#1a1a1a' }}>Uncompromised Material Quality:</strong> We build your homes using the same premium standards and materials we would choose for our own families. No shortcuts, no compromises.</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: '#1a1a1a' }}>Transparency Over Everything:</strong> From clear titles and legal approvals to the actual progress on the ground, what you see is exactly what you get. No hidden charges, no sudden surprises.</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: '#1a1a1a' }}>Prime, Purposeful Locations:</strong> We select locations like Koppolu that offer seamless connectivity — like direct access to the NH-16 Highway — so your family stays connected and your investment grows in value.</li>
            <li style={{ marginBottom: 8 }}><strong style={{ color: '#1a1a1a' }}>Homes, Not Just Buildings:</strong> We focus on creating practical, well-ventilated, and thriving residential spaces where everyday communities can grow, celebrate, and live securely.</li>
          </ul>
          <div style={{ borderLeft: '3px solid #C0392B', paddingLeft: 20 }}>
            <p style={{ color: '#1a1a1a', fontSize: 16, fontWeight: 500, lineHeight: 1.7, margin: 0 }}><strong>Our Promise:</strong> We do not just deliver keys; we deliver peace of mind. Walk into any of our ongoing or upcoming projects in Ongole, look at the construction quality yourself, and talk to our team. We are here to build a relationship rooted in trust and honesty.</p>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-white border border-[#e8d5d5] rounded-xl p-6 md:p-8 mb-12 shadow-sm text-center">
            <p style={{ color: '#C0392B', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Unable to load projects</p>
            <p style={{ color: '#555', fontSize: 14 }}>There was a problem fetching our projects. Please try again later.</p>
          </div>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {loading ? (
            <p style={{ color: '#888', gridColumn: '1/-1', textAlign: 'center', padding: '60px 0' }}>Loading projects...</p>
          ) : error ? (
            <p style={{ color: '#888', gridColumn: '1/-1', textAlign: 'center', padding: '60px 0' }}>Failed to load projects. Please refresh the page.</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: '#888', gridColumn: '1/-1', textAlign: 'center', padding: '60px 0' }}>No projects match your filters.</p>
          ) : (
            filtered.map((project, index) => (
              <ProjectCard key={project.id || project.slug} project={project} index={index} />
            ))
          )}
        </div>
      </div>
    </main>
  )
}
