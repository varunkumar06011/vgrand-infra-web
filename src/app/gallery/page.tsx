import type { Metadata } from 'next';
import GalleryContent from './GalleryContent';

export const metadata: Metadata = {
  title: 'Gallery | V Grand Infra | Construction Updates in Ongole',
  description: 'Explore the latest construction photos and site videos of V Grand Infra projects in Ongole and Koppolu. View real-time progress updates, site walkthroughs, and project milestones.',
  keywords: 'v grand infra gallery, construction updates ongole, site photos ongole, v grand infra site walkthrough, ongoing projects ongole gallery, real estate project gallery andhra pradesh',
  openGraph: {
    title: 'Gallery | V Grand Infra Construction Updates',
    description: 'Latest construction photos and site videos from V Grand Infra projects in Ongole and Koppolu.',
    type: 'website',
  },
};

export default function GalleryPage() {
  return <GalleryContent />;
}


