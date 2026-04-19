'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const CarouselIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="opacity-90"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/><path d="M14 17H7v-3h7v3zm3-4H7v-3h10v3zm0-4H7V6h10v3z" opacity=".3"/></svg>
);

// --- Interface ---
interface InstagramPost {
  id: string;
  username: string;
  image: string;
  media_url: string;
  caption: string;
  link: string;
  type: string;
  timestamp: string;
  children?: {
    id: string;
    media_url: string;
    media_type: string;
    thumbnail_url?: string;
  }[];
}

const MOCK_POSTS: InstagramPost[] = [
  { id: 'm1', username: 'vgrandinfra', image: '/images/elite-homes.jpg', media_url: '/images/elite-homes.jpg', caption: 'Luxury lives here. Ongoing construction progress at Elite Homes, Ongole.', link: 'https://www.instagram.com/vgrandinfra', type: 'IMAGE', timestamp: '2024-03-20T10:00:00Z' },
  { id: 'm2', username: 'vgrandinfra', image: '/images/tripura.jpg', media_url: '/images/tripura.jpg', caption: 'Capturing the heights of excellence at Tripura. Quality in every brick.', link: 'https://www.instagram.com/vgrandinfra', type: 'VIDEO', timestamp: '2024-03-19T10:00:00Z' },
  { id: 'm3', username: 'vgrandinfra', image: '/images/swimming pool elite .png', media_url: '/images/swimming pool elite .png', caption: 'A splash of luxury. The premium amenities are taking shape.', link: 'https://www.instagram.com/vgrandinfra', type: 'IMAGE', timestamp: '2024-03-18T10:00:00Z' },
  { id: 'm4', username: 'vgrandinfra', image: '/images/elite-homes.jpg', media_url: '/images/elite-homes.jpg', caption: 'Architectural precision at its finest. Experience V Grand Infra.', link: 'https://www.instagram.com/vgrandinfra', type: 'IMAGE', timestamp: '2024-03-17T10:00:00Z' },
  { id: 'm5', username: 'vgrandinfra', image: '/images/tripura.jpg', media_url: '/images/tripura.jpg', caption: 'Building the foundations for your future. #VGrandInfra #OngoleRealEstate', link: 'https://www.instagram.com/vgrandinfra', type: 'VIDEO', timestamp: '2024-03-16T10:00:00Z' },
  { id: 'm6', username: 'vgrandinfra', image: '/images/swimming pool elite .png', media_url: '/images/swimming pool elite .png', caption: 'Where design meets durability. Our latest onsite visual update.', link: 'https://www.instagram.com/vgrandinfra', type: 'IMAGE', timestamp: '2024-03-15T10:00:00Z' },
];

export default function GalleryPage() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);

  useEffect(() => {
    async function fetchFeed() {
      try {
        const res = await fetch('/api/instagram');
        
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

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

        {/* Tabs */}
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
              <motion.div
                onClick={() => setSelectedPost(post)}
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative aspect-square overflow-hidden bg-slate-100 cursor-pointer"
              >
                <Image 
                  src={post.image} 
                  alt={post.caption || 'Project Update'} 
                  fill 
                  className="object-cover"
                  sizes="(max-width: 640px) 33vw, 300px"
                />
                
                {/* Specific Icon Indicators */}
                {(post.type === 'VIDEO' || post.type === 'REELS') && (
                  <div className="absolute top-2 right-2 z-10 text-white drop-shadow-md">
                    <ReelsIcon size={20} />
                  </div>
                )}
                {post.type === 'CAROUSEL_ALBUM' && (
                  <div className="absolute top-2 right-2 z-10 text-white drop-shadow-md">
                    <CarouselIcon />
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <div className="flex gap-4 text-white font-bold text-sm">
                    <div className="flex items-center gap-2">
                       <InstagramIcon size={20} />
                       <span>Expand</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedPost && (
          <InstagramModal 
            post={selectedPost} 
            onClose={() => setSelectedPost(null)} 
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function InstagramModal({ post, onClose }: { post: InstagramPost, onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current === e.target) onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-10 backdrop-blur-sm"
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2 z-[110]"
      >
        <CloseIcon />
      </button>

      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white w-full max-w-[1000px] h-full max-h-[90vh] md:max-h-[85vh] rounded-xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
      >
        {/* Media Side */}
        <div className="w-full h-[50%] md:h-full md:flex-1 bg-black flex items-center justify-center relative group overflow-hidden">
          <MediaViewer post={post} />
        </div>

        {/* Content Side */}
        <div className="w-full md:w-[400px] flex flex-col bg-white">
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#C0392B] font-bold">V</div>
             <div className="flex flex-col">
               <span className="font-bold text-sm tracking-tight">@{post.username}</span>
               <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">V Grand Infra</span>
             </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-[#C0392B] font-bold text-xs">V</div>
              <div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
                  <span className="font-bold mr-2 text-black">@{post.username}</span>
                  {post.caption}
                </p>
                <div className="mt-4 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                  {new Date(post.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Call to Action */}
          <div className="p-4 border-t bg-slate-50">
             <a 
               href={post.link} 
               target="_blank" 
               rel="noopener noreferrer"
               className="flex items-center justify-center gap-2 w-full py-3 bg-[#C0392B] text-white text-xs font-bold rounded-md hover:bg-[#A93226] transition-colors"
             >
               <InstagramIcon size={16} />
               OPEN ON INSTAGRAM
             </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MediaViewer({ post }: { post: InstagramPost }) {
  if (post.type === 'CAROUSEL_ALBUM' && post.children && post.children.length > 0) {
    return (
      <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
        {post.children.map((child) => (
          <div key={child.id} className="min-w-full h-full relative snap-center flex items-center justify-center">
            {child.media_type === 'VIDEO' ? (
              <video 
                src={child.media_url} 
                className="max-w-full max-h-full" 
                controls 
                autoPlay 
                muted 
                loop 
              />
            ) : (
              <img 
                src={child.media_url} 
                alt="Carousel post" 
                className="max-w-full max-h-full object-contain" 
              />
            )}
          </div>
        ))}
        {/* Navigation Indicator Overlay */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {post.children.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50" />
          ))}
        </div>
      </div>
    );
  }

  if (post.type === 'VIDEO' || post.type === 'REELS') {
    return (
      <video 
        src={post.media_url} 
        className="max-w-full max-h-full h-full" 
        controls 
        autoPlay 
        muted 
        loop
        playsInline
      />
    );
  }

  return (
    <img 
      src={post.media_url} 
      alt={post.caption} 
      className="max-w-full max-h-full object-contain"
    />
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


