
import React, { useState, useRef } from 'react';
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
  const [successData, setSuccessData] = useState<{name: string, code: string, group: string} | null>(null);
  
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

  const generateStudentCode = (groupId: string) => {
      const group = groups.find(g => g.id === groupId);
      // Use group prefix if available, else generic 'ST'
      const prefix = group?.codePrefix || 'ST'; 
      // Generate random 4 digits
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}-${randomNum}`;
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.studentPhone || !formData.parentPhone) return alert('يرجى إكمال كافة البيانات الأساسية ⚠️');
    
    // 1. Generate Instant Code
    const newCode = generateStudentCode(formData.groupId);
    const selectedGroupName = groups.find(g => g.id === formData.groupId)?.name || 'عام';

    // 2. Register Student with Pending Status
    onRegister({
      name: formData.name,
      studentPhone: formData.studentPhone,
      parentPhone: formData.parentPhone,
      yearId: formData.yearId,
      groupId: formData.groupId,
      avatar: formData.avatar,
      studentCode: newCode, 
      attendance: false,
      status: 'pending', // CHANGED: Now pending by default
      registrationDate: new Date(formData.registrationDate).toLocaleDateString('ar-EG'),
      isPaid: false 
    });

    // 3. Show Success Screen
    setSuccessData({
        name: formData.name,
        code: newCode,
        group: selectedGroupName
    });
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return "المرحلة الدراسية";
      case 2: return "المجموعة المناسبة";
      case 3: return "بيانات الطالب";
      default: return "";
    }
  };

  const getStepDesc = () => {
    switch(step) {
      case 1: return "حدد الصف الدراسي للبدء في عرض المجموعات.";
      case 2: return "اختر الموعد الأنسب لجدولك.";
      case 3: return "بياناتك الشخصية وصورتك لإصدار الكارنيه.";
      default: return "";
    }
  };

  // --- Success Screen View ---
  if (successData) {
      return (
        <div className="min-h-screen bg-[#0f172a] font-['Cairo'] flex items-center justify-center p-6 text-center" dir="rtl">
            <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl relative overflow-hidden animate-scaleIn">
                <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-600"></div>
                
                <div className="mb-6">
                    <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <span className="text-5xl">⏳</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800">تم إرسال الطلب!</h2>
                    <p className="text-slate-500 font-bold mt-2">أهلاً بك يا {successData.name.split(' ')[0]}</p>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 mb-8 relative">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">كود الدخول الخاص بك</p>
                    <h1 className="text-5xl font-black text-indigo-600 tracking-wider font-mono">{successData.code}</h1>
                    <p className="text-xs text-amber-600 font-bold mt-4">
                        يرجى الانتظار حتى يقوم الأستاذ {teacherName} بالموافقة على طلبك وتفعيل الحساب.
                    </p>
                </div>

                <div className="space-y-3">
                    <p className="text-xs text-rose-500 font-bold bg-rose-50 p-3 rounded-xl">
                        ⚠️ احتفظ بالكود، ستحتاجه للدخول بمجرد الموافقة.
                    </p>
                    <button 
                        onClick={onBack} 
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] transition-transform"
                    >
                        العودة للرئيسية 🏠
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- Registration Form ---
  return (
    <div className="min-h-screen bg-[#0f172a] font-['Cairo'] flex overflow-hidden relative text-right" dir="rtl">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-600/10 blur-[150px] rounded-full"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[150px] rounded-full"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
      </div>

      <div className="container mx-auto max-w-7xl flex flex-col lg:flex-row h-full relative z-10">
        
        {/* Left Panel (Info & Steps) */}
        <div className="lg:w-1/3 p-8 lg:p-12 flex flex-col justify-between relative border-l border-white/5 bg-[#0f172a]/50 backdrop-blur-sm">
           <div>
              <button onClick={onBack} className="flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors mb-8 text-xs font-black">
                 <span>←</span> <span>العودة للرئيسية</span>
              </button>
              
              <div className="mb-12">
                 <h1 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
                    انضم لنخبة <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">العباقرة</span>
                 </h1>
                 <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-medium">
                    سجل بياناتك الآن للحصول على عضوية أكاديمية الأستاذ {teacherName} والتمتع بكافة المميزات.
                 </p>
              </div>

              {/* Royal Stepper */}
              <div className="hidden lg:flex flex-col gap-10 relative">
                 {/* Connecting Line */}
                 <div className="absolute top-5 bottom-5 right-[19px] w-0.5 bg-white/10"></div>
                 
                 {[1, 2, 3].map((s) => (
                   <div key={s} className={`flex items-center gap-6 relative z-10 transition-all duration-500 ${step === s ? 'opacity-100 translate-x-0' : step > s ? 'opacity-70' : 'opacity-30'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black border-2 transition-all shadow-lg ${step === s ? 'bg-gradient-to-br from-amber-400 to-orange-600 border-amber-400 text-white scale-125' : step > s ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-[#0f172a] border-slate-600 text-slate-500'}`}>
                         {step > s ? '✓' : s}
                      </div>
                      <div>
                         <p className={`font-black text-lg ${step === s ? 'text-white' : 'text-slate-400'}`}>{s === 1 ? 'المرحلة' : s === 2 ? 'المجموعة' : 'الهوية'}</p>
                         {step === s && <p className="text-amber-500 text-[10px] font-bold animate-pulse">جاري التسجيل...</p>}
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="hidden lg:block text-slate-600 text-[10px] font-black uppercase tracking-widest mt-auto">
              MathMaster Pro &copy; {new Date().getFullYear()}
           </div>
        </div>

        {/* Right Panel (Form) */}
        <div className="lg:w-2/3 h-full overflow-y-auto no-scrollbar relative flex flex-col">
           <div className="p-8 lg:p-16 flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full">
              
              <div className="mb-10">
                 <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                    <span className="text-amber-500 text-4xl">{step === 1 ? '🎓' : step === 2 ? '🏫' : '🆔'}</span>
                    {getStepTitle()}
                 </h2>
                 <p className="text-slate-400 text-sm font-medium border-r-2 border-amber-500/50 pr-3">{getStepDesc()}</p>
              </div>

              {/* Step 1: Years */}
              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slideUp">
                   {years.map(y => (
                     <button 
                       key={y.id}
                       onClick={() => { setFormData({...formData, yearId: y.id}); setStep(2); }}
                       className="group relative p-8 bg-[#1e293b] hover:bg-gradient-to-br hover:from-amber-600 hover:to-orange-700 transition-all rounded-[2.5rem] border border-white/5 text-right overflow-hidden shadow-xl"
                     >
                        <span className="text-5xl block mb-6 group-hover:scale-110 transition-transform origin-bottom-right opacity-50 group-hover:opacity-100">🎓</span>
                        <h3 className="text-xl font-black text-white">{y.name}</h3>
                        <p className="text-slate-500 text-xs mt-2 group-hover:text-white/80 font-bold">اضغط للاختيار ⭠</p>
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
                          className="flex items-center justify-between p-6 bg-[#1e293b] hover:bg-[#283548] border border-white/5 hover:border-amber-500/50 rounded-[2rem] transition-all group text-right shadow-lg"
                        >
                           <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${g.type === 'center' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                 {g.type === 'center' ? '🏫' : '🌐'}
                              </div>
                              <div>
                                 <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors">{g.name}</h3>
                                 <p className="text-slate-400 text-xs mt-1 font-bold">{g.time}</p>
                              </div>
                           </div>
                           <div className="text-slate-600 text-2xl group-hover:text-amber-500 group-hover:-translate-x-2 transition-all">⭠</div>
                        </button>
                      ))}
                   </div>
                   {groups.filter(g => g.yearId === formData.yearId).length === 0 && (
                      <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-[2rem]">
                         <span className="text-4xl block mb-2">⚠️</span>
                         <p className="text-slate-400 font-bold">لا توجد مجموعات متاحة لهذا الصف حالياً</p>
                      </div>
                   )}
                   <button onClick={() => setStep(1)} className="text-slate-500 hover:text-white text-xs font-bold py-4 transition-colors">← تغيير الصف الدراسي</button>
                </div>
              )}

              {/* Step 3: Profile */}
              {step === 3 && (
                <div className="space-y-10 animate-slideUp">
                   {/* Avatar Scanner */}
                   <div className="flex justify-center mb-8">
                      <div className="relative group">
                         <div className={`w-40 h-40 rounded-[3rem] overflow-hidden border-4 ${isCameraActive ? 'border-amber-500 shadow-[0_0_30px_#f59e0b]' : 'border-white/10'} bg-slate-900 relative transition-all shadow-2xl`}>
                            {isCameraActive ? (
                               <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                            ) : (
                               <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                            )}
                            {/* Scanning Line Animation */}
                            {isCameraActive && (
                               <div className="absolute top-0 left-0 w-full h-1 bg-amber-400 shadow-[0_0_10px_#fbbf24] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                            )}
                         </div>
                         
                         <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-3">
                            <button 
                              onClick={isCameraActive ? capturePhoto : startCamera}
                              className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-[#0f172a]"
                              title={isCameraActive ? "التقاط" : "فتح الكاميرا"}
                            >
                               {isCameraActive ? '📸' : '📷'}
                            </button>
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-12 h-12 bg-slate-700 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-[#0f172a]"
                              title="رفع صورة"
                            >
                               📁
                            </button>
                         </div>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </div>
                   </div>

                   <div className="space-y-5">
                      <div className="relative group">
                         <span className="absolute top-5 right-5 text-slate-500 group-focus-within:text-amber-500 transition-colors text-lg">👤</span>
                         <input 
                           type="text" 
                           placeholder="اسمك الثلاثي" 
                           className="w-full pl-6 pr-14 py-5 bg-[#1e293b] border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:bg-[#283548] transition-all"
                           value={formData.name}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                         />
                      </div>
                      <div className="relative group">
                         <span className="absolute top-5 right-5 text-slate-500 group-focus-within:text-amber-500 transition-colors text-lg">📱</span>
                         <input 
                           type="tel" 
                           placeholder="رقم هاتفك" 
                           className="w-full pl-6 pr-14 py-5 bg-[#1e293b] border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:bg-[#283548] transition-all"
                           value={formData.studentPhone}
                           onChange={e => setFormData({...formData, studentPhone: e.target.value})}
                         />
                      </div>
                      <div className="relative group">
                         <span className="absolute top-5 right-5 text-slate-500 group-focus-within:text-amber-500 transition-colors text-lg">👨‍👩‍👦</span>
                         <input 
                           type="tel" 
                           placeholder="رقم ولي الأمر" 
                           className="w-full pl-6 pr-14 py-5 bg-[#1e293b] border border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 focus:bg-[#283548] transition-all"
                           value={formData.parentPhone}
                           onChange={e => setFormData({...formData, parentPhone: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="flex gap-4 pt-6 border-t border-white/5">
                      <button onClick={() => setStep(2)} className="px-8 py-4 rounded-2xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 transition-all">رجوع</button>
                      <button 
                        onClick={handleSubmit}
                        className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-orange-900/40 hover:shadow-orange-600/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                         <span>تأكيد وإرسال الطلب</span>
                         <span>🚀</span>
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
