
import React, { useState, useEffect } from 'react';

interface BunnyPlayerProps {
  url: string;
  title: string;
  studentName?: string;
  studentCode?: string;
  watermarkEnabled: boolean;
}

const BunnyPlayer: React.FC<BunnyPlayerProps> = ({ url, title, studentName, studentCode, watermarkEnabled }) => {
  const [position, setPosition] = useState({ top: '10%', left: '10%' });
  const [dynamicId] = useState(() => Math.floor(100000 + Math.random() * 900000));

  // Logic to handle both direct ID and full Embed URL
  // Bunny Embed URL format: https://iframe.mediadelivery.net/embed/LIBRARY_ID/VIDEO_ID
  const getEmbedUrl = (inputUrl: string) => {
    if (inputUrl.includes('<iframe')) {
        // Extract src from iframe tag if user pasted full code
        const match = inputUrl.match(/src="([^"]+)"/);
        return match ? match[1] : inputUrl;
    }
    return inputUrl;
  };

  const embedSrc = getEmbedUrl(url);

  useEffect(() => {
    if (!watermarkEnabled) return;
    
    // Move watermark randomly every 4 seconds
    const interval = setInterval(() => {
      const top = Math.floor(Math.random() * 80) + 5 + '%';
      const left = Math.floor(Math.random() * 60) + 5 + '%';
      setPosition({ top, left });
    }, 4000);

    return () => clearInterval(interval);
  }, [watermarkEnabled]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-[3rem] overflow-hidden group shadow-2xl border-4 border-white/5 select-none">
      
      {/* 1. Bunny.net Iframe (Server-Side Protection) */}
      <iframe 
        src={embedSrc}
        className="w-full h-full border-0 absolute inset-0"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" 
        allowFullScreen={true}
        title={title}
      />

      {/* 2. Frontend Protection Layer (Dynamic Watermark) */}
      {/* pointer-events-none ensures clicks go through to the video player controls */}
      <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
        
        {/* Dynamic Floating Watermark */}
        {watermarkEnabled && (studentName || studentCode) && (
          <div 
            className="absolute px-4 py-2 bg-black/40 backdrop-blur-sm text-white/50 text-[10px] md:text-sm font-black rounded-xl transition-all duration-[3000ms] ease-in-out whitespace-nowrap border border-white/10 shadow-lg"
            style={{ top: position.top, left: position.left }}
          >
            {studentName} | {studentCode} | ID: {dynamicId}
          </div>
        )}

        {/* Subliminal Grid Protection (Very faint background text) */}
        <div className="absolute inset-0 flex flex-wrap gap-24 p-10 opacity-[0.03] rotate-[-15deg]">
            {Array(20).fill(0).map((_, i) => (
              <span key={i} className="text-white text-[12px] font-black select-none">
                {studentCode || 'MATH_MASTER'} 🔒
              </span>
            ))}
        </div>

        {/* Status Indicator */}
        <div className="absolute top-4 right-4">
           <span className="px-3 py-1 bg-indigo-600/30 backdrop-blur-md border border-indigo-500/30 text-indigo-200 text-[8px] font-black rounded-lg flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></span>
             SECURE STREAM
           </span>
        </div>
      </div>
    </div>
  );
};

export default BunnyPlayer;
