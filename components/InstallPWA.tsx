
import React, { useEffect, useState } from 'react';

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // 2. Detect Device Type
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 3. Listen for the native install event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install UI
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If it's iOS, show the banner anyway (since iOS doesn't fire the event)
    if (isIosDevice) {
      setTimeout(() => setShowBanner(true), 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    // Scenario A: Android/Desktop (Native Prompt)
    if (deferredPrompt) {
      deferredPrompt.prompt(); // Show the native dialog
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowBanner(false);
      }
    } 
    // Scenario B: iOS (Manual Instructions)
    else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  if (isStandalone) return null;

  return (
    <>
      {/* 1. The Floating Install Banner */}
      {showBanner && !showIOSInstructions && (
        <div className="fixed bottom-0 left-0 right-0 z-[9000] p-4 animate-slideUp">
           <div className="bg-slate-900/95 backdrop-blur-md border-t border-white/10 text-white p-4 rounded-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex items-center justify-between gap-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl font-black shadow-lg">📲</div>
                 <div>
                    <p className="text-sm font-black text-white">تثبيت التطبيق</p>
                    <p className="text-[10px] text-slate-400 font-medium">تجربة أسرع وبدون إنترنت</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button 
                   onClick={() => setShowBanner(false)} 
                   className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-slate-400 font-bold hover:bg-white/20 transition-all"
                 >
                   ✕
                 </button>
                 <button 
                   onClick={handleInstallClick} 
                   className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white rounded-xl text-xs font-black shadow-lg transition-all transform active:scale-95 flex items-center gap-2"
                 >
                   <span>تثبيت الآن</span>
                   <span>⚡</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 2. iOS Instructions Modal (Only appears if clicked on iOS) */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setShowIOSInstructions(false)}></div>
          
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 animate-slideUp text-center">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🍏</div>
             <h3 className="text-xl font-black text-slate-800 mb-2">تثبيت على الآيفون</h3>
             <p className="text-slate-500 text-xs font-bold mb-6">آبل تتطلب خطوات يدوية بسيطة:</p>
             
             <div className="space-y-4 text-right">
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                   <span className="text-2xl">1️⃣</span>
                   <p className="text-xs font-bold text-slate-700">اضغط زر <span className="text-blue-600">المشاركة</span> بالأسفل <span className="text-lg inline-block align-middle">📤</span></p>
                </div>
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                   <span className="text-2xl">2️⃣</span>
                   <p className="text-xs font-bold text-slate-700">اختر <span className="text-slate-900 bg-white border px-1 py-0.5 rounded shadow-sm">إضافة للشاشة الرئيسية</span> <span className="text-lg inline-block align-middle">➕</span></p>
                </div>
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                   <span className="text-2xl">3️⃣</span>
                   <p className="text-xs font-bold text-slate-700">اضغط <span className="text-blue-600">Add (إضافة)</span> في الأعلى.</p>
                </div>
             </div>

             <button 
               onClick={() => setShowIOSInstructions(false)}
               className="w-full mt-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-lg"
             >
               فهمت ذلك 👍
             </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPWA;
