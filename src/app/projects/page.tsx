'use client'
import { useState } from 'react'
import { projects } from '@/data/projects'
import ProjectCard from '@/components/ProjectCard'

export default function ProjectsPage() {
  const [location, setLocation] = useState('all')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')

  const filtered = projects.filter(p => {
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
        <div style={{
          background: '#fff5f5',
          border: '1px solid #e8d5d5',
          borderRadius: 10,
          padding: '24px 28px',
          marginBottom: 48,
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          alignItems: 'flex-end'
        }}>
          <div>
            <label style={labelStyle}>Location</label>
            <select style={selectStyle} value={location} onChange={e => setLocation(e.target.value)}>
              <option value="all">All Locations</option>
              <option value="koppolu">Koppolu</option>
              <option value="ongole">Ongole</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={selectStyle} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="ongoing">Ongoing</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Type</label>
            <select style={selectStyle} value={type} onChange={e => setType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="3 bhk">3 BHK</option>
              <option value="2 bhk">2 BHK</option>
              <option value="gated">Gated Community</option>
            </select>
          </div>
          <button
            onClick={() => { setLocation('all'); setStatus('all'); setType('all') }}
            style={{ background: 'none', border: 'none', color: '#C0392B', fontSize: 14, fontWeight: 700, cursor: 'pointer', paddingBottom: 2, borderBottom: '1px solid #C0392B' }}>
            Clear Filters
          </button>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {filtered.length === 0 ? (
            <p style={{ color: '#888', gridColumn: '1/-1', textAlign: 'center', padding: '60px 0' }}>No projects match your filters.</p>
          ) : (
            filtered.map((project, index) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))
          )}
        </div>
      </div>
    </main>
  )
}
