
import React, { useEffect, useState } from 'react';

const InstallPWA: React.FC = () => {
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);

  useEffect(() => {
    // التحقق من وجود نسخة جديدة (Update Checking)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setNewVersionAvailable(true);
      });
    }

    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const manualTrigger = () => {
      if (isStandaloneMode) {
        alert("المنصة مثبتة ومحدثة على جهازك ✅");
        return;
      }
      setIsVisible(true);
    };
    window.addEventListener('open-install-prompt', manualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('open-install-prompt', manualTrigger);
    };
  }, []);

  const handleInstallClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (promptInstall) {
      promptInstall.prompt();
      promptInstall.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          setIsVisible(false);
        }
      });
    } else {
      setShowInstructions(true);
    }
  };

  const refreshApp = () => {
    window.location.reload();
  };

  // عرض إشعار التحديث إذا توفرت نسخة جديدة
  if (newVersionAvailable) {
    return (
      <div className="fixed bottom-24 left-6 right-6 z-[10001] animate-slideUp">
        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/20">
          <div className="flex items-center gap-3">
            <span className="text-xl">✨</span>
            <p className="text-xs font-black">نسخة جديدة متوفرة مع ميزات إضافية!</p>
          </div>
          <button 
            onClick={refreshApp}
            className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black shadow-sm"
          >
            تحديث الآن ↻
          </button>
        </div>
      </div>
    );
  }

  if (!isVisible || isStandalone) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end md:items-start justify-center md:pt-4 p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={() => setIsVisible(false)}></div>

      <div className="bg-white text-slate-900 rounded-[2rem] p-6 shadow-2xl w-full max-w-md relative z-10 animate-slideUp border border-white/20">
        
        <div className="flex justify-between items-start mb-4">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg font-black">∑</div>
              <div>
                 <h3 className="font-black text-lg">تثبيت المنصة</h3>
                 <p className="text-slate-500 text-xs font-bold">تطبيق سريع، يعمل في وضع الأوفلاين.</p>
              </div>
           </div>
           <button onClick={() => setIsVisible(false)} className="w-8 h-8 bg-slate-100 rounded-full text-slate-500 font-bold">✕</button>
        </div>

        {!showInstructions ? (
          <div className="space-y-4">
             <p className="text-sm font-medium text-slate-600 leading-relaxed">
               قم بتثبيت المنصة على شاشتك الرئيسية للوصول السريع لدروسك وواجباتك في أي وقت.
             </p>
             <button 
               onClick={handleInstallClick}
               className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
             >
               {promptInstall ? 'تثبيت الآن 📲' : 'كيفية التثبيت ℹ️'}
             </button>
          </div>
        ) : (
          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-right">
             <h4 className="font-black text-sm text-slate-800 border-b border-slate-200 pb-2 mb-2">
               {isIOS ? 'طريقة التثبيت على الآيفون (iOS)' : 'طريقة التثبيت اليدوي'}
             </h4>
             
             {isIOS ? (
               <ol className="text-xs text-slate-600 space-y-3 list-decimal pr-4 font-bold">
                  <li>اضغط على زر <span className="text-blue-600">المشاركة (Share)</span> بالأسفل <span className="inline-block align-middle text-lg">📤</span></li>
                  <li>اسحب القائمة للأعلى قليلاً.</li>
                  <li>اختر <span className="text-slate-900">"Add to Home Screen"</span> <span className="inline-block align-middle text-lg">➕</span></li>
                  <li>اضغط على <span className="text-blue-600">إضافة (Add)</span> في الزاوية العلوية.</li>
               </ol>
             ) : (
               <ol className="text-xs text-slate-600 space-y-3 list-decimal pr-4 font-bold">
                  <li>اضغط على أيقونة القائمة (الثلاث نقاط ⋮) في المتصفح.</li>
                  <li>ابحث عن خيار <span className="text-slate-900">"Install App"</span>.</li>
                  <li>أكد التثبيت لظهور المنصة كتطبيق مستقل.</li>
               </ol>
             )}
             
             <button 
               onClick={() => setShowInstructions(false)}
               className="w-full mt-4 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs"
             >
               فهمت ذلك 👍
             </button>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default InstallPWA;
