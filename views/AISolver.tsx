
import React, { useState, useRef, useEffect } from 'react';
import { solveMathProblem } from '../services/geminiService';
import MathRenderer from '../components/MathRenderer';
import { MathNotation } from '../types';

interface AISolverProps {
  notation?: MathNotation;
}

const AISolver: React.FC<AISolverProps> = ({ notation = 'arabic' }) => {
  const [input, setInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // New: Grade Selection
  const [selectedYear, setSelectedYear] = useState('الثالث الثانوي'); // Default
  const YEARS = [
    'الأول الإعدادي', 'الثاني الإعدادي', 'الثالث الإعدادي',
    'الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // تهيئة ميزة التعرف على الكلام إذا كانت مدعومة في المتصفح
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'ar-EG';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        alert('تعذر التعرف على الصوت، يرجى المحاولة مرة أخرى.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert('متصفحك لا يدعم الإدخال الصوتي.');
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSolve = async () => {
    if (!input.trim() && !imagePreview) return;
    setIsLoading(true);
    setSolution(null);
    try {
      const imageData = imagePreview ? { data: imagePreview, mimeType: 'image/jpeg' } : undefined;
      // Pass the selectedYear to enforce curriculum
      const res = await solveMathProblem(input, imageData, notation as MathNotation, selectedYear);
      setSolution(res);
    } catch (e) {
      alert('فشل في تحليل المسألة. يرجى التأكد من وضوح الصورة والاتصال بالإنترنت.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const isLatex = input.includes('$') || input.includes('\\');

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-slideUp pb-24 text-right px-4 md:px-0" dir="rtl">
      {/* Royal Lab Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-10 md:p-16 rounded-[4rem] shadow-2xl relative overflow-hidden text-white border border-white/10">
        <div className="absolute top-0 right-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_70%_30%,_rgba(59,130,246,0.3),transparent_60%)]"></div>
        <div className="relative z-10 space-y-6">
           <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_10px_#60a5fa]"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">Egyptian Math Engine v3.0</span>
           </div>
           <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-none">مُحلل المسائل <br/> <span className="text-blue-400">حسب المنهج المصري</span> 🇪🇬</h2>
           <p className="text-slate-400 font-bold text-sm md:text-xl max-w-xl leading-relaxed">
             يقوم الذكاء الاصطناعي بحل المسائل بالخطوات والقوانين المعتمدة من وزارة التربية والتعليم، مع مراعاة المرحلة الدراسية بدقة.
           </p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-3xl p-6 md:p-12 rounded-[4rem] shadow-2xl border border-white/10 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -ml-16 -mt-16 blur-3xl"></div>
        
        <div className="space-y-6 relative z-10">
           {/* Year Selection */}
           <div className="flex justify-end">
              <div className="bg-white/10 p-1.5 rounded-2xl flex items-center gap-2 border border-white/10">
                 <span className="text-white text-[10px] font-bold px-2">اختر المرحلة:</span>
                 <select 
                   value={selectedYear} 
                   onChange={(e) => setSelectedYear(e.target.value)}
                   className="bg-indigo-950 text-white px-4 py-2 rounded-xl text-xs font-black outline-none border-none cursor-pointer hover:bg-indigo-900 transition-colors"
                 >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
              </div>
           </div>

           <div className="relative group">
              <textarea 
                placeholder={`اكتب المسألة هنا... (سيتم الحل وفق منهج ${selectedYear})`}
                className="w-full p-8 md:p-12 bg-white/5 border-2 border-white/10 focus:border-blue-500 rounded-[3rem] font-bold text-lg md:text-2xl outline-none min-h-[200px] md:min-h-[280px] transition-all shadow-inner text-white placeholder:text-slate-600"
                value={input}
                onChange={e => setInput(e.target.value)}
                dir="ltr"
                style={{ textAlign: 'right' }}
              />
              
              {/* LaTeX Preview Overlay */}
              {isLatex && (
                <div className="absolute top-6 left-6 p-4 bg-slate-950/80 backdrop-blur-md rounded-3xl border border-white/10 max-w-[200px] md:max-w-[300px] shadow-2xl z-20 animate-fadeIn hidden sm:block">
                   <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1">
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">معاينة LaTeX</span>
                      <span className="text-[10px]">👁️</span>
                   </div>
                   <div className="max-h-32 overflow-y-auto no-scrollbar text-white text-sm font-medium">
                      <MathRenderer content={input} inline />
                   </div>
                </div>
              )}

              <div className="absolute bottom-8 left-8 flex gap-3">
                 <button 
                   onClick={toggleListening}
                   className={`w-14 h-14 md:w-20 md:h-20 shadow-2xl rounded-3xl flex items-center justify-center text-2xl md:text-3xl hover:scale-110 active:scale-95 transition-all ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-blue-600 text-white'}`}
                   title="تحدث بمسألتك"
                 >🎤</button>
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-14 h-14 md:w-20 md:h-20 bg-white text-slate-900 shadow-2xl rounded-3xl flex items-center justify-center text-2xl md:text-3xl hover:scale-110 active:scale-95 transition-all"
                   title="إرفاق صورة المسألة"
                 >📸</button>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>
           </div>

           <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={handleSolve}
                disabled={isLoading || (!input.trim() && !imagePreview)}
                className="flex-1 py-6 md:py-8 bg-blue-600 text-white font-black rounded-[2.5rem] shadow-[0_20px_50px_rgba(37,99,235,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 text-xl"
              >
                {isLoading ? (
                  <>
                    <span className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>جاري التفكير بالمنهج المصري...</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">✨</span>
                    <span>حل المسألة (Egyptian AI)</span>
                  </>
                )}
              </button>
              
              {imagePreview && (
                <button onClick={() => setImagePreview(null)} className="py-6 px-10 bg-rose-500/10 text-rose-400 font-black rounded-[2.5rem] border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all text-sm">حذف الصورة ✕</button>
              )}
           </div>
        </div>

        {imagePreview && (
          <div className="relative w-full max-w-xl mx-auto aspect-video rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl animate-fadeIn bg-slate-900">
             <img src={imagePreview} className="w-full h-full object-contain" alt="Problem preview" />
             <div className="absolute inset-0 bg-blue-500/10 pointer-events-none flex items-center justify-center">
                <div className="w-full h-1 bg-blue-400/40 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_20px_#60a5fa]"></div>
             </div>
          </div>
        )}
      </div>

      {solution && (
        <div className="bg-white p-10 md:p-16 rounded-[4rem] border-4 border-blue-100 shadow-2xl animate-fadeIn space-y-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-4 h-full bg-blue-600"></div>
           <div className="flex justify-between items-center border-b border-slate-100 pb-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white text-3xl shadow-xl shadow-blue-200">💡</div>
                 <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">خطوات الحل (منهج {selectedYear})</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Generated by MathMaster AI Engine</p>
                 </div>
              </div>
              <button onClick={() => window.print()} className="w-14 h-14 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 transition-all">🖨️</button>
           </div>
           
           <div className="prose prose-slate max-w-none text-right">
              <MathRenderer content={solution} className="text-lg md:text-xl font-medium leading-relaxed text-slate-700" />
           </div>

           <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                 <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                 <p className="text-[11px] font-bold text-slate-400 italic">هذا الحل تم توليده آلياً بناءً على قواعد المناهج المصرية.</p>
              </div>
              <button onClick={() => { setSolution(null); setInput(''); setImagePreview(null); }} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all">حل مسألة أخرى</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AISolver;
