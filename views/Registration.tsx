
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    studentPhone: '',
    parentPhone: '',
    yearId: '',
    groupId: '',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder',
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
    if (Object.values(formData).some(v => !v)) return alert('يرجى إكمال كافة البيانات لضمان نجاح التسجيل ⚠️');
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

  const steps = [
    { n: 1, label: 'المرحلة', icon: '🎓' },
    { n: 2, label: 'المجموعة', icon: '🏫' },
    { n: 3, label: 'البيانات والصورة', icon: '👤' }
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center p-4 md:p-10 font-['Cairo'] relative overflow-hidden" dir="rtl">
       <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-20 right-[10%] text-[20rem] font-black text-blue-500/10 rotate-12">∑</div>
          <div className="absolute bottom-20 left-[10%] text-[18rem] font-black text-indigo-500/10 -rotate-12">∫</div>
       </div>

       <div className="w-full max-w-5xl flex justify-between items-center mb-10 relative z-20">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-2xl">∑</div>
             <div className="text-right">
                <h1 className="text-white font-black text-xl leading-tight">تسجيل طالب جديد</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">MathMaster Pro Academy</p>
             </div>
          </div>
          <button onClick={onBack} className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
             <span className="text-xs font-black">العودة للرئيسية</span>
             <span className="text-xl transition-transform group-hover:translate-x-[-5px]">⭢</span>
          </button>
       </div>

       <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          <div className="lg:col-span-3 hidden lg:flex flex-col gap-6">
             {steps.map((s) => {
               const isActive = step === s.n;
               const isDone = step > s.n;
               return (
                 <div key={s.n} className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col gap-3 ${
                   isActive ? 'bg-blue-600 border-blue-500 shadow-2xl shadow-blue-900/40 scale-105' : 
                   isDone ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                   'bg-white/5 border-white/5 text-slate-600'
                 }`}>
                    <div className="flex justify-between items-center">
                       <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                         isActive ? 'bg-white text-blue-600' : isDone ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-500'
                       }`}>
                          {isDone ? '✓' : s.n}
                       </span>
                       <span className="text-2xl">{s.icon}</span>
                    </div>
                    <div>
                       <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>الخطوة {s.n}</p>
                       <p className={`text-sm font-black ${isActive ? 'text-white' : 'text-slate-400'}`}>{s.label}</p>
                    </div>
                 </div>
               );
             })}
          </div>

          <div className="lg:col-span-9 bg-white rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col min-h-[600px]">
             <div className="h-2 w-full bg-slate-100 flex overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.8)]" 
                  style={{ width: `${(step / 3) * 100}%` }}
                ></div>
             </div>

             <div className="flex-1 p-8 md:p-12 flex flex-col">
                <div className="mb-10">
                   <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">
                      {step === 1 ? 'اختر صفك الدراسي' : step === 2 ? 'اختر مجموعتك المفضلة' : 'البيانات الشخصية والصورة'}
                   </h2>
                </div>

                <div className="flex-1">
                   {step === 1 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                        {years.map((y, idx) => (
                          <button 
                            key={y.id} 
                            onClick={() => { setFormData({...formData, yearId: y.id}); setStep(2); }}
                            className="group p-8 rounded-[2.5rem] border-4 border-slate-50 bg-slate-50/50 hover:bg-white hover:border-blue-600 hover:shadow-2xl transition-all duration-500 text-right relative overflow-hidden"
                          >
                             <div className="relative z-10 flex flex-col gap-4">
                                <span className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">🎓</span>
                                <span className="font-black text-slate-800 text-xl">{y.name}</span>
                             </div>
                          </button>
                        ))}
                     </div>
                   )}

                   {step === 2 && (
                     <div className="space-y-8 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {groups.filter(g => g.yearId === formData.yearId).length > 0 ? (
                             groups.filter(g => g.yearId === formData.yearId).map((g) => (
                               <button 
                                 key={g.id} 
                                 onClick={() => { setFormData({...formData, groupId: g.id}); setStep(3); }}
                                 className="group p-8 rounded-[3rem] border-4 border-slate-50 bg-slate-50/50 hover:bg-white hover:border-indigo-600 hover:shadow-2xl transition-all duration-500 text-right flex flex-col gap-4"
                               >
                                  <div className="flex justify-between items-start w-full">
                                     <span className="font-black text-slate-900 text-xl">{g.name}</span>
                                     <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase ${g.type === 'center' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {g.type === 'center' ? 'سنتر' : 'أونلاين'}
                                     </span>
                                  </div>
                                  <div className="text-slate-400 font-bold text-sm">📅 {g.time}</div>
                               </button>
                             ))
                           ) : (
                              <div className="col-span-full py-20 text-center opacity-60">لا توجد مجموعات حالياً</div>
                           )}
                        </div>
                        <button onClick={() => setStep(1)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all shadow-xl">⭢ العودة</button>
                     </div>
                   )}

                   {step === 3 && (
                     <div className="space-y-8 animate-fadeIn">
                        {/* Avatar Picker Section */}
                        <div className="flex flex-col md:flex-row items-center gap-10 bg-slate-50 p-8 rounded-[3rem] border-2 border-dashed border-slate-200">
                           <div className="relative group">
                              <div className="w-40 h-40 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-200 relative">
                                 {isCameraActive ? (
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                 ) : (
                                    <img src={formData.avatar} className="w-full h-full object-cover" alt="Profile" />
                                 )}
                              </div>
                              <canvas ref={canvasRef} className="hidden" />
                              {isCameraActive && (
                                 <button onClick={capturePhoto} className="absolute inset-0 bg-blue-600/60 backdrop-blur-sm text-white font-black text-xs flex items-center justify-center">اضغط للالتقاط 📸</button>
                              )}
                           </div>
                           
                           <div className="flex-1 space-y-4 text-center md:text-right">
                              <h4 className="font-black text-slate-800 text-lg">الصورة الشخصية</h4>
                              <p className="text-slate-400 font-bold text-xs">ستظهر هذه الصورة في الكارنيه الخاص بك.</p>
                              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                 {!isCameraActive ? (
                                    <button onClick={startCamera} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] shadow-lg">فتح الكاميرا 📸</button>
                                 ) : (
                                    <button onClick={stopCamera} className="px-6 py-3 bg-rose-500 text-white rounded-2xl font-black text-[10px] shadow-lg">إلغاء</button>
                                 )}
                                 <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] shadow-sm">رفع من الجهاز 📁</button>
                                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2 col-span-full">
                              <label className="text-[10px] font-black text-slate-400 px-4 uppercase">الاسم الكامل</label>
                              <input type="text" placeholder="مثال: أحمد محمد علي" className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-3xl font-black text-md outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 px-4 uppercase">هاتف الطالب</label>
                              <input type="tel" className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-3xl font-black text-md outline-none transition-all text-left" dir="ltr" value={formData.studentPhone} onChange={e => setFormData({...formData, studentPhone: e.target.value})} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 px-4 uppercase">هاتف ولي الأمر</label>
                              <input type="tel" className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-3xl font-black text-md outline-none transition-all text-left" dir="ltr" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} />
                           </div>
                        </div>

                        <div className="pt-6">
                           <button onClick={handleSubmit} className="w-full py-7 bg-blue-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">تأكيد الاشتراك 🚀</button>
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Registration;
