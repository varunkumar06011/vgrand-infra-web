'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

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
        height: 64,
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
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Image
            src="/icon.io/apple-touch-icon.png"
            alt="V Grand Infra Logo"
            width={38}
            height={38}
            unoptimized={true}
            style={{ borderRadius: 6, objectFit: 'contain' }}
          />
          <span className="text-xl font-bold tracking-widest text-[#1a1a1a]">
            VGRAND{' '}
            <span style={{ color: '#C0392B' }}>INFRA</span>
          </span>
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

          {/* Book Site Visit */}
          <a
            href="https://wa.me/919030143333?text=Hi, I want to book a site visit"
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
                href="https://wa.me/919030143333?text=Hi, I want to book a site visit"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
