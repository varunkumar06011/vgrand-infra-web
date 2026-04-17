'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

// --- SVG Icons ---
const InstagramIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="opacity-80"><path d="M22 11h-9V2h7a2 2 0 012 2v7zM11 11H2V4a2 2 0 012-2h7v9zM2 13h9v9H4a2 2 0 012-2v-7zM13 22v-9h9v7a2 2 0 01-2 2h-7z"></path></svg>
);

const ReelsIcon = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className="opacity-80"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"></path></svg>
);

const TaggedIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-80"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

// --- Mock Data ---
interface InstagramPost {
  id: string;
  image: string;
  caption: string;
  link: string;
  type?: string;
}

const MOCK_POSTS: InstagramPost[] = [
  { id: 'm1', image: '/images/elite-homes.jpg', caption: 'Luxury lives here. Ongoing construction progress at Elite Homes, Ongole.', link: 'https://www.instagram.com/vgrandinfra', type: 'IMAGE' },
  { id: 'm2', image: '/images/tripura.jpg', caption: 'Capturing the heights of excellence at Tripura. Quality in every brick.', link: 'https://www.instagram.com/vgrandinfra', type: 'VIDEO' },
  { id: 'm3', image: '/images/swimming pool elite .png', caption: 'A splash of luxury. The premium amenities are taking shape.', link: 'https://www.instagram.com/vgrandinfra', type: 'IMAGE' },
  { id: 'm4', image: '/images/elite-homes.jpg', caption: 'Architectural precision at its finest. Experience V Grand Infra.', link: 'https://www.instagram.com/vgrandinfra', type: 'IMAGE' },
  { id: 'm5', image: '/images/tripura.jpg', caption: 'Building the foundations for your future. #VGrandInfra #OngoleRealEstate', link: 'https://www.instagram.com/vgrandinfra', type: 'VIDEO' },
  { id: 'm6', image: '/images/swimming pool elite .png', caption: 'Where design meets durability. Our latest onsite visual update.', link: 'https://www.instagram.com/vgrandinfra', type: 'IMAGE' },
];

export default function GalleryPage() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch('/api/instagram');
        const data = await res.json();
        
        if (data && Array.isArray(data) && data.length > 0) {
          setPosts(data);
        } else {
          setPosts(MOCK_POSTS);
        }
      } catch (err: any) {
        console.error('Gallery fetch error:', err);
        setPosts(MOCK_POSTS);
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, []);

  return (
    <main style={{ background: '#fff', minHeight: '100vh', paddingTop: 100 }}>
      <div style={{ maxWidth: 935, margin: '0 auto', padding: '0 0 80px' }}>
        {/* Header Section */}
        <div style={{ padding: '0 24px', marginBottom: 44 }}>
          <p style={{ color: '#C0392B', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Visual Journey</p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 5vw, 44px)', color: '#1a1a1a', marginBottom: 16, fontWeight: 700 }}>Gallery</h1>
          <p style={{ color: '#555', fontSize: 15, lineHeight: 1.6, maxWidth: 650 }}>
            Stay updated with our latest project milestones and construction progress directly from our site.
          </p>
        </div>

        {/* Instagram-style Tabs overlaying the grid */}
        <div className="flex justify-center border-t border-slate-200 mb-0 md:mb-4">
           <TabButton 
             active={activeTab === 'posts'} 
             onClick={() => setActiveTab('posts')}
             icon={<GridIcon />}
             label="POSTS"
           />
           <TabButton 
             active={activeTab === 'reels'} 
             onClick={() => setActiveTab('reels')}
             icon={<ReelsIcon />}
             label="REELS"
           />
           <TabButton 
             active={activeTab === 'tagged'} 
             onClick={() => setActiveTab('tagged')}
             icon={<TaggedIcon />}
             label="TAGGED"
           />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-[#C0392B] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-7">
            {posts.map((post, idx) => (
              <motion.a
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative aspect-square overflow-hidden bg-slate-100"
              >
                <Image 
                  src={post.image} 
                  alt={post.caption || 'Project Update'} 
                  fill 
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, 300px"
                />
                
                {/* Visual Reels Indicator Icon (Top Right) */}
                {(post.type === 'VIDEO' || post.type === 'REELS') && (
                  <div className="absolute top-2 right-2 z-10 text-white drop-shadow-lg">
                    <ReelsIcon size={22} />
                  </div>
                )}

                {/* Desktop Hover Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex gap-4 text-white font-bold text-sm">
                    <div className="flex items-center gap-2">
                       <InstagramIcon size={20} />
                       <span>View on Instagram</span>
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function TabButton({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-1.5 px-6 py-4 border-t transition-colors ${active ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-400'}`}
    >
      {icon}
      <span className="text-[11px] font-bold tracking-[0.1em] hidden sm:inline">{label}</span>
    </button>
  );
}


