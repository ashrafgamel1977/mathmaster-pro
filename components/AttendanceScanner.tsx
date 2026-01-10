
import React, { useEffect, useRef, useState } from 'react';

interface AttendanceScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  lastScannedName?: string;
}

declare const Html5QrcodeScanner: any;

const AttendanceScanner: React.FC<AttendanceScannerProps> = ({ onScan, onClose, lastScannedName }) => {
  const scannerRef = useRef<any>(null);
  const onScanRef = useRef(onScan);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Keep the latest onScan function available without re-running the effect
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    // Check if script is loaded
    if (typeof Html5QrcodeScanner === 'undefined') {
      setFeedback("جاري تحميل مكتبة الماسح...");
      return; 
    }

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        rememberLastUsedCamera: true
      },
      /* verbose= */ false
    );

    let isScanning = true;

    const onScanSuccess = (decodedText: string) => {
      if (!isScanning) return;
      
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

      // Use ref to call the latest version of the function without restarting the effect
      onScanRef.current(decodedText);
      
      setFeedback("تم القراءة ✓");
      setTimeout(() => setFeedback(null), 2000);
    };

    scanner.render(onScanSuccess, (err: any) => {
       // ignore errors
    });
    
    scannerRef.current = scanner;

    return () => {
      isScanning = false;
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error: any) => {
          console.error("Failed to clear scanner", error);
        });
      }
    };
  }, []); // Empty dependency array ensures camera doesn't restart on parent state change

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
        <div className="p-0 relative bg-black min-h-[350px]">
           <div id="qr-reader" className="w-full h-full bg-black"></div>
           
           {/* Feedback Overlay */}
           {feedback && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-emerald-500/90 backdrop-blur-md text-white px-8 py-4 rounded-2xl text-center shadow-2xl animate-bounce">
                <p className="font-black text-sm">{feedback}</p>
             </div>
           )}

           {lastScannedName && (
             <div className="absolute bottom-6 left-6 right-6 z-20 bg-white/90 backdrop-blur-md text-slate-800 py-3 px-4 rounded-xl text-center shadow-lg border-2 border-emerald-500 animate-slideUp">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">آخر عملية ناجحة</p>
                <p className="font-black text-sm text-emerald-600">✅ {lastScannedName}</p>
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
