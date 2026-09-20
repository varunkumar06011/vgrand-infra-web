'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getTour } from '@/data/tours';

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

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  const router = useRouter();
  const hasTour = !!getTour(project.slug);

  const openFlat = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/projects/${project.slug}?tour=open`);
  };

  const cardVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 }
  };

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block group relative isolate"
    >
      <motion.div
        variants={cardVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.1 }}
        className="relative overflow-hidden rounded-2xl bg-white lg:bg-[#fff5f5] border border-[#e8d5d5] flex flex-col lg:aspect-[4/5] cursor-pointer shadow-sm lg:shadow-none"
      >
        {/* Image Container */}
        <div className="relative aspect-[2/1] md:aspect-[16/10] lg:absolute lg:inset-0 z-0 overflow-hidden bg-[#0a0a0a]">
          <Image
            src={project.image}
            alt={project.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-contain md:object-cover object-center transition-transform duration-500 group-hover:scale-110"
            loading={index < 3 ? 'eager' : 'lazy'}
            priority={index < 2}
          />
          
          {/* Gradient overlay - Only active in overlay mode (xl) */}
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />

          <span
            className="absolute top-[14px] right-[14px] text-white text-[10px] font-bold tracking-[2px] uppercase py-[5px] px-3 rounded z-[5]"
            style={{
              background: project.status === 'Ongoing'
                ? '#C0392B'
                : project.status === 'Upcoming'
                  ? '#1a1a1a'
                  : '#2E7D32',
            }}>
            {project.status}
          </span>

          {project.slug === 'elite-homes' && (
            <span className="absolute top-[14px] left-[14px] bg-[#FFD700] text-[#1a1a1a] text-[10px] font-extrabold tracking-[1px] uppercase py-[5px] px-3 rounded z-[5] shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
              ★ Flagship
            </span>
          )}
        </div>

        {/* Content Details - Forced High Contrast for Laptops/Tablets */}
        <div className="relative lg:absolute lg:inset-0 z-10 p-6 lg:p-8 flex flex-col justify-end lg:bg-gradient-to-t lg:from-black/50 lg:to-transparent">
          <motion.span
            variants={itemVariants}
            className="text-[10px] lg:text-xs font-bold uppercase tracking-widest mb-1 lg:mb-2 text-[#C0392B] lg:text-white"
          >
            {project.type}
          </motion.span>
          <h3 className="text-xl lg:text-2xl font-bold text-[#1a1a1a] lg:text-white mb-1 transition-colors">
            {project.name}
          </h3>
          <p className="text-slate-500 lg:text-white/70 text-[11px] lg:text-xs mb-3">{project.location}</p>
          
          <p className="text-xs font-semibold tracking-[0.5px] mt-1 border-l-2 border-[#C0392B] pl-2 text-[#1a1a1a] lg:text-white mb-2">
            Adjacent to NH-16 Highway — High Appreciation Value
          </p>
          
          <p className="text-slate-600 lg:text-white/80 text-sm line-clamp-2 lg:line-clamp-2 transition-all duration-300">
            {project.description}
          </p>
          
          <div className="mt-4 self-start flex items-center gap-2.5 flex-wrap">
            <div
              className="text-[10px] lg:text-xs font-bold uppercase tracking-widest px-4 py-2 rounded transition-all duration-300 bg-[#C0392B] text-white"
            >
              View Project →
            </div>
            {hasTour && (
              <span
                role="link"
                tabIndex={0}
                onClick={openFlat}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') openFlat(e);
                }}
                aria-label={`View the ${project.name} sample flat walkthrough`}
                className="text-[10px] lg:text-xs font-bold uppercase tracking-widest px-4 py-2 rounded transition-all duration-300 border border-[#C0392B] text-[#C0392B] hover:bg-[#C0392B] hover:text-white lg:border-white lg:text-white lg:hover:bg-white lg:hover:text-[#1a1a1a] cursor-pointer"
              >
                View Flat →
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProjectCard;
