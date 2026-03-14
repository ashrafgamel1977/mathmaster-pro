
import React, { useState, useEffect, forwardRef } from 'react';
import YouTubePlayer, { YouTubePlayerRef } from './YouTubePlayer';
import BunnyPlayer from './BunnyPlayer';

import AiStudyAssistant from './AiStudyAssistant';

interface ProtectedVideoProps {
  lesson: { id: string, title: string }; // Changed from src/title to pass full lesson object
  watermarkText: string;
  onProgress?: (percent: number) => void;
  studentPoints?: number;
}

const ProtectedVideo = forwardRef<YouTubePlayerRef, ProtectedVideoProps>(({ lesson, watermarkText, onProgress, studentPoints = 0 }, ref) => {
  const [position, setPosition] = useState({ top: '10%', left: '10%' });
  const [dynamicId] = useState(() => Math.floor(100000 + Math.random() * 900000));
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  const src = (lesson as any).videoUrl || (lesson as any).data || '';
  const title = (lesson as any).title || '';
  const enabled = true;

  // Determine provider if not explicitly set (Legacy support)
  const effectiveProvider = src.includes('youtu') ? 'youtube' : src.includes('bunny') || src.includes('mediadelivery') ? 'bunny' : 'native';

  // Parse watermark text to extract name and code if combined
  const parts = watermarkText.split('|');
  const sName = parts[0]?.trim();
  const sCode = parts[1]?.trim() || '';

  const renderPlayer = () => {
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
            onProgress={onProgress}
          />
        );
      }
    
      return (
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
      );
  };

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
        className="absolute inset-x-0 top-0 h-[20%] z-40 bg-transparent" 
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={(e) => e.preventDefault()}
      ></div>

      {renderPlayer()}

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

      {/* AI Assistant Button */}
      <div className="absolute bottom-16 right-6 z-50">
          <button 
            onClick={() => setShowAiAssistant(true)}
            className="group flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white px-5 py-3 rounded-2xl shadow-xl shadow-indigo-900/40 border border-white/10 transition-all hover:scale-105 active:scale-95"
          >
             <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md group-hover:rotate-12 transition-transform">
                <span className="text-xl">🤖</span>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black leading-none opacity-70">المساعد الذكي</p>
                <p className="text-xs font-black">اسألني أي حاجة</p>
             </div>
          </button>
      </div>

      <div className="absolute top-6 right-6 z-50 pointer-events-none">
         <span className="px-4 py-1.5 bg-rose-600/20 backdrop-blur-md text-rose-400 text-[9px] font-black rounded-xl flex items-center gap-2 border border-rose-500/20 shadow-xl">
           <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
           نظام حماية الفيديو نشط
         </span>
      </div>

      {showAiAssistant && (
        <AiStudyAssistant 
          videoId={lesson.id}
          videoTitle={lesson.title}
          studentPoints={studentPoints}
          onClose={() => setShowAiAssistant(false)}
        />
      )}
    </div>
  );
});

export default ProtectedVideo;
