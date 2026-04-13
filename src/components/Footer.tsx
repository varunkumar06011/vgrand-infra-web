'use client';

import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/5 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center footer-grid">
          <div className="mb-8 md:mb-0">
            <div className="text-2xl font-bold text-white tracking-widest leading-none mb-2">
              VGRAND <span style={{ color: '#C0392B' }}>INFRA</span>
            </div>
            <p className="text-white/30 text-xs uppercase tracking-widest">
              © 2025 V Grand Infra. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-12">
            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Follow Us</div>
              <div className="flex space-x-6 text-white/70">
                <a href="#" className="hover:text-orange-500 transition-colors text-sm uppercase font-medium">Linkedin</a>
                <a href="#" className="hover:text-orange-500 transition-colors text-sm uppercase font-medium">Instagram</a>
                <a href="#" className="hover:text-orange-500 transition-colors text-sm uppercase font-medium">Behance</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
