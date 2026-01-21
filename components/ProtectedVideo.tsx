
import React, { useState, useEffect, forwardRef } from 'react';
import YouTubePlayer, { YouTubePlayerRef } from './YouTubePlayer';
import BunnyPlayer from './BunnyPlayer';

interface ProtectedVideoProps {
  src: string;
  title: string;
  watermarkText: string;
  enabled: boolean;
  provider?: 'youtube' | 'bunny' | 'native'; // New prop
  onDuration?: (duration: number) => void;
  onProgress?: (percent: number) => void;
}

const ProtectedVideo = forwardRef<YouTubePlayerRef, ProtectedVideoProps>(({ src, title, watermarkText, enabled, provider, onDuration, onProgress }, ref) => {
  const [position, setPosition] = useState({ top: '10%', left: '10%' });
  const [dynamicId] = useState(() => Math.floor(100000 + Math.random() * 900000));

  // Determine provider if not explicitly set (Legacy support)
  const effectiveProvider = provider || (src.includes('youtu') ? 'youtube' : src.includes('bunny') || src.includes('mediadelivery') ? 'bunny' : 'native');

  // Parse watermark text to extract name and code if combined
  const parts = watermarkText.split('|');
  const sName = parts[0]?.trim();
  const sCode = parts[1]?.trim() || '';

  if (effectiveProvider === 'bunny') {
    return (
      <BunnyPlayer 
        url={src} 
        title={title} 
        studentName={sName} 
        studentCode={sCode} 
        watermarkEnabled={enabled} 
      />
    );
  }

  if (effectiveProvider === 'youtube') {
    return (
      <YouTubePlayer 
        ref={ref}
        url={src} 
        title={title} 
        studentName={sName} 
        studentCode={sCode} 
        onDuration={onDuration}
        onProgress={onProgress}
      />
    );
  }

  // Fallback: Native Video Player with Transparent Shield (Original Code)
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      const top = Math.floor(Math.random() * 80) + 5 + '%';
      const left = Math.floor(Math.random() * 60) + 5 + '%';
      setPosition({ top, left });
    }, 4000);
    return () => clearInterval(interval);
  }, [enabled]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-[3rem] overflow-hidden group shadow-2xl border-4 border-white/5 select-none">
      {/* Invisible Shield for Native Videos */}
      <div 
        className="absolute inset-0 z-40 bg-transparent" 
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={(e) => e.preventDefault()}
      ></div>

      <video 
        className="w-full h-full cursor-not-allowed" 
        controlsList="nodownload noplaybackrate noremoteplayback" 
        disablePictureInPicture
        disableRemotePlayback
        onContextMenu={(e) => e.preventDefault()}
        controls
        onTimeUpdate={(e) => {
          const vid = e.currentTarget;
          if (vid.duration > 0 && onProgress) {
            onProgress(Math.floor((vid.currentTime / vid.duration) * 100));
          }
        }}
      >
        <source src={src} type="video/mp4" />
        متصفحك لا يدعم تشغيل هذا النوع من الفيديوهات.
      </video>

      {enabled && (
        <>
          <div 
            className="absolute pointer-events-none text-white/10 text-[10px] md:text-sm font-black whitespace-nowrap z-50 transition-all duration-[3000ms] ease-in-out select-none bg-black/5 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-[1px] shadow-2xl"
            style={{ top: position.top, left: position.left }}
          >
            {watermarkText} | ID: {dynamicId}
          </div>
          <div className="absolute inset-0 pointer-events-none z-30 opacity-[0.01] flex flex-wrap gap-24 p-10 overflow-hidden select-none">
            {Array(30).fill(0).map((_, i) => (
              <span key={i} className="text-[9px] font-black rotate-[-25deg] whitespace-nowrap">
                {watermarkText} 🔒 NO DOWNLOAD
              </span>
            ))}
          </div>
        </>
      )}

      <div className="absolute top-6 right-6 z-50 pointer-events-none">
         <span className="px-4 py-1.5 bg-rose-600/20 backdrop-blur-md text-rose-400 text-[9px] font-black rounded-xl flex items-center gap-2 border border-rose-500/20 shadow-xl">
           <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
           نظام حماية الفيديو نشط
         </span>
      </div>
    </div>
  );
});

export default ProtectedVideo;
