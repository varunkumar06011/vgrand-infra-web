'use client';

import React from 'react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  variant?: 'floating' | 'inline' | 'banner' | 'pill';
  projectName?: string | null;
  title?: string;
  showText?: boolean;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '919010363636', // Default V Grand Number
  message = "hi i want flat in your project can u please call me",
  variant = "floating",
  projectName = null,
  title,
  showText = true,
}) => {
  const encodedMsg = encodeURIComponent(
    projectName
      ? `hi i want flat in *${projectName}* project can u please call me`
      : message
  );

  const waUrl = `https://wa.me/${phoneNumber}?text=${encodedMsg}`;

  // WhatsApp SVG Component
  const WhatsAppIcon = ({ size = 24 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );

  const handleCapture = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Capture the lead "silently" in the background
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Anonymous (WhatsApp)',
          phone: phoneNumber,
          project: projectName || 'General Interest',
          message: `Interest initiated from ${variant} button`,
          source: 'WhatsApp Web'
        }),
      });
    } catch (err) {
      console.error('Lead capture failed:', err);
    }

    // Redirect to WhatsApp
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const buttonClasses = {
    floating: "fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-green-300/50 group cursor-pointer border-none",
    inline: "inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-md cursor-pointer border-none",
    banner: "flex w-full items-center justify-between bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white px-6 py-4 rounded-2xl hover:opacity-95 transition-opacity shadow-lg cursor-pointer border-none",
    pill: "inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white px-6 py-2.5 rounded-full font-semibold transition-all duration-200 hover:scale-105 shadow-md cursor-pointer border-none"
  };

  if (variant === 'floating') {
    return (
      <button onClick={handleCapture} className={buttonClasses.floating} aria-label="Chat on WhatsApp">
        <WhatsAppIcon />
        <span className="text-sm font-semibold">Chat with us</span>
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping group-hover:opacity-0" />
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button onClick={handleCapture} className={buttonClasses.inline}>
        <WhatsAppIcon size={20} />
        {showText && "WhatsApp Us"}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button onClick={handleCapture} className={buttonClasses.pill}>
        <WhatsAppIcon size={18} />
        {showText && (title || "WhatsApp Us")}
      </button>
    );
  }

  // Banner variant — for project pages
  return (
    <button onClick={handleCapture} className={buttonClasses.banner}>
      <div className="text-left">
        <p className="font-bold text-lg">{title || "Enquire on WhatsApp"}</p>
        <p className="text-green-100 text-sm mt-0.5">Our team responds within 2 hours</p>
      </div>
      <WhatsAppIcon size={32} />
    </button>
  );
};

export default WhatsAppButton;
