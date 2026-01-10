
import React, { useState, useRef, useEffect } from 'react';
import { Year, Group, Student } from '../types';

interface RegistrationProps {
  years: Year[];
  groups: Group[];
  onRegister: (student: Omit<Student, 'id' | 'points' | 'score' | 'scoreHistory' | 'badges' | 'streaks' | 'deviceIds'>) => void;
  onBack: () => void;
  teacherName: string;
}

const Registration: React.FC<RegistrationProps> = ({ years, groups, onRegister, onBack, teacherName }) => {
  const [step, setStep] = useState(1);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    studentPhone: '',
    parentPhone: '',
    yearId: '',
    groupId: '',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky',
    registrationDate: new Date().toISOString().split('T')[0]
  });

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('تعذر الوصول للكاميرا، يرجى التأكد من إعطاء الصلاحيات.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setFormData({ ...formData, avatar: dataUrl });
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData({ ...formData, avatar: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.studentPhone || !formData.parentPhone) return alert('يرجى إكمال كافة البيانات الأساسية ⚠️');
    onRegister({
      name: formData.name,
      studentPhone: formData.studentPhone,
      parentPhone: formData.parentPhone,
      yearId: formData.yearId,
      groupId: formData.groupId,
      avatar: formData.avatar,
      studentCode: 'PENDING',
      attendance: false,
      status: 'pending',
      registrationDate: new Date(formData.registrationDate).toLocaleDateString('ar-EG')
    });
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return "اختر مرحلتك الدراسية";
      case 2: return "اختر المجموعة المناسبة";
      case 3: return "بياناتك الشخصية";
      default: return "";
    }
  };

  const getStepDesc = () => {
    switch(step) {
      case 1: return "حدد الصف الدراسي للبدء في عرض المجموعات المتاحة لك.";
      case 2: return "اختر الموعد الأنسب لجدولك سواء حضور في السنتر أو أونلاين.";
      case 3: return "قم برفع صورة شخصية واضحة (سيلفي) لإصدار كارنيه الطالب.";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] font-['Cairo'] flex overflow-hidden relative text-right" dir="rtl">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[150px] rounded-full"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
      </div>

      <div className="container mx-auto max-w-7xl flex flex-col lg:flex-row h-full relative z-10">
        
        {/* Left Panel (Info & Steps) */}
        <div className="lg:w-1/3 p-8 lg:p-12 flex flex-col justify-between relative">
           <div>
              <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-xs font-bold">
                 <span>←</span> <span>العودة للرئيسية</span>
              </button>
              
              <div className="mb-10">
                 <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
                    انضم لنخبة <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">الرياضيات</span>
                 </h1>
                 <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                    سجل بياناتك الآن للحصول على عضوية أكاديمية الأستاذ {teacherName} والتمتع بكافة المميزات.
                 </p>
              </div>

              {/* Desktop Stepper */}
              <div className="hidden lg:flex flex-col gap-8">
                 {[1, 2, 3].map((s) => (
                   <div key={s} className={`flex items-center gap-4 transition-all duration-500 ${step === s ? 'opacity-100 translate-x-0' : step > s ? 'opacity-50' : 'opacity-30'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black border-2 transition-all ${step === s ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-[0_0_20px_rgba(37,99,235,0.5)]' : step > s ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20 text-white'}`}>
                         {step > s ? '✓' : s}
                      </div>
                      <div>
                         <p className="text-white font-bold text-sm">{s === 1 ? 'المرحلة' : s === 2 ? 'المجموعة' : 'الهوية'}</p>
                         {step === s && <p className="text-blue-400 text-[10px] animate-fadeIn">الخطوة الحالية</p>}
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="hidden lg:block text-slate-500 text-[10px] font-black uppercase tracking-widest">
              MathMaster Pro &copy; {new Date().getFullYear()}
           </div>
        </div>

        {/* Right Panel (Form) */}
        <div className="lg:w-2/3 bg-white/5 backdrop-blur-2xl border-r border-white/10 h-full overflow-y-auto no-scrollbar relative flex flex-col">
           <div className="p-8 lg:p-12 flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full">
              
              <div className="mb-8">
                 <h2 className="text-3xl font-black text-white mb-2">{getStepTitle()}</h2>
                 <p className="text-slate-400 text-sm font-medium">{getStepDesc()}</p>
              </div>

              {/* Step 1: Years */}
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slideUp">
                   {years.map(y => (
                     <button 
                       key={y.id}
                       onClick={() => { setFormData({...formData, yearId: y.id}); setStep(2); }}
                       className="group relative p-6 bg-slate-800/50 hover:bg-blue-600 transition-all rounded-[2rem] border border-white/5 text-right overflow-hidden"
                     >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full transition-all group-hover:bg-white/20"></div>
                        <span className="text-4xl block mb-4 group-hover:scale-110 transition-transform origin-bottom-right">🎓</span>
                        <h3 className="text-xl font-black text-white">{y.name}</h3>
                        <p className="text-slate-400 text-xs mt-2 group-hover:text-blue-100">اضغط للاختيار ⭠</p>
                     </button>
                   ))}
                </div>
              )}

              {/* Step 2: Groups */}
              {step === 2 && (
                <div className="space-y-4 animate-slideUp">
                   <div className="grid grid-cols-1 gap-4">
                      {groups.filter(g => g.yearId === formData.yearId).map(g => (
                        <button 
                          key={g.id}
                          onClick={() => { setFormData({...formData, groupId: g.id}); setStep(3); }}
                          className="flex items-center justify-between p-6 bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-blue-500/50 rounded-[2rem] transition-all group text-right"
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${g.type === 'center' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                 {g.type === 'center' ? '🏫' : '🌐'}
                              </div>
                              <div>
                                 <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">{g.name}</h3>
                                 <p className="text-slate-400 text-xs mt-1">{g.time}</p>
                              </div>
                           </div>
                           <div className="text-slate-500 text-xl group-hover:translate-x-[-5px] transition-transform">⭠</div>
                        </button>
                      ))}
                   </div>
                   {groups.filter(g => g.yearId === formData.yearId).length === 0 && (
                      <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-[2rem]">
                         <span className="text-4xl block mb-2">⚠️</span>
                         <p className="text-slate-400 font-bold">لا توجد مجموعات متاحة لهذا الصف حالياً</p>
                      </div>
                   )}
                   <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white text-xs font-bold py-4">← تغيير الصف الدراسي</button>
                </div>
              )}

              {/* Step 3: Profile */}
              {step === 3 && (
                <div className="space-y-8 animate-slideUp">
                   {/* Avatar Scanner */}
                   <div className="flex justify-center mb-8">
                      <div className="relative group">
                         <div className={`w-40 h-40 rounded-[3rem] overflow-hidden border-4 ${isCameraActive ? 'border-blue-500 shadow-[0_0_30px_#3b82f6]' : 'border-white/20'} bg-slate-900 relative transition-all`}>
                            {isCameraActive ? (
                               <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                            ) : (
                               <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                            )}
                            {/* Scanning Line Animation */}
                            {isCameraActive && (
                               <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_10px_#60a5fa] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                            )}
                         </div>
                         
                         <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            <button 
                              onClick={isCameraActive ? capturePhoto : startCamera}
                              className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                              title={isCameraActive ? "التقاط" : "فتح الكاميرا"}
                            >
                               {isCameraActive ? '📸' : '📷'}
                            </button>
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-10 h-10 bg-slate-700 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                              title="رفع صورة"
                            >
                               📁
                            </button>
                         </div>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="relative group">
                         <span className="absolute top-4 right-4 text-slate-500 group-focus-within:text-blue-500 transition-colors">👤</span>
                         <input 
                           type="text" 
                           placeholder="اسمك الثلاثي" 
                           className="w-full pl-4 pr-12 py-4 bg-slate-800/50 border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all"
                           value={formData.name}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                         />
                      </div>
                      <div className="relative group">
                         <span className="absolute top-4 right-4 text-slate-500 group-focus-within:text-blue-500 transition-colors">📱</span>
                         <input 
                           type="tel" 
                           placeholder="رقم هاتفك" 
                           className="w-full pl-4 pr-12 py-4 bg-slate-800/50 border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all"
                           value={formData.studentPhone}
                           onChange={e => setFormData({...formData, studentPhone: e.target.value})}
                         />
                      </div>
                      <div className="relative group">
                         <span className="absolute top-4 right-4 text-slate-500 group-focus-within:text-blue-500 transition-colors">👨‍👩‍👦</span>
                         <input 
                           type="tel" 
                           placeholder="رقم ولي الأمر" 
                           className="w-full pl-4 pr-12 py-4 bg-slate-800/50 border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-800 transition-all"
                           value={formData.parentPhone}
                           onChange={e => setFormData({...formData, parentPhone: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button onClick={() => setStep(2)} className="px-6 py-4 rounded-2xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-all">رجوع</button>
                      <button 
                        onClick={handleSubmit}
                        className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-900/50 hover:shadow-blue-600/40 hover:scale-[1.02] transition-all"
                      >
                         تأكيد التسجيل 🚀
                      </button>
                   </div>
                </div>
              )}

           </div>
        </div>
      </div>

      {/* Hidden Helper Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Registration;
