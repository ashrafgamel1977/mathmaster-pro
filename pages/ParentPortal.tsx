
import React, { useState } from 'react';
import { Student, QuizResult, PlatformSettings, ParentInquiry } from '../types';
import { 
  ArrowRight, Users, Phone, MessageSquare, AlertCircle, 
  CheckCircle2, XCircle, TrendingUp, Award, FileText, 
  Clock, ShieldCheck, Activity, Send
} from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-['Cairo'] relative overflow-hidden" dir="rtl">
        <button onClick={onBack} className="absolute top-10 left-10 px-6 py-3 bg-white rounded-2xl font-black text-xs shadow-sm hover:bg-slate-100 flex items-center gap-2 text-slate-600 transition-all">
           <ArrowRight size={16} /> عودة للرئيسية
        </button>
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl text-center space-y-8 border border-slate-100 animate-slideUp relative z-10">
           <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] mx-auto flex items-center justify-center text-indigo-600 shadow-inner">
              <Users size={48} />
           </div>
           <div className="space-y-3">
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">بوابة ولي الأمر</h2>
             <p className="text-slate-500 font-bold text-sm leading-relaxed">{settings.parentWelcomeMsg}</p>
           </div>
           <div className="space-y-4">
              <div className="relative">
                 <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <Phone size={20} />
                 </div>
                 <input 
                   type="tel" 
                   placeholder="رقم هاتف ولي الأمر المسجل..." 
                   className="w-full pr-12 pl-6 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-black text-lg text-slate-800 outline-none transition-all shadow-inner"
                   value={phone}
                   onChange={e => setPhone(e.target.value)}
                 />
              </div>
              <button 
                onClick={() => onLogin(phone)}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 transition-all text-lg flex items-center justify-center gap-2"
              >
                <Activity size={20} /> عرض التقرير الشامل
              </button>
           </div>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
              <AlertCircle size={12} /> في حال واجهت مشكلة، يرجى التواصل مع الأستاذ {settings.teacherName}
           </p>
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
    <div className="min-h-screen bg-slate-50 pb-24 font-['Cairo'] px-4 md:px-8 pt-8 text-right" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Header */}
        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,_rgba(79,70,229,0.05),transparent_50%)] pointer-events-none"></div>
           
           <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 text-center md:text-right">
              <div className="relative">
                 <img src={student.avatar} className="w-28 h-28 rounded-[2rem] border-4 border-white shadow-xl object-cover" alt={student.name} />
                 <div className={`absolute -bottom-2 -left-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center ${student.attendance ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {student.attendance ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                 </div>
              </div>
              <div>
                 <h2 className="text-3xl font-black text-slate-800">{student.name}</h2>
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1">
                       الكود: {student.code}
                    </span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${averageScore > 85 ? 'bg-emerald-50 text-emerald-600' : averageScore > 70 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                       <TrendingUp size={14} /> المستوى: {averageScore > 85 ? 'ممتاز ⭐' : averageScore > 70 ? 'جيد جداً' : 'يحتاج متابعة'}
                    </span>
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
              <button onClick={() => setShowInquiryModal(true)} className="flex-1 md:flex-none px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 hover:scale-105 transition-all flex items-center justify-center gap-2">
                 <MessageSquare size={18} /> تواصل مع المعلم
              </button>
              <button onClick={onBack} className="flex-1 md:flex-none px-6 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                 <ArrowRight size={18} /> خروج
              </button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-md border border-slate-100 relative overflow-hidden group hover:border-blue-200 transition-all">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500"></div>
              <div className="flex justify-between items-start mb-4">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">متوسط الدرجات</h3>
                 <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Activity size={20} /></div>
              </div>
              <div className="text-4xl font-black text-slate-800">{averageScore}<span className="text-xl text-slate-400 ml-1">%</span></div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] shadow-md border border-slate-100 relative overflow-hidden group hover:border-amber-200 transition-all">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500"></div>
              <div className="flex justify-between items-start mb-4">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">النقاط والمكافآت</h3>
                 <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Award size={20} /></div>
              </div>
              <div className="text-4xl font-black text-slate-800">{student.points}</div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] shadow-md border border-slate-100 relative overflow-hidden group hover:border-emerald-200 transition-all">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500"></div>
              <div className="flex justify-between items-start mb-4">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">حالة الحضور</h3>
                 <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Clock size={20} /></div>
              </div>
              <div className="text-2xl font-black text-slate-800 mt-2">
                 {student.attendance ? <span className="text-emerald-600">حاضر اليوم</span> : <span className="text-rose-500">غائب اليوم</span>}
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] shadow-md border border-slate-100 relative overflow-hidden group hover:border-purple-200 transition-all">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-500"></div>
              <div className="flex justify-between items-start mb-4">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">الاشتراك المالي</h3>
                 <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><ShieldCheck size={20} /></div>
              </div>
              <div className="text-2xl font-black text-slate-800 mt-2">
                 {student.isPaid ? <span className="text-emerald-600">خالص</span> : <span className="text-rose-500">غير مسدد</span>}
              </div>
           </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
           <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><FileText size={24} /></div>
              <h3 className="text-xl font-black text-slate-800">سجل الاختبارات والتقييمات</h3>
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
                 <tbody className="divide-y divide-slate-50">
                    {results.filter(r => r.studentId === student.id).length > 0 ? (
                      results.filter(r => r.studentId === student.id).map(res => (
                        <tr key={res.id} className="hover:bg-slate-50/80 transition-all group">
                            <td className="px-8 py-6 font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{res.quizTitle}</td>
                            <td className="px-8 py-6 text-center">
                                <span className={`text-2xl font-black ${res.score >= 85 ? 'text-emerald-500' : res.score >= 50 ? 'text-blue-500' : 'text-rose-500'}`}>{res.score}%</span>
                            </td>
                            <td className="px-8 py-6">
                                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 w-max">
                                   <CheckCircle2 size={12} /> تم التقييم
                                </span>
                            </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-20 text-center opacity-50">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                             <FileText size={32} />
                          </div>
                          <p className="font-black text-slate-500">لا توجد نتائج مسجلة لهذا الطالب حالياً</p>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        {showInquiryModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowInquiryModal(false)}></div>
            <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-[3rem] relative z-10 animate-slideUp space-y-6 text-right" dir="rtl">
               <div className="flex justify-between items-center mb-2">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                     <MessageSquare className="text-indigo-600" /> تواصل مع المعلم
                  </h3>
                  <button onClick={() => setShowInquiryModal(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                     <XCircle size={20} />
                  </button>
               </div>
               <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 px-2 uppercase tracking-widest">الموضوع</label>
                    <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-indigo-500 transition-all text-slate-700" value={inquiry.subject} onChange={e => setInquiry({...inquiry, subject: e.target.value})}>
                      <option value="">اختر الموضوع...</option>
                      <option value="استفسار عن مستوى">استفسار عن المستوى الأكاديمي</option>
                      <option value="طلب مكالمة">طلب مكالمة هاتفية</option>
                      <option value="اقتراح أو شكوى">تقديم اقتراح أو شكوى</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 px-2 uppercase tracking-widest">نص الرسالة</label>
                    <textarea placeholder="اكتب تفاصيل طلبكم هنا..." className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm min-h-[120px] outline-none border-2 border-transparent focus:border-indigo-500 transition-all text-slate-700 resize-none" value={inquiry.message} onChange={e => setInquiry({...inquiry, message: e.target.value})} />
                  </div>
                  <button onClick={handleSubmitInquiry} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-sm">
                     <Send size={18} /> إرسال الطلب
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentPortal;
