'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

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
      className="block group relative"
      style={{ isolation: 'isolate' }}
    >
      <motion.div
        variants={cardVariants}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
        className="relative overflow-hidden rounded-2xl bg-[#fff5f5] border border-[#e8d5d5] aspect-[4/5] cursor-pointer"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src={project.image}
            alt={project.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-110"
            loading={index < 3 ? 'eager' : 'lazy'}
            priority={index < 2}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />

          <span style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: project.status === 'Ongoing'
              ? '#C0392B'
              : project.status === 'Upcoming'
                ? '#1a1a1a'
                : '#2E7D32',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            padding: '5px 12px',
            borderRadius: 4,
            zIndex: 5
          }}>
            {project.status}
          </span>
        </div>

        <div className="absolute inset-0 z-10 p-8 flex flex-col justify-end">
          <motion.span
            variants={itemVariants}
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: '#fff' }}
          >
            {project.type}
          </motion.span>
          <h3 className="text-2xl font-bold text-white mb-1 transition-colors">
            {project.name}
          </h3>
          <p className="text-white/70 text-xs mb-3">{project.location}</p>
          <p style={{
            fontSize: 12,
            color: '#fff',
            fontWeight: 600,
            letterSpacing: '0.5px',
            marginTop: 8,
            borderLeft: '2px solid #C0392B',
            paddingLeft: 8
          }}>
            Adjacent to NH-16 Highway — High Appreciation Value
          </p>
          <p className="text-white/80 text-sm line-clamp-2 transition-all duration-300">
            {project.description}
          </p>
          <div
            className="mt-4 self-start text-xs font-bold uppercase tracking-widest px-4 py-2 rounded transition-all duration-300"
            style={{ background: '#C0392B', color: '#fff' }}
          >
            View Project →
          </div>
          {/* Mobile indicator for interactivity */}
          <div className="md:hidden mt-2 text-[10px] font-bold text-red-500/50 uppercase tracking-widest">
            Tap to view Details
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProjectCard;
