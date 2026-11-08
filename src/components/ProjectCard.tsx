'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { getTour } from '@/data/tours';
import Reveal from '@/components/ui/Reveal';

interface Project {
  slug: string;
  name: string;
  location: string;
  type: string;
  status: string;
  startingPrice: string;
  description: string;
  image: string;
}

interface ProjectCardProps {
  project: Project;
  index: number;
}

const statusStyle: Record<string, string> = {
  Ongoing: 'bg-meadow-600 text-white',
  Upcoming: 'bg-sky text-white',
  Completed: 'bg-forest text-white',
};

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  const router = useRouter();
  const hasTour = !!getTour(project.slug);

  const openFlat = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/projects/${project.slug}?tour=open`);
  };

  return (
    <Reveal delay={(index % 3) * 0.08}>
      <Link href={`/projects/${project.slug}`} className="group block h-full">
        <article className="card flex h-full flex-col overflow-hidden transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-lift">
          <div className="relative aspect-[4/3] overflow-hidden bg-cream">
            <Image
              src={project.image}
              alt={project.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
              priority={index < 2}
            />
            {/* Dither veil — dissolves on hover to reveal the full-colour image */}
            <div
              aria-hidden
              className="absolute inset-0 transition-opacity duration-700 group-hover:opacity-0 opacity-70"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(47,111,220,0.55) 1.2px, transparent 1.8px)',
                backgroundSize: '9px 9px',
                maskImage: 'linear-gradient(to top, black 0%, transparent 70%)',
                WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 70%)',
              }}
            />
            <span
              className={`absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                statusStyle[project.status] ?? 'bg-forest text-white'
              }`}
            >
              {project.status}
            </span>
            {project.slug === 'elite-homes' && (
              <span className="absolute right-4 top-4 rounded-full bg-cream px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-forest">
                Flagship
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col p-6 md:p-7">
            <span className="eyebrow !text-[11px]">{project.type}</span>
            <h3 className="mt-3 font-heading text-[26px] text-forest">{project.name}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] !text-forest/60">
              <MapPin size={14} className="text-meadow" /> {project.location}
            </p>
            <p className="mt-4 line-clamp-2 !text-[14px] !leading-relaxed">{project.description}</p>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
              <div>
                <span className="block text-[11px] uppercase tracking-[0.16em] text-forest/50">Starting</span>
                <span className="font-heading text-[17px] text-forest">{project.startingPrice}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-[13px] font-semibold text-white transition-colors group-hover:bg-meadow-600">
                View <ArrowUpRight size={15} />
              </span>
            </div>

            {hasTour && (
              <span
                role="link"
                tabIndex={0}
                onClick={openFlat}
                onKeyDown={(e) => e.key === 'Enter' && openFlat(e)}
                aria-label={`View the ${project.name} sample flat walkthrough`}
                className="mt-4 inline-flex cursor-pointer items-center gap-1.5 self-start text-[13px] font-semibold text-meadow-600 underline-offset-4 hover:underline"
              >
                Walk through the sample flat <ArrowUpRight size={14} />
              </span>
            )}
          </div>
        </article>
      </Link>
    </Reveal>
  );
};

export default ProjectCard;
