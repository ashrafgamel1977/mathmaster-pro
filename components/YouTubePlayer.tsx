
import React, { useState, useEffect, useRef } from 'react';

interface YouTubePlayerProps {
  url: string;
  title: string;
  studentName?: string;
  studentCode?: string;
  onProgress?: (percent: number) => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ url, title, studentName, studentCode, onProgress }) => {
  const [watermarkPos, setWatermarkPos] = useState({ top: '20%', left: '20%' });
  const playerRef = useRef<any>(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).substr(2, 9)}`);
  const progressInterval = useRef<any>(null);

  const getYTVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYTVideoId(url);

  useEffect(() => {
    // تحريك العلامة المائية
    const interval = setInterval(() => {
      setWatermarkPos({
        top: Math.floor(Math.random() * 70) + 10 + '%',
        left: Math.floor(Math.random() * 60) + 10 + '%'
      });
    }, 5000);

    // تحميل YouTube IFrame API إذا لم يكن موجوداً
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!videoId) return;
      playerRef.current = new window.YT.Player(containerId.current, {
        videoId: videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          controls: 1,
          origin: window.location.origin,
        },
        events: {
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
  }, [url]);

  const startTracking = () => {
    if (progressInterval.current) return;
    progressInterval.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getDuration) {
        const duration = playerRef.current.getDuration();
        const currentTime = playerRef.current.getCurrentTime();
        if (duration > 0) {
          const percent = Math.floor((currentTime / duration) * 100);
          onProgress?.(percent);
        }
      }
    }, 5000); // تحديث كل 5 ثوانٍ
  };

  const stopTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  if (!videoId) return <div className="p-10 bg-gray-100 rounded-3xl text-center font-bold">رابط الفيديو غير صالح</div>;

  return (
    <div className="relative group rounded-[2.5rem] overflow-hidden bg-black shadow-2xl border-4 border-white aspect-video select-none">
      <div id={containerId.current} className="absolute inset-0 w-full h-full"></div>

      {/* طبقة الحماية */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {(studentName || studentCode) && (
          <div 
            className="absolute px-4 py-1.5 bg-black/30 backdrop-blur-[1px] text-white/40 text-[11px] font-black rounded-xl transition-all duration-[3000ms] ease-in-out whitespace-nowrap border border-white/5 shadow-lg"
            style={{ top: watermarkPos.top, left: watermarkPos.left }}
          >
            {studentName} | {studentCode}
          </div>
        )}
        <div className="absolute inset-0 flex flex-wrap gap-x-24 gap-y-20 p-10 opacity-[0.02] rotate-[-20deg]">
          {Array(20).fill(0).map((_, i) => (
            <span key={i} className="text-white text-[9px] font-bold select-none">{studentCode || 'MATH_MASTER'}</span>
          ))}
        </div>
      </div>

      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 pointer-events-none">
         <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></span>
               <span className="text-white font-black text-xs drop-shadow-md">{title}</span>
            </div>
            <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white/60 text-[9px] font-black uppercase">
               نظام التتبع مفعل 📊
            </div>
         </div>
      </div>
    </div>
  );
};

export default YouTubePlayer;
