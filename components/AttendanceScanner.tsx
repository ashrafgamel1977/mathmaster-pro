
import React, { useEffect, useRef } from 'react';

interface AttendanceScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

declare const Html5QrcodeScanner: any;

const AttendanceScanner: React.FC<AttendanceScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    // تهيئة الماسح الضوئي
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 20, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      /* verbose= */ false
    );

    const onScanSuccess = (decodedText: string) => {
      // إصدار صوت تنبيه خفيف عند النجاح
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

      onScan(decodedText);
      // لا نغلق الماسح مباشرة لنسمح بمسح طالب آخر بسرعة
    };

    scanner.render(onScanSuccess, (err: any) => {
       // خطأ في القراءة (نتجاهله لضمان استمرار المحاولة)
    });
    
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error: any) => {
          console.error("Failed to clear scanner", error);
        });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl relative animate-slideUp">
        <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
           <div>
              <h3 className="text-xl font-black">ماسح الحضور الذكي 📸</h3>
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-1">وجه الكاميرا نحو باركود الكارنيه</p>
           </div>
           <button onClick={onClose} className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl hover:bg-white/30 transition-all">✕</button>
        </div>

        <div className="p-6">
           <div id="qr-reader" className="w-full bg-slate-100 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-inner"></div>
        </div>

        <div className="p-8 bg-slate-50 text-center">
           <p className="text-xs text-slate-400 font-bold leading-relaxed">سيتم تسجيل الحضور تلقائياً بمجرد التعرف على الكود. يمكنك مسح عدة طلاب متتاليين دون إغلاق النافذة.</p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceScanner;
