
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface YouTubePlayerProps {
  url: string;
  title: string;
  studentName?: string;
  studentCode?: string;
  onProgress?: (percent: number) => void;
  onDuration?: (duration: number) => void;
}

export interface YouTubePlayerRef {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number) => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(({ url, title, studentName, studentCode, onProgress, onDuration }, ref) => {
  const [watermarkPos, setWatermarkPos] = useState({ top: '20%', left: '20%' });
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).substr(2, 9)}`);
  const progressInterval = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => {
      return playerRef.current && playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
    },
    getDuration: () => {
      return playerRef.current && playerRef.current.getDuration ? playerRef.current.getDuration() : 0;
    },
    seekTo: (seconds: number) => {
      if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(seconds, true);
      }
    }
  }));

  const getYTVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYTVideoId(url);

  useEffect(() => {
    // تحريك العلامة المائية بشكل عشوائي كل 3 ثواني
    const interval = setInterval(() => {
      setWatermarkPos({
        top: Math.floor(Math.random() * 80) + 10 + '%',
        left: Math.floor(Math.random() * 70) + 5 + '%'
      });
    }, 3000);

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!videoId) return;
      // تدمير المشغل القديم إذا وجد لتجنب التكرار
      if (playerRef.current) {
          try { playerRef.current.destroy(); } catch(e) {}
      }

      playerRef.current = new window.YT.Player(containerId.current, {
        videoId: videoId,
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 0,
          rel: 0,             // عدم عرض فيديوهات مقترحة من قنوات أخرى
          modestbranding: 1,  // تقليل شعار يوتيوب
          controls: 1,        // إظهار التحكم
          disablekb: 1,       // تعطيل اختصارات الكيبورد
          fs: 1,              // السماح بملء الشاشة
          playsinline: 1,     // التشغيل داخل الصفحة في الموبايل
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
             setIsReady(true);
             if (onDuration && event.target.getDuration) {
                onDuration(event.target.getDuration());
             }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              startTracking();
            } else {
              stopTracking();
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      clearInterval(interval);
      stopTracking();
    };
  }, [url, videoId]);

  const startTracking = () => {
    if (progressInterval.current) return;
    progressInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getDuration) {
        const duration = playerRef.current.getDuration();
        const currentTime = playerRef.current.getCurrentTime();
        if (duration > 0) {
          const percent = Math.floor((currentTime / duration) * 100);
          onProgress?.(percent);
          if (onDuration) onDuration(duration);
        }
      }
    }, 1000);
  };

  const stopTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  if (!videoId) return <div className="p-10 bg-gray-100 rounded-3xl text-center font-bold">رابط الفيديو غير صالح</div>;

  return (
    <div className="relative group rounded-[2rem] overflow-hidden bg-black shadow-2xl border-4 border-slate-900 aspect-video select-none">
      {/* 1. The Player Container */}
      <div id={containerId.current} className="absolute inset-0 w-full h-full z-0"></div>

      {/* 2. Security Overlay Layer (Transparent Shield) */}
      {/* 
         This layer sits ON TOP of the video but allows clicks to pass through only 
         to the controls area (bottom). The top area is blocked to prevent clicking the title 
         which usually opens YouTube.
      */}
      <div className="absolute inset-x-0 top-0 h-[15%] z-20 bg-transparent cursor-default" 
           onContextMenu={(e) => e.preventDefault()}
           title="Protected Content"
      ></div>

      {/* 3. Dynamic Watermark Layer (Pointer events none to allow clicking play) */}
      <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
        {(studentName || studentCode) && (
          <div 
            className="absolute px-4 py-2 bg-black/40 backdrop-blur-sm text-white/50 text-xs md:text-sm font-black rounded-xl transition-all duration-[3000ms] ease-in-out whitespace-nowrap border border-white/10 shadow-lg flex items-center gap-2"
            style={{ top: watermarkPos.top, left: watermarkPos.left }}
          >
            <span>🔒</span>
            <span>{studentName}</span>
            <span className="opacity-50">|</span>
            <span className="font-mono tracking-widest">{studentCode}</span>
          </div>
        )}
        
        {/* Background Subliminal Pattern */}
        <div className="absolute inset-0 flex flex-wrap gap-32 p-10 opacity-[0.03] rotate-[-15deg] justify-center items-center">
          {Array(15).fill(0).map((_, i) => (
            <span key={i} className="text-white text-[14px] font-black select-none">
              {studentCode || 'MATH_PRO'} ©
            </span>
          ))}
        </div>
      </div>

      {/* 4. Top Info Bar (Custom UI covering YouTube title) */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 to-transparent z-20 pointer-events-none flex justify-between items-start">
         <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.8)]"></span>
            <div>
               <h3 className="text-white font-black text-xs md:text-sm drop-shadow-md line-clamp-1">{title}</h3>
               <p className="text-[10px] text-gray-400 font-bold">محمي ضد النسخ</p>
            </div>
         </div>
         <div className="px-3 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-white/60 text-[8px] font-black uppercase tracking-wider">
            Smart Guard Active
         </div>
      </div>
    </div>
  );
});

export default YouTubePlayer;
