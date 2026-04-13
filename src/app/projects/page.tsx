'use client'
import { useState } from 'react'
import { projects } from '@/data/projects'

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
    background: '#fff',
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
          background: '#fff',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 28 }}>
          {filtered.length === 0 ? (
            <p style={{ color: '#888', gridColumn: '1/-1', textAlign: 'center', padding: '60px 0' }}>No projects match your filters.</p>
          ) : filtered.map(project => (
            <div key={project.slug} style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #e8d5d5' }}>
              <div style={{ position: 'relative', height: 220 }}>
                <img src={project.image} alt={project.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                <span style={{
                  position: 'absolute', top: 14, right: 14,
                  background: project.status === 'Ongoing' ? '#C0392B' : '#1a1a1a',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  letterSpacing: 2, textTransform: 'uppercase',
                  padding: '5px 10px', borderRadius: 4
                }}>{project.status}</span>
              </div>
              <div style={{ padding: '20px 20px 24px' }}>
                <p style={{ fontSize: 11, color: '#C0392B', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{project.type}</p>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#1a1a1a', fontWeight: 700, marginBottom: 4 }}>{project.name}</h3>
                <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{project.location}</p>
                <p style={{ fontSize: 12, color: '#C0392B', fontWeight: 600, borderLeft: '2px solid #C0392B', paddingLeft: 8, marginBottom: 12 }}>
                  Adjacent to NH-16 Highway — High Appreciation Value
                </p>
                <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{project.description.slice(0, 90)}...</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#C0392B', fontWeight: 700, fontSize: 15 }}>{project.startingPrice}</span>
                  <a href={`/projects/${project.slug}`}
                    style={{ color: '#C0392B', fontSize: 13, fontWeight: 700, letterSpacing: 1, textDecoration: 'none', borderBottom: '1px solid #C0392B', paddingBottom: 1 }}>
                    View Details
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
