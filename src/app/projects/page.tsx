'use client';

import { useState, useEffect, useMemo } from 'react';
import ProjectCard from '@/components/ProjectCard';
import PageHero from '@/components/ui/PageHero';
import Reveal from '@/components/ui/Reveal';
import { mergeProjects } from '@/lib/mergeProjects';

const statusTabs = ['All', 'Ongoing', 'Upcoming', 'Completed'] as const;
const typeTabs = [
  { label: 'All types', value: 'all' },
  { label: '3 BHK', value: '3 bhk' },
  { label: '2 BHK', value: '2 bhk' },
  { label: 'Gated community', value: 'gated' },
  { label: 'Hospital', value: 'hospital' },
];

const promises = [
  ['Uncompromised material quality', 'We build your homes using the same premium standards and materials we would choose for our own families. No shortcuts, no compromises.'],
  ['Transparency over everything', 'From clear titles and legal approvals to the actual progress on the ground, what you see is exactly what you get. No hidden charges, no sudden surprises.'],
  ['Prime, purposeful locations', 'We select locations like Koppolu that offer seamless connectivity — like direct access to the NH-16 Highway — so your family stays connected and your investment grows in value.'],
  ['Homes, not just buildings', 'We focus on creating practical, well-ventilated, and thriving residential spaces where everyday communities can grow, celebrate, and live securely.'],
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<(typeof statusTabs)[number]>('All');
  const [type, setType] = useState('all');

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load projects');
        return res.json();
      })
      .then((data) => setProjects(mergeProjects(Array.isArray(data) ? data : [])))
      // If the API is unavailable, still show the built-in project list.
      .catch(() => setProjects(mergeProjects([])))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        const statusMatch = status === 'All' || (p.status || '').toLowerCase() === status.toLowerCase();
        const typeMatch = type === 'all' || (p.type || '').toLowerCase().includes(type);
        return statusMatch && typeMatch;
      }),
    [projects, status, type]
  );

  const pill = (active: boolean) =>
    `rounded-full border px-5 py-2.5 text-[14px] font-medium transition-all ${
      active ? 'border-forest bg-forest text-white' : 'border-forest/20 bg-white text-forest hover:border-forest'
    }`;

  return (
    <>
      <PageHero
        eyebrow="Our portfolio"
        title={<>Building communities where <span className="italic text-meadow-600">families thrive.</span></>}
        intro="Explore our ongoing and upcoming projects in Ongole — homes, and a hospital for the community."
      />

      <section className="section !pt-6">
        <div className="container-x">
          {/* Filters */}
          <div className="mb-12 grid gap-5 rounded-[1.5rem] border border-forest/10 bg-white p-5 md:p-7">
            <div>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-forest/50">Status</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                {statusTabs.map((s) => (
                  <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s} className={pill(status === s)}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-forest/50">Type</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
                {typeTabs.map((t) => (
                  <button key={t.value} onClick={() => setType(t.value)} aria-pressed={type === t.value} className={pill(type === t.value)}>{t.label}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" aria-busy>
              {[0, 1, 2].map((i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[1.5rem] bg-cream" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[1.5rem] bg-cream px-6 py-16 text-center">
              <p className="font-heading text-[24px] text-forest">No projects match those filters.</p>
              <button onClick={() => { setStatus('All'); setType('all'); }} className="btn btn-dark mt-6">Clear filters</button>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((project, index) => (
                <ProjectCard key={project.id || project.slug} project={project} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promise */}
      <section className="section bg-cream">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Why Ongole trusts us</p>
            <h2 className="mt-4 font-heading text-forest">Building with honesty, delivering with pride</h2>
            <p className="mt-5">
              Buying a home is not just a financial transaction; it is the culmination of years of hard work, sacrifices, and a lifelong dream for your family. At V Grand Infra, we understand the value of every single rupee you invest with us.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {promises.map(([title, body], i) => (
              <Reveal key={title} delay={(i % 2) * 0.06}>
                <div className="card h-full p-7">
                  <h3 className="font-heading text-[22px] text-forest">{title}</h3>
                  <p className="mt-3 !text-[15px]">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10">
            <p className="max-w-3xl border-l-2 border-meadow pl-5 font-heading text-[20px] leading-snug text-forest">
              Our promise: we do not just deliver keys; we deliver peace of mind. Walk into any of our ongoing or upcoming projects in Ongole, look at the construction quality yourself, and talk to our team.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
