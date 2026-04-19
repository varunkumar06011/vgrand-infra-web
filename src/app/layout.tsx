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
    'best construction company in ongole',
    'best builders in ongole',
    'top real estate developers in ongole',
    'infrastructure company in prakasam district',
    'trusted builders in ongole',
    'vgrand infra ongole projects',
    'premium flats in ongole',
    'flats in ongole for sale',
    'apartments in ongole under 30 lakhs',
    'gated community in ongole',
    'ongole real estate projects',
    'new housing projects in ongole 2026',
    'plots near ongole highway',
    'villas in prakasam district',
    'flats near ongole',
    'real estate in prakasam district andhra pradesh',
    'best gated community flats under 30 lakhs in ongole',
    'affordable apartments in ongole for middle class',
    'ready to move flats in ongole with amenities',
    '2bhk flats in ongole near highway',
    'budget housing projects in ongole',
    'low cost flats in ongole with emi options',
    'high quality construction in ongole',
    'trusted infrastructure company in ongole',
    'rera approved projects in ongole',
    'modern gated community with security in ongole',
    'eco friendly housing projects in ongole',
    'premium lifestyle apartments ongole',
    'best areas to buy flats in ongole',
    'ongole property price trends 2026',
    'is it safe to invest in ongole real estate',
    'how to choose a builder in ongole',
    'real estate investment in prakasam district',
    'luxury flats in ongole',
    'upcoming projects in ongole',
    'residential projects in ongole',
    'best apartments in ongole',
    'affordable housing in ongole',
    'top builders in prakasam district',
    'ongole flats price',
    'flats for sale near ongole highway',
    '1bhk flats in ongole',
    '2bhk flats in ongole',
    '3bhk flats in ongole',
    'gated community apartments in ongole',
    'ready to move apartments in ongole',
    'ongoing projects in ongole',
    'newly launched flats in ongole',
    'real estate developers in andhra pradesh',
    'best housing projects in ongole',
    'ongole property investment opportunities',
    'cheap flats in ongole',
    'premium villas near ongole',
    'plots for sale in ongole',
    'real estate companies in ongole',
    'top construction companies in ongole',
    'best real estate company in ongole',
    'ongole real estate market',
    'affordable gated communities in ongole',
    'investment properties in ongole',
    'ongole residential flats for sale',
    'best infrastructure projects in ongole',
    'ongole builders and developers'
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
      <head />
      <body className={`${inter.className} ${montserrat.className}`} suppressHydrationWarning>
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
