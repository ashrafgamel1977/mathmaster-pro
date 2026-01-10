
import React, { useState } from 'react';
import { AppNotification, Year, Group, MathNotation } from '../types';
import MathRenderer from '../components/MathRenderer';

interface NotificationsProps {
  notifications: AppNotification[];
  years: Year[];
  groups: Group[];
  role: 'teacher' | 'student';
  currentStudentId?: string;
  currentYearId?: string;
  onSend: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>, triggerPush: boolean) => void;
  onMarkRead: (id: string) => void;
  onDelete?: (id: string) => void;
  notation?: MathNotation;
}

const TEMPLATES = [
  { id: 'absent', label: 'تنبيه غياب ⚠️', title: 'تنبيه غياب عن الحصة', message: 'عزيزي الطالب، لقد لاحظنا تغيبك عن حصة اليوم. نرجو منك متابعة المحاضرة المسجلة في المكتبة فوراً لضمان عدم تراكم الدروس.', type: 'urgent' },
  { id: 'excellence', label: 'تهنئة تميز 🌟', title: 'تهنئة بالتميز الأكاديمي', message: 'يسر الأستاذ أشرف جميل تهنئتك على أدائك الرائع في الاختبار الأخير. أنت فخر لمنصتنا، استمر في هذا التألق!', type: 'academic' },
  { id: 'postpone', label: 'تأجيل حصة 📅', title: 'تعديل موعد الحصة القادمة', message: 'يرجى العلم بأنه تم تأجيل موعد حصة يوم [اليوم] إلى الساعة [الوقت]. نعتذر عن أي إزعاج.', type: 'general' },
  { id: 'payment', label: 'تذكير مصاريف 💰', title: 'تذكير بسداد المصروفات الشهرية', message: 'عزيزي ولي الأمر/الطالب، نود تذكيركم بموعد سداد مصروفات الشهر الجديد لضمان استمرار صلاحية الدخول للمنصة.', type: 'urgent' }
];

