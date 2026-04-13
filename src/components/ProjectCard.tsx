'use client';

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
  return (
    <Link href={`/projects/${project.slug}`} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 aspect-[4/5]"
      >
        <div className="absolute inset-0 z-0">
          <img
            src={project.image}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
        </div>

        <div className="absolute inset-0 z-10 p-8 flex flex-col justify-end">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: '#C0392B' }}
          >
            {project.type}
          </motion.span>
          <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
            {project.name}
          </h3>
          <p className="text-white/50 text-xs mb-3">{project.location}</p>
          <p style={{
            fontSize: 12,
            color: '#C0392B',
            fontWeight: 600,
            letterSpacing: '0.5px',
            marginTop: 8,
            borderLeft: '2px solid #C0392B',
            paddingLeft: 8
          }}>
            Adjacent to NH-16 Highway — High Appreciation Value
          </p>
          <p className="text-white/60 text-sm line-clamp-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            {project.description}
          </p>
          <div
            className="mt-4 self-start text-xs font-bold uppercase tracking-widest px-4 py-2 rounded opacity-0 group-hover:opacity-100 transition-all duration-300"
            style={{ background: '#C0392B', color: '#fff' }}
          >
            View Project →
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProjectCard;
