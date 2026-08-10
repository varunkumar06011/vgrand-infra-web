'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

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
            <div className="flex space-x-4 mt-3">
              <Link href="/terms-and-conditions" className="text-white/40 text-[11px] hover:text-white transition-colors">Terms &amp; Conditions</Link>
              <Link href="/privacy-policy" className="text-white/40 text-[11px] hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-16">
            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Popular Searches</div>
              <div className="grid grid-cols-1 gap-2 text-white/50 text-[11px]">
                <Link href="/projects/elite-homes" className="hover:text-white transition-colors"><span style={{ color: '#FFD700' }}>★</span> Elite Homes — Flagship Project</Link>
                <Link href="/projects/v-grand-gateway" className="hover:text-white transition-colors">V Grand Gateway — Premium Flats</Link>
                <Link href="/projects/tripura" className="hover:text-white transition-colors">Tripura — Affordable 2BHK</Link>
                <Link href="/projects" className="hover:text-white transition-colors">Gated Community in Ongole</Link>
              </div>
            </div>
            
            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Follow Us</div>
              <div className="flex space-x-6 text-white/70">
                <a 
                  href="https://www.instagram.com/vgrandinfra?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-[#C0392B] transition-colors text-sm uppercase font-medium"
                >
                  Instagram
                </a>
                <a 
                  href="https://www.facebook.com/VGrandInfra/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-[#C0392B] transition-colors text-sm uppercase font-medium"
                >
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
