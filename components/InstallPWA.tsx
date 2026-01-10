
import React, { useEffect, useState } from 'react';

const InstallPWA: React.FC = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
      // Show prompt after a slight delay to not annoy user immediately
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Check if already in standalone mode
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIosDevice && !isInStandaloneMode) {
      setIsIOS(true);
      setTimeout(() => setIsVisible(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false);
      }
      setPromptInstall(null);
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-slideUp">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">📲</div>
           <div>
              <h3 className="text-white font-black text-lg">تنزيل التطبيق</h3>
              <p className="text-slate-400 text-xs font-bold">للحصول على أفضل تجربة وتلقي الإشعارات، قم بتثبيت التطبيق.</p>
           </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
           {isIOS ? (
             <div className="text-white text-[10px] font-bold bg-white/10 p-3 rounded-xl flex-1 text-center">
                اضغط على زر <span className="text-xl inline-block align-middle mx-1">share</span> ثم اختر "Add to Home Screen"
             </div>
           ) : (
             <button 
               onClick={onClick}
               className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs shadow-lg hover:bg-blue-500 transition-all whitespace-nowrap"
             >
               تثبيت الآن ⬇
             </button>
           )}
           <button 
             onClick={() => setIsVisible(false)}
             className="px-4 py-3 bg-white/5 text-slate-400 hover:text-white rounded-xl font-black text-xs transition-all"
           >
             لا شكراً
           </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