const Notifications: React.FC<NotificationsProps> = ({ notifications, years, groups, role, currentStudentId, currentYearId, onSend, onMarkRead, onDelete, notation = 'arabic' }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [triggerPush, setTriggerPush] = useState(true);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'general' as any, targetYearId: 'all' });

  const filteredNotifications = role === 'student' 
    ? notifications.filter(n => 
        (n.targetYearId === 'all' || n.targetYearId === currentYearId || n.targetStudentId === currentStudentId)
      )
    : notifications;

  const handleSend = () => {
    if (!newNotif.title || !newNotif.message) return;
    onSend({
      title: newNotif.title,
      message: newNotif.message,
      type: newNotif.type,
      targetYearId: newNotif.targetYearId === 'all' ? undefined : newNotif.targetYearId
    }, triggerPush);
    setShowAdd(false);
    setNewNotif({ title: '', message: '', type: 'general', targetYearId: 'all' });
  };

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setNewNotif({
      ...newNotif,
      title: tpl.title,
      message: tpl.message,
      type: tpl.type
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-slideUp pb-24 text-right" dir="rtl">
      <div className="bg-slate-900 p-10 md:p-14 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div>
              <h2 className="text-3xl md:text-5xl font-black mb-2">مركز التنبيهات 🔔</h2>
              <p className="text-blue-200 font-bold text-sm md:text-lg">ابقَ على اطلاع دائم بكل التطورات الأكاديمية.</p>
           </div>
           {role === 'teacher' && (
             <button 
               onClick={() => setShowAdd(true)}
               className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs shadow-xl shadow-blue-500/20 hover:scale-105 transition-all"
             >إرسال تنبيه جديد ＋</button>
           )}
        </div>
      </div>

      <div className="space-y-6">
        {filteredNotifications.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 opacity-30">
             <span className="text-6xl block mb-4">📭</span>
             <p className="font-black text-slate-400">لا توجد تنبيهات جديدة حالياً</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => onMarkRead(n.id)}
              className={`group bg-white p-8 rounded-[3rem] border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col md:flex-row gap-8 items-start md:items-center ${!n.isRead ? 'border-blue-600 shadow-xl' : 'border-slate-100 hover:border-slate-300'}`}
            >
              {!n.isRead && <div className="absolute top-0 right-0 w-3 h-full bg-blue-600"></div>}
              
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                n.type === 'academic' ? 'bg-indigo-50 text-indigo-600' :
                n.type === 'urgent' ? 'bg-rose-50 text-rose-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {n.type === 'academic' ? '📚' : n.type === 'urgent' ? '🔥' : '📢'}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                   <h3 className="text-xl font-black text-slate-800">{n.title}</h3>
                   {n.targetYearId && <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black">{years.find(y => y.id === n.targetYearId)?.name}</span>}
                   {n.targetStudentId && <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black">شخصي 🔒</span>}
                </div>
                <div className="text-sm text-slate-500 font-bold leading-relaxed">
                   <MathRenderer content={n.message} inline />
                </div>
                <p className="text-[10px] text-slate-400 font-black">{n.timestamp}</p>
              </div>

              {role === 'teacher' && (
                <button onClick={(e) => { e.stopPropagation(); onDelete?.(n.id); }} className="w-12 h-12 bg-rose-50 text-rose-400 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
              )}
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowAdd(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-10 md:p-14 relative z-10 animate-slideUp shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
              <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3"><span>📢</span> إرسال تنبيه للطلاب</h3>
              <button onClick={() => setShowAdd(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
            </div>
            
            <div className="space-y-6">
              <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-3">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2">استخدام قالب جاهز لتوفير الوقت:</p>
                 <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map(tpl => (
                      <button key={tpl.id} onClick={() => applyTemplate(tpl)} className="px-4 py-2 bg-white border border-blue-100 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-blue-600 hover:text-white transition-all">{tpl.label}</button>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 px-4 uppercase">نوع التنبيه</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-xs outline-none"
                    value={newNotif.type}
                    onChange={e => setNewNotif({...newNotif, type: e.target.value as any})}
                  >
                    <option value="general">إعلان عام</option>
                    <option value="academic">أكاديمي (واجب/اختبار)</option>
                    <option value="urgent">هام وعاجل</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 px-4 uppercase">الفئة المستهدفة</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-xs outline-none"
                    value={newNotif.targetYearId}
                    onChange={e => setNewNotif({...newNotif, targetYearId: e.target.value})}
                  >
                    <option value="all">كل الطلاب</option>
                    {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 px-4 uppercase">العنوان</label>
                <input 
                  type="text" 
                  placeholder="عنوان التنبيه..."
                  className="w-full px-8 py-5 bg-slate-50 rounded-2xl font-black text-md outline-none"
                  value={newNotif.title}
                  onChange={e => setNewNotif({...newNotif, title: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 px-4 uppercase">نص الرسالة (يدعم LaTeX)</label>
                <textarea 
                  placeholder="اكتب رسالتك هنا.. $ س^{2} $"
                  className="w-full p-8 bg-slate-50 rounded-[2.5rem] font-bold text-sm h-40 outline-none"
                  value={newNotif.message}
                  onChange={e => setNewNotif({...newNotif, message: e.target.value})}
                />
              </div>

              {/* خيار تفعيل الإشعار الفوري */}
              <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-transparent hover:border-blue-600 transition-all flex items-center justify-between group">
                 <div className="flex items-center gap-4">
                    <span className="text-2xl group-hover:rotate-12 transition-transform">📱</span>
                    <div>
                       <h4 className="font-black text-slate-800 text-xs">إرسال كإشعار موبايل فوري (Push)</h4>
                       <p className="text-[9px] text-slate-400 font-bold">سيصل تنبيه لهواتف الطلاب حتى والتطبيق مغلق.</p>
                    </div>
                 </div>
                 <button onClick={() => setTriggerPush(!triggerPush)} className={`w-14 h-8 rounded-full transition-all relative ${triggerPush ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all ${triggerPush ? 'right-7' : 'right-1.5'}`}></div>
                 </button>
              </div>

              <button 
                onClick={handleSend}
                className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black shadow-2xl hover:scale-105 transition-all text-xl"
              >بث التنبيه للطلاب الآن 🚀</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
