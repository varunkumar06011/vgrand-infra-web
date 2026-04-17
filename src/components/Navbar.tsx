'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const InstagramIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const FacebookIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Projects', href: '/projects' },
  { name: 'About', href: '/about' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Contact', href: '/contact' },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 1000,
        background: '#ffffff',
        borderBottom: '1px solid #f0e0e0',
        height: 84, // Increased from 72 for larger logo visibility
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}
    >
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center no-underline">
          <div className="relative w-[58px] h-[58px] md:w-[72px] md:h-[72px]">
            <Image
              src="/icon.io/apple-touch-icon.png"
              alt="V Grand Infra Logo"
              fill
              priority
              unoptimized={true}
              style={{ 
                borderRadius: 10, 
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
              }}
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 desktop-nav">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[#1a1a1a] hover:text-[#C0392B] transition-colors text-sm font-medium uppercase tracking-wider"
            >
              {link.name}
            </Link>
          ))}

          {/* Social Icons */}
          <div className="flex items-center gap-4 px-3 border-l border-slate-200">
            <a 
              href="https://www.instagram.com/vgrandinfra?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-[#C0392B] transition-colors"
              aria-label="Instagram"
            >
              <InstagramIcon size={18} />
            </a>
            <a 
              href="https://www.facebook.com/VGrandInfra/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-[#C0392B] transition-colors"
              aria-label="Facebook"
            >
              <FacebookIcon size={18} />
            </a>
          </div>

          {/* Book Site Visit */}
          <a
            href="https://wa.me/919030143333?text=Hi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold uppercase tracking-wider px-4 py-2 rounded transition-colors"
            style={{
              border: '1.5px solid #C0392B',
              color: '#C0392B',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#C0392B';
              (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              (e.currentTarget as HTMLAnchorElement).style.color = '#C0392B';
            }}
          >
            Book Site Visit
          </a>

          {/* Enquire Now */}
          <Link
            href="/contact"
            className="text-sm font-semibold uppercase tracking-wider px-4 py-2 rounded text-white transition-colors"
            style={{ background: '#C0392B' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#a93226';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#C0392B';
            }}
          >
            Enquire Now
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-[#1a1a1a] hover:text-[#C0392B] transition-colors mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden absolute top-full left-0 right-0 overflow-hidden bg-white border-t border-[#f0e0e0] shadow-xl"
          >
            <div className="flex flex-col px-6 py-6 gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-[#1a1a1a] hover:text-[#C0392B] text-base font-medium uppercase tracking-wider transition-colors"
                >
                  {link.name}
                </Link>
              ))}

              <a
                href="https://wa.me/919030143333?text=Hi"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-semibold uppercase tracking-wider px-4 py-3 rounded text-center transition-colors"
                style={{ border: '1.5px solid #C0392B', color: '#C0392B', background: 'transparent' }}
              >
                Book Site Visit
              </a>

              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-semibold uppercase tracking-wider px-4 py-3 rounded text-center text-white"
                style={{ background: '#C0392B' }}
              >
                Enquire Now
              </Link>

              {/* Mobile Social Links */}
              <div className="flex justify-center gap-8 pt-6 mt-2 border-t border-slate-100">
                <a 
                  href="https://www.instagram.com/vgrandinfra?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-[#C0392B] transition-colors"
                  aria-label="Instagram"
                >
                  <InstagramIcon size={24} />
                </a>
                <a 
                  href="https://www.facebook.com/VGrandInfra/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-[#C0392B] transition-colors"
                  aria-label="Facebook"
                >
                  <FacebookIcon size={24} />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
