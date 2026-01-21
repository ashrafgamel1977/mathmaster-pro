
import React, { useEffect, useRef, useState } from 'react';
import { Student } from '../types';

interface AttendanceScannerProps {
  students: Student[]; // Pass students list to lookup info locally for faster feedback
  onScan: (student: Student) => void;
  onClose: () => void;
}

declare const Html5QrcodeScanner: any;

const AttendanceScanner: React.FC<AttendanceScannerProps> = ({ students, onScan, onClose }) => {
  const scannerRef = useRef<any>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [feedbackStudent, setFeedbackStudent] = useState<Student | null>(null);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [scanStatus, setScanStatus] = useState<'success' | 'warning' | 'error' | 'ready'>('ready');
  const [statusMessage, setStatusMessage] = useState('وجه الكاميرا نحو الكود...');

  // Sound Effects
  const playSound = (type: 'success' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime); // Low pitch
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  const speakName = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-EG';
      utterance.rate = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const processCode = (decodedText: string) => {
    // Prevent double scanning the same code within 3 seconds
    if (lastScanned === decodedText) return;

    const student = students.find(s => 
      s.studentCode.toLowerCase() === decodedText.toLowerCase() || 
      decodedText.toLowerCase().includes(s.studentCode.toLowerCase())
    );

    if (student) {
      setLastScanned(decodedText);
      setFeedbackStudent(student);
      
      if (student.attendance) {
        setScanStatus('warning');
        setStatusMessage(`⚠️ ${student.name} تم تسجيله مسبقاً`);
        playSound('error');
      } else {
        setScanStatus('success');
        setStatusMessage(`✅ مرحباً ${student.name.split(' ')[0]}`);
        playSound('success');
        speakName(`مرحباً ${student.name.split(' ')[0]}`);
        onScan(student);
      }
    } else {
      setScanStatus('error');
      setStatusMessage('❌ كود غير مسجل');
      playSound('error');
    }

    // Reset feedback after delay
    setTimeout(() => {
        if (lastScanned === decodedText) setLastScanned(null);
        setScanStatus('ready');
        setStatusMessage('وجه الكاميرا نحو الكود...');
        setFeedbackStudent(null);
    }, 3000);
  };

  useEffect(() => {
    if (typeof Html5QrcodeScanner === 'undefined') {
      setStatusMessage("جاري تحميل المكتبة...");
      return; 
    }

    const startScanner = async () => {
        if (!document.getElementById("qr-reader")) return;
        
        // Cleanup old instance
        if (scannerRef.current) {
            try { await scannerRef.current.clear(); } catch(e) {}
            scannerRef.current = null;
        }

        await new Promise(r => setTimeout(r, 300));

        try {
            const scanner = new Html5QrcodeScanner(
              "qr-reader",
              { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
                rememberLastUsedCamera: true
              },
              false
            );

            scannerRef.current = scanner;
            scanner.render(processCode, (err: any) => {
               if (typeof err === 'string' && (err.includes("Permission") || err.includes("NotAllowedError"))) {
                   setPermissionError(true);
               }
            });

        } catch (e) {
            console.error("Scanner Error", e);
        }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [students]); // Re-init if students list changes drastically, though usually stable

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4 font-['Cairo']" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative animate-slideUp border-4 border-white/10 flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-100 flex justify-between items-center border-b border-slate-200">
           <div>
              <h3 className="text-lg font-black text-slate-800">ماسح الحضور الذكي 📸</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">نظام التعرف التلقائي</p>
           </div>
           <button onClick={onClose} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm">✕</button>
        </div>

        {/* Scanner Area */}
        <div className="relative flex-1 bg-black overflow-hidden">
           <div id="qr-reader" className="w-full h-full bg-black"></div>
           
           {permissionError && (
             <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center z-30">
                <span className="text-4xl mb-4">📷🚫</span>
                <h4 className="font-bold text-lg mb-2">الصلاحية مرفوضة</h4>
                <p className="text-xs text-slate-400 mb-6">يجب السماح للكاميرا للعمل.</p>
                <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 rounded-xl font-black text-xs">تحديث</button>
             </div>
           )}

           {/* Feedback Card Overlay */}
           {feedbackStudent && (
             <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
                <div className={`w-[80%] bg-white p-6 rounded-[2.5rem] text-center shadow-2xl transform transition-all scale-105 border-4 ${scanStatus === 'success' ? 'border-emerald-500' : 'border-amber-500'}`}>
                   <img src={feedbackStudent.avatar} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-slate-100 object-cover shadow-lg" alt="" />
                   <h3 className="text-xl font-black text-slate-800">{feedbackStudent.name}</h3>
                   <p className="text-xs font-bold text-slate-500 mt-1">{feedbackStudent.studentCode}</p>
                   
                   <div className="flex justify-center gap-2 mt-4">
                      {scanStatus === 'success' && (
                        <span className="px-4 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black">+10 نقاط</span>
                      )}
                      {!feedbackStudent.isPaid && (
                        <span className="px-4 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black animate-pulse">عليه مديونية</span>
                      )}
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Footer Status */}
        <div className={`p-6 text-center border-t border-slate-200 transition-colors duration-300 ${
            scanStatus === 'success' ? 'bg-emerald-50' : 
            scanStatus === 'warning' ? 'bg-amber-50' : 
            scanStatus === 'error' ? 'bg-rose-50' : 'bg-slate-50'
        }`}>
           <p className={`font-black text-sm transition-all ${
               scanStatus === 'success' ? 'text-emerald-600 scale-110' : 
               scanStatus === 'warning' ? 'text-amber-600' : 
               scanStatus === 'error' ? 'text-rose-600' : 'text-slate-400'
           }`}>
             {statusMessage}
           </p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceScanner;
