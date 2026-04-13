'use client';

import { projects } from '@/data/projects';
import ProjectCard from './ProjectCard';
import { motion } from 'framer-motion';

const Projects = () => {
  return (
    <section id="projects" className="py-24 bg-black overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div className="max-w-2xl mb-8 md:mb-0">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-orange-500 font-bold tracking-[0.3em] uppercase text-sm mb-4 block"
            >
              Our Portfolio
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tight"
            >
              Iconic <span className="text-orange-500 italic">Benchmarks.</span>
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-white/40 text-sm max-w-xs uppercase tracking-widest text-right"
          >
            A curated selection of our most significant contributions to the urban landscape.
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {projects.map((project, index) => (
            <ProjectCard key={project.slug} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
