import type { Metadata } from "next";
import { Montserrat, Inter } from 'next/font/google'
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RouteHandler from '@/components/RouteHandler';
import SmoothScroll from '@/components/SmoothScroll';
import "./globals.css";
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton';

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
      '/images/elite-homes.jpg'
    ]
  }
}

import { headers } from 'next/headers';
import VisitTracker from '@/components/VisitTracker';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const fullPath = headersList.get('x-url') || '';
  const isAdmin = fullPath.includes('/admin');

  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preload" href="/images/elite-homes.jpg" as="image" fetchPriority="high" />
      </head>
      <body suppressHydrationWarning>
        <VisitTracker />
        <RouteHandler />
        {!isAdmin && <Navbar />}
        <SmoothScroll>
          <main>{children}</main>
        </SmoothScroll>
        {!isAdmin && <Footer />}
        {!isAdmin && <WhatsAppButton variant="floating" phoneNumber="919030143333" />}
      </body>
    </html>
  );
}
