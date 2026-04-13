'use client';

import { motion } from 'framer-motion';
const services = [
  {
    title: 'Commercial Construction',
    desc: 'Bespoke corporate spaces designed for modern business needs.'
  },
  {
    title: 'Architectural Planning',
    desc: 'Precision engineering meets visionary design.'
  },
  {
    title: 'Project Management',
    desc: 'End-to-end oversight ensuring timely and quality delivery.'
  },
  {
    title: 'Infrastructure Development',
    desc: 'Building the skeletal frame of future urban centers.'
  },
  {
    title: 'Supply Chain Logistics',
    desc: 'Managing material flow for large scale projects.'
  },
  {
    title: 'Quality Assurance',
    desc: 'Uncompromising standards in safety and durability.'
  }
];

const Services = () => {
  return (
    <section id="services" className="py-24 bg-zinc-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mb-16">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-orange-500 font-bold tracking-[0.3em] uppercase text-sm mb-4 block"
          >
            Capabilities
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold text-white uppercase tracking-tight"
          >
            Engineering <span className="text-orange-500 italic">Excellence.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 border border-white/5 bg-white/[0.02] rounded-3xl hover:bg-white/[0.04] hover:border-orange-500/30 transition-all duration-300"
            >
              <h3 className="text-xl font-bold text-white mb-4 group-hover:text-orange-500 transition-colors">
                {service.title}
              </h3>
              <p className="text-white/50 leading-relaxed">
                {service.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
