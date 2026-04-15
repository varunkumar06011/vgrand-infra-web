import type { Metadata } from "next";
import { Montserrat, Inter } from 'next/font/google'
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RouteHandler from '@/components/RouteHandler';
import "./globals.css";

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heading',
  display: 'swap'
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap'
})

export const metadata = {
  title: 'V Grand Infra | Apartments & Flats in Ongole, Andhra Pradesh',
  description: 'V Grand Infra builds premium 3BHK gated community apartments in Ongole and Koppolu, Andhra Pradesh. Starting from ₹29 Lakhs. RERA registered. Adjacent to NH-16 highway. Best flats, plots and homes near Ongole.',
  keywords: [
    'apartments in ongole',
    'flats in ongole',
    '3bhk flats ongole',
    'gated community ongole',
    'plots near ongole',
    'best infra ongole',
    'ongole real estate',
    'koppolu apartments',
    'koppolu flats',
    'budget apartments ongole',
    'quality flats ongole andhra pradesh',
    'affordable homes ongole',
    'new flats in ongole 2025',
    'residential projects ongole',
    'v grand infra',
    'elite homes koppolu',
    'rera registered apartments ongole',
    'nh16 highway apartments',
    'luxury flats ongole',
    'home in ongole',
    'flat booking ongole',
    'best builder ongole',
    'construction company ongole',
    'plots koppolu ongole',
    'prakasam district apartments'
  ].join(', '),
  openGraph: {
    title: 'V Grand Infra | Best Apartments in Ongole from ₹29 Lakhs',
    description: 'Premium 3BHK gated community flats in Ongole & Koppolu. RERA registered P08440065656. Adjacent to NH-16 highway. Starting ₹29 Lakhs.',
    url: 'https://vgrandgroup.com',
    siteName: 'V Grand Infra',
    locale: 'en_IN',
    type: 'website',
  },
  alternates: {
    canonical: 'https://vgrandgroup.com'
  },
  other: {
    'preload': [
      '/NEW%20FRAMES/ezgif-frame-001.png',
      '/NEW%20FRAMES/ezgif-frame-002.png',
      '/NEW%20FRAMES/ezgif-frame-003.png',
      '/NEW%20FRAMES/ezgif-frame-004.png',
      '/NEW%20FRAMES/ezgif-frame-005.png',
      '/NEW%20FRAMES/ezgif-frame-006.png',
      '/NEW%20FRAMES/ezgif-frame-007.png',
      '/NEW%20FRAMES/ezgif-frame-008.png',
      '/NEW%20FRAMES/ezgif-frame-009.png',
      '/NEW%20FRAMES/ezgif-frame-010.png'
    ]
  }
}

import { headers } from 'next/headers';
import SmoothScroll from '@/components/SmoothScroll';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const fullPath = headersList.get('x-url') || '';
  const isAdmin = fullPath.includes('/admin');

  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body>
        <RouteHandler />
        {!isAdmin && <Navbar />}
        <SmoothScroll>
          <main>{children}</main>
        </SmoothScroll>
        {!isAdmin && <Footer />}
        {!isAdmin && (
          <a
            href="https://wa.me/919030143333?text=Hi%2C%20I%20am%20interested%20in%20V%20Grand%20Infra%20projects"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'fixed', bottom: 24, right: 24,
              width: 54, height: 54, borderRadius: '50%',
              background: '#25D366', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              textDecoration: 'none'
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        )}
      </body>
    </html>
  );
}
