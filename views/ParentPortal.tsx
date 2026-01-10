
import React, { useState } from 'react';
import { Student, QuizResult, PlatformSettings, ParentInquiry } from '../types';
import MathRenderer from '../components/MathRenderer';

interface ParentPortalProps {
  student: Student | null;
  results: QuizResult[];
  onLogin: (phone: string) => void;
  settings: PlatformSettings;
  onSendInquiry: (inquiry: ParentInquiry) => void;
  onBack: () => void;
}

const ParentPortal: React.FC<ParentPortalProps> = ({ student, results, onLogin, settings, onSendInquiry, onBack }) => {
  const [phone, setPhone] = useState('');
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiry, setInquiry] = useState({ subject: '', message: '', priority: 'medium' as ParentInquiry['priority'] });

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50 p-6 font-['Cairo'] relative overflow-hidden" dir="rtl">
        <button onClick={onBack} className="absolute top-10 left-10 px-6 py-3 bg-white rounded-2xl font-black text-xs shadow-sm hover:bg-slate-50">← عودة للرئيسية</button>
        <div className="max-w-md w-full bg-white p-12 rounded-[4rem] shadow-2xl text-center space-y-10 border border-amber-100 animate-slideUp relative z-10">
           <div className="w-24 h-24 bg-amber-500 rounded-[2.5rem] mx-auto flex items-center justify-center text-white text-5xl font-black shadow-2xl rotate-3">👨‍👩‍👦</div>
           <div className="space-y-3">
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">متابعة ولي الأمر</h2>
             <p className="text-slate-500 font-bold text-sm leading-relaxed">{settings.parentWelcomeMsg}</p>
           </div>
           <div className="space-y-4">
              <input 
                type="tel" 
                placeholder="رقم الهاتف (مثال: 010123...)" 
                className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl font-black text-center text-xl text-slate-800 outline-none transition-all shadow-inner"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <button 
                onClick={() => onLogin(phone)}
                className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black shadow-xl transition-all text-lg"
              >
                عرض التقرير 📊
              </button>
           </div>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">في حال واجهت مشكلة، يرجى التواصل مع الأستاذ {settings.teacherName}</p>
        </div>
      </div>
    );
  }

  const averageScore = results.length > 0 
    ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length) 
    : 0;

  const handleSubmitInquiry = () => {
    if (!inquiry.subject || !inquiry.message) return alert('يرجى كتابة الموضوع والرسالة');
    onSendInquiry({
      id: 'inq' + Date.now(),
      studentId: student.id,
      studentName: student.name,
      parentPhone: student.parentPhone,
      subject: inquiry.subject,
      message: inquiry.message,
      priority: inquiry.priority,
      status: 'pending',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
    setShowInquiryModal(false);
    setInquiry({ subject: '', message: '', priority: 'medium' });
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] pb-24 font-['Cairo'] px-6 md:px-12 pt-12 text-right" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header Header */}
        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="flex items-center gap-6">
              <img src={student.avatar} className="w-24 h-24 rounded-[2rem] border-4 border-amber-50 shadow-lg" alt="" />
              <div>
                 <h2 className="text-3xl font-black text-slate-800">تقرير الطالب: {student.name}</h2>
                 <p className="text-sm font-bold text-amber-600 mt-1">المستوى الحالي: {averageScore > 85 ? 'ممتاز ⭐' : averageScore > 70 ? 'جيد جداً' : 'يحتاج متابعة'}</p>
              </div>
           </div>
           <div className="flex gap-4">
              <button onClick={() => setShowInquiryModal(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-3xl font-black text-xs shadow-xl shadow-indigo-100 hover:scale-105 transition-all">تواصل مع المعلم 📞</button>
              <button onClick={onBack} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-3xl font-black text-xs">خروج</button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white p-10 rounded-[3rem] shadow-lg border border-gray-100 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-2 h-full bg-blue-600"></div>
              <h3 className="text-xl font-black text-slate-800 mb-4 uppercase tracking-widest text-[10px] text-slate-400">متوسط درجات الطالب</h3>
              <div className="text-7xl font-black text-blue-600">{averageScore}%</div>
           </div>
           <div className="bg-white p-10 rounded-[3rem] shadow-lg border border-gray-100 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
              <h3 className="text-xl font-black text-slate-800 mb-4 uppercase tracking-widest text-[10px] text-slate-400">النقاط المحصلة</h3>
              <div className="text-7xl font-black text-amber-500">{student.points}</div>
           </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden">
           <div className="p-8 border-b border-gray-50 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">نتائج الاختبارات الأخيرة 📊</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-right">
                 <thead>
                    <tr className="bg-gray-50/50">
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الاختبار / التقييم</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">الدرجة</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {results.filter(r => r.studentId === student.id).length > 0 ? (
                      results.filter(r => r.studentId === student.id).map(res => (
                        <tr key={res.id} className="hover:bg-slate-50/80 transition-all group">
                            <td className="px-8 py-6 font-black text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{res.quizTitle}</td>
                            <td className="px-8 py-6 text-center">
                                <span className={`text-2xl font-black ${res.score >= 85 ? 'text-emerald-500' : 'text-blue-500'}`}>{res.score}%</span>
                            </td>
                            <td className="px-8 py-6">
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">تم التصحيح ✓</span>
                            </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-20 text-center opacity-30">
                          <span className="text-4xl block mb-2">📊</span>
                          <p className="font-black text-slate-400">لا توجد نتائج مسجلة لهذا الطالب حالياً</p>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {showInquiryModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowInquiryModal(false)}></div>
            <div className="bg-white w-full max-w-md p-10 rounded-[3.5rem] relative z-10 animate-slideUp space-y-6 text-right" dir="rtl">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-black text-slate-800">تواصل مع المعلم</h3>
                  <button onClick={() => setShowInquiryModal(false)} className="text-slate-300 hover:text-rose-500 transition-colors text-xl">✕</button>
               </div>
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">الموضوع</label>
                    <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-xs outline-none border border-transparent focus:border-indigo-600" value={inquiry.subject} onChange={e => setInquiry({...inquiry, subject: e.target.value})}>
                      <option value="">اختر الموضوع...</option>
                      <option value="استفسار عن مستوى">استفسار عن المستوى الأكاديمي</option>
                      <option value="طلب مكالمة">طلب مكالمة هاتفية</option>
                      <option value="اقتراح أو شكوى">تقديم اقتراح أو شكوى</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 px-4 uppercase tracking-widest">نص الرسالة</label>
                    <textarea placeholder="اكتب تفاصيل طلبكم هنا..." className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm min-h-[150px] outline-none border border-transparent focus:border-indigo-600 shadow-inner" value={inquiry.message} onChange={e => setInquiry({...inquiry, message: e.target.value})} />
                  </div>
                  <button onClick={handleSubmitInquiry} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-900/20 hover:scale-[1.02] transition-all">إرسال الطلب الآن 🚀</button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentPortal;
