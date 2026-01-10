
import React, { useState, useEffect } from 'react';

interface ProtectedVideoProps {
  src: string;
  title: string;
  watermarkText: string;
  enabled: boolean;
}

const ProtectedVideo: React.FC<ProtectedVideoProps> = ({ src, title, watermarkText, enabled }) => {
  const [position, setPosition] = useState({ top: '10%', left: '10%' });
  const [dynamicId] = useState(() => Math.floor(100000 + Math.random() * 900000));

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
      {/* طبقة الحماية الشفافة لمنع النقر والسحب والتحميل */}
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
      >
        <source src={src} type="video/mp4" />
        متصفحك لا يدعم تشغيل هذا النوع من الفيديوهات المشفرة.
      </video>

      {enabled && (
        <>
          {/* العلامة المائية العائمة */}
          <div 
            className="absolute pointer-events-none text-white/10 text-[10px] md:text-sm font-black whitespace-nowrap z-50 transition-all duration-[3000ms] ease-in-out select-none bg-black/5 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-[1px] shadow-2xl"
            style={{ top: position.top, left: position.left }}
          >
            {watermarkText} | ID: {dynamicId}
          </div>

          {/* حماية من التقاط الشاشة عبر شبكة شبه مرئية */}
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
};

export default ProtectedVideo;
