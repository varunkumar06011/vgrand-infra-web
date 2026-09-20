'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/5 py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between md:items-start footer-grid gap-10">
          <div className="mb-2 md:mb-0">
            <div className="text-2xl font-bold text-white tracking-widest leading-none mb-2">
              VGRAND <span className="text-[#C0392B]">INFRA</span>
            </div>
            <p className="text-white/30 text-xs uppercase tracking-widest">
              © 2025 V Grand Infra. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-3">
              <Link href="/terms-and-conditions" className="text-white/40 text-[11px] hover:text-white transition-colors">Terms &amp; Conditions</Link>
              <Link href="/privacy-policy" className="text-white/40 text-[11px] hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-10 md:gap-16">
            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Contact Us</div>
              <address className="not-italic grid grid-cols-1 gap-3 text-white/50 text-[12px]">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Koppolu,+Ongole,+Andhra+Pradesh+523001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 hover:text-white transition-colors"
                >
                  <MapPin size={14} className="mt-0.5 shrink-0 text-[#C0392B]" />
                  <span>Koppolu, Ongole,<br />Andhra Pradesh 523001</span>
                </a>
                <a href="tel:+919030143333" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone size={14} className="shrink-0 text-[#C0392B]" />
                  <span>+91 90301 43333</span>
                </a>
                <a href="mailto:info@vgrandgroup.com" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail size={14} className="shrink-0 text-[#C0392B]" />
                  <span>info@vgrandgroup.com</span>
                </a>
              </address>
            </div>

            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Popular Searches</div>
              <div className="grid grid-cols-1 gap-2 text-white/50 text-[11px]">
                <Link href="/projects/elite-homes" className="hover:text-white transition-colors"><span className="text-[#FFD700]">★</span> Elite Homes — Flagship Project</Link>
                <Link href="/projects/v-grand-gateway" className="hover:text-white transition-colors">V Grand Gateway — Premium Flats</Link>
                <Link href="/projects/tripura" className="hover:text-white transition-colors">Tripura — Affordable 2BHK</Link>
                <Link href="/projects" className="hover:text-white transition-colors">Gated Community in Ongole</Link>
              </div>
            </div>

            <div>
              <div className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Follow Us</div>
              <div className="flex space-x-6 text-white/70">
                <a
                  href="https://www.instagram.com/vgrandinfra"
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
