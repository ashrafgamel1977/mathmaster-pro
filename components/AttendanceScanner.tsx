
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Student } from '../types';

interface AttendanceScannerProps {
  students: Student[];
  onScan: (student: Student) => void;
  onClose: () => void;
}

// Global declaration for the CDN library
declare const Html5Qrcode: any;

const AttendanceScanner: React.FC<AttendanceScannerProps> = ({ students, onScan, onClose }) => {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>(() => localStorage.getItem('mm_preferred_camera') || '');
  
  const scannerInstanceRef = useRef<any>(null);
  const isScanningRef = useRef(false);
  const isProcessingRef = useRef(false); // قفل لمنع التكرار السريع
  
  // Use ref for students to access latest data inside callbacks without re-triggering scanner restart
  const studentsRef = useRef(students);

  const [scanStatus, setScanStatus] = useState<'success' | 'warning' | 'error' | 'ready'>('ready');
  const [statusMessage, setStatusMessage] = useState('جاري تهيئة الكاميرا...');
  const [feedbackStudent, setFeedbackStudent] = useState<Student | null>(null);

  // Update students ref whenever prop changes
  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  // --- Sound & Haptic Utils (Advanced) ---
  const playSound = (type: 'success' | 'error') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }

    if (navigator.vibrate) {
      navigator.vibrate(type === 'success' ? 50 : [50, 50, 50]);
    }
  };

  const speakName = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-EG';
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Scan Handler ---
  const handleScanSuccess = useCallback((decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true; // Lock immediately

    const currentStudents = studentsRef.current;
    const student = currentStudents.find(s => 
      s.studentCode.toLowerCase() === decodedText.toLowerCase() || 
      decodedText.toLowerCase().includes(s.studentCode.toLowerCase())
    );

    if (student) {
      setFeedbackStudent(student);
      
      if (student.attendance) {
        setScanStatus('warning');
        setStatusMessage(`⚠️ ${student.name} مسجل مسبقاً`);
        playSound('error');
      } else {
        setScanStatus('success');
        setStatusMessage(`✅ أهلاً ${student.name.split(' ')[0]}`);
        playSound('success');
        speakName(`أهلاً ${student.name.split(' ')[0]}`);
        onScan(student);
      }
    } else {
      setScanStatus('error');
      setStatusMessage('❌ كود غير معروف');
      playSound('error');
    }

    // Reset lock after delay
    setTimeout(() => {
        setScanStatus('ready');
        setStatusMessage('جاري المسح...');
        setFeedbackStudent(null);
        isProcessingRef.current = false; // Unlock
    }, 2500); 
  }, [onScan]);

  const stopScanner = async () => {
    const scanner = scannerInstanceRef.current;
    if (!scanner) return;

    try {
      if (isScanningRef.current) {
          await scanner.stop();
      }
    } catch (err: any) {
      // Ignore "not running" errors
      const msg = err?.toString() || '';
      if (!msg.includes("not running") && !msg.includes("is stopped")) {
          console.warn("Scanner stop warning:", err);
      }
    }
    
    try {
       await scanner.clear();
    } catch (e) { /* ignore clear errors */ }
    
    isScanningRef.current = false;
    scannerInstanceRef.current = null;
  };

  const startScanner = async (cameraId: string) => {
    await stopScanner();
    // Small delay to ensure DOM is clean
    await new Promise(r => setTimeout(r, 100));

    if (!document.getElementById("reader")) return;

    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerInstanceRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId, 
        {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
             const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
             return {
               width: Math.floor(minEdge * 0.7),
               height: Math.floor(minEdge * 0.7),
             };
          },
          aspectRatio: 1.0,
          disableFlip: false, 
        },
        handleScanSuccess,
        () => {} // Ignore scan failures per frame
      );
      
      isScanningRef.current = true;
      setStatusMessage("الكاميرا تعمل. وجّه الكود...");
      
    } catch (err) {
      console.error("Start failed", err);
      setStatusMessage("فشل تشغيل الكاميرا. تأكد من الأذونات.");
      isScanningRef.current = false;
    }
  };

  // --- Initialization ---
  useEffect(() => {
    let mounted = true;

    if (typeof Html5Qrcode === 'undefined') {
      setStatusMessage("خطأ: مكتبة الماسح غير محملة");
      return;
    }

    Html5Qrcode.getCameras().then((devices: any[]) => {
      if (mounted && devices && devices.length) {
        setCameras(devices);
        // Auto select back camera
        if (!selectedCameraId) {
           const backCam = devices.find((d: any) => d.label.toLowerCase().includes('back')) || devices[devices.length - 1];
           if (backCam) setSelectedCameraId(backCam.id);
        }
      } else if (mounted) {
        setStatusMessage("لم يتم العثور على كاميرات.");
      }
    }).catch(() => {
      if (mounted) setStatusMessage("يرجى السماح بصلاحية الكاميرا.");
    });

    return () => {
      mounted = false;
      stopScanner();
    };
  }, []);

  // --- Effect: Restart scanner when ID changes ---
  useEffect(() => {
    if (selectedCameraId) {
      startScanner(selectedCameraId);
      localStorage.setItem('mm_preferred_camera', selectedCameraId);
    }
  }, [selectedCameraId]); 

  // Helper for styles
  const getBorderColor = () => {
    switch (scanStatus) {
      case 'success': return 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]';
      case 'warning': return 'border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.5)]';
      case 'error': return 'border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.5)]';
      default: return 'border-slate-800';
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 font-['Cairo']" dir="rtl">
      <div className={`bg-black w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-slideUp flex flex-col h-[85vh] border-8 transition-all duration-300 ${getBorderColor()}`}>
        
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 bg-gradient-to-b from-black/90 to-transparent">
           <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-black text-sm drop-shadow-md flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                نظام المراقبة الذكي
              </h3>
              <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-rose-600 rounded-full text-white flex items-center justify-center transition-all">✕</button>
           </div>
           
           <select 
             className="w-full p-2 bg-black/50 backdrop-blur-md border border-white/20 rounded-xl font-bold text-[10px] text-white outline-none text-center"
             value={selectedCameraId}
             onChange={(e) => setSelectedCameraId(e.target.value)}
           >
             {cameras.length === 0 && <option>جاري البحث عن كاميرات...</option>}
             {cameras.map(cam => (
               <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id.slice(0,5)}`}</option>
             ))}
           </select>
        </div>

        {/* Scanner Viewport */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
           <div id="reader" className="w-full h-full object-cover"></div>
           
           {/* HUD Overlay */}
           <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              {/* Corner Brackets */}
              <div className="w-[70%] aspect-square relative opacity-80">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                  
                  {/* Scan Line */}
                  {scanStatus === 'ready' && (
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-400 shadow-[0_0_15px_#fbbf24] animate-[scan_2s_ease-in-out_infinite]"></div>
                  )}
              </div>
           </div>

           {/* Feedback Card */}
           {feedbackStudent && (
             <div className="absolute inset-x-0 bottom-0 z-20 p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center animate-fadeIn">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-[2rem] text-center w-full max-w-xs shadow-2xl">
                   <div className="relative inline-block mb-2">
                        <img src={feedbackStudent.avatar} className="w-16 h-16 rounded-full border-2 border-white object-cover" alt="" />
                        <span className={`absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white border border-black ${scanStatus === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                            {scanStatus === 'success' ? '✓' : '!'}
                        </span>
                   </div>
                   <h3 className="text-lg font-black text-white">{feedbackStudent.name}</h3>
                   <p className="text-xs font-mono text-slate-300 mb-1">{feedbackStudent.studentCode}</p>
                   {!feedbackStudent.isPaid && (
                       <span className="inline-block mt-1 text-[9px] font-black text-white bg-rose-600 px-2 py-0.5 rounded">عليه مديونية</span>
                   )}
                </div>
             </div>
           )}
        </div>

        {/* Footer Status */}
        <div className={`p-4 text-center transition-colors duration-300 relative z-30 ${
            scanStatus === 'success' ? 'bg-emerald-700 text-white' : 
            scanStatus === 'warning' ? 'bg-amber-600 text-white' : 
            scanStatus === 'error' ? 'bg-rose-700 text-white' : 'bg-slate-900 text-slate-400'
        }`}>
           <p className="font-black text-xs md:text-sm">
             {statusMessage}
           </p>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          50% { top: 90%; opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AttendanceScanner;
