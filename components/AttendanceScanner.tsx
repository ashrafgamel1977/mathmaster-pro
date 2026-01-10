
import React, { useEffect, useRef, useState } from 'react';

interface AttendanceScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  scanResult?: { type: 'success' | 'error'; message: string } | null;
}

declare const Html5QrcodeScanner: any;

const AttendanceScanner: React.FC<AttendanceScannerProps> = ({ onScan, onClose, scanResult }) => {
  const scannerRef = useRef<any>(null);
  const onScanRef = useRef(onScan);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<boolean>(false);

  // Keep the latest onScan function available without re-running the effect
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    // Check if script is loaded
    if (typeof Html5QrcodeScanner === 'undefined') {
      setLocalFeedback("جاري تحميل مكتبة الماسح...");
      return; 
    }

    let isMounted = true;

    const startScanner = async () => {
        // Ensure DOM element exists
        if (!document.getElementById("qr-reader")) return;

        // Cleanup any existing instance first
        if (scannerRef.current) {
            try {
                await scannerRef.current.clear();
            } catch (e) {
                console.warn("Cleanup error", e);
            }
            scannerRef.current = null;
        }

        // Small delay to ensure camera stream is released by browser
        await new Promise(r => setTimeout(r, 300));
        
        if (!isMounted) return;

        try {
            const scanner = new Html5QrcodeScanner(
              "qr-reader",
              { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                rememberLastUsedCamera: true,
                videoConstraints: {
                    facingMode: { ideal: "environment" } // Prefer back camera
                }
              },
              /* verbose= */ false
            );

            scannerRef.current = scanner;

            const onScanSuccess = (decodedText: string) => {
              // Play beep sound
              try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
              } catch (e) {}

              // Use ref to call the latest version
              if (onScanRef.current) {
                  onScanRef.current(decodedText);
              }
            };

            scanner.render(onScanSuccess, (errorMessage: any) => {
               // Determine if it's a permission error based on string content if possible
               if (errorMessage && typeof errorMessage === 'string' && 
                  (errorMessage.includes("Permission") || errorMessage.includes("NotAllowedError"))) {
                   setPermissionError(true);
               }
            });

        } catch (e) {
            console.error("Scanner Init Error", e);
            setLocalFeedback("حدث خطأ أثناء تشغيل الكاميرا");
        }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error: any) => {
          console.error("Failed to clear scanner", error);
        });
        scannerRef.current = null;
      }
    };
  }, []); 

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 font-['Cairo']" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-slideUp border-4 border-white/10">
        
        {/* Header */}
        <div className="p-6 bg-slate-100 flex justify-between items-center border-b border-slate-200">
           <div>
              <h3 className="text-lg font-black text-slate-800">ماسح الحضور الذكي 📸</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">وجه الكاميرا نحو كود الطالب</p>
           </div>
           <button onClick={onClose} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm">✕</button>
        </div>

        {/* Scanner Area */}
        <div className="p-0 relative bg-black min-h-[350px] flex items-center justify-center">
           <div id="qr-reader" className="w-full h-full bg-black"></div>
           
           {/* Permission Error State */}
           {permissionError && (
             <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center z-30">
                <span className="text-4xl mb-4">📷🚫</span>
                <h4 className="font-bold text-lg mb-2">تعذر الوصول للكاميرا</h4>
                <p className="text-xs text-slate-400 mb-6">يرجى التأكد من السماح للمتصفح باستخدام الكاميرا من إعدادات الموقع.</p>
                <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 rounded-xl font-black text-xs">تحديث الصفحة</button>
             </div>
           )}

           {/* Feedback Overlay (Loading) */}
           {localFeedback && !permissionError && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-emerald-500/90 backdrop-blur-md text-white px-8 py-4 rounded-2xl text-center shadow-2xl animate-bounce">
                <p className="font-black text-sm">{localFeedback}</p>
             </div>
           )}

           {/* Scan Result Feedback */}
           {scanResult && (
             <div className={`absolute bottom-6 left-6 right-6 z-20 backdrop-blur-md text-slate-800 py-4 px-4 rounded-2xl text-center shadow-2xl border-2 animate-slideUp ${
               scanResult.type === 'success' 
                 ? 'bg-white/95 border-emerald-500' 
                 : 'bg-rose-50/95 border-rose-500 text-rose-800'
             }`}>
                <div className="flex flex-col items-center gap-1">
                   <span className="text-2xl">{scanResult.type === 'success' ? '✅' : '⚠️'}</span>
                   <p className={`font-black text-sm ${scanResult.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {scanResult.message}
                   </p>
                </div>
             </div>
           )}
        </div>

        <div className="p-6 bg-slate-50 text-center border-t border-slate-200">
           <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
             النظام يعمل في وضع <b>"المسح المستمر"</b>. يمكنك مسح بطاقات الطلاب بشكل متتابع دون الحاجة للإغلاق.
           </p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceScanner;
