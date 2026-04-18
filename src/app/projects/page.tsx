'use client'
import { useState, useEffect } from 'react'
import ProjectCard from '@/components/ProjectCard'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState('all')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data.map((p: any) => ({
          ...p,
          image: p.images?.[0] || '/images/elite-homes.jpg',
          startingPrice: p.starting_price || 'Contact for details',
          description: p.description || 'Premium residential project by V Grand Infra.'
        })))
        setLoading(false)
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

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {loading ? (
            <p style={{ color: '#888', gridColumn: '1/-1', textAlign: 'center', padding: '60px 0' }}>Loading projects...</p>
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
