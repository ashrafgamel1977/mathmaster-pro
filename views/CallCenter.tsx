import React, { useState, useMemo, useEffect } from 'react';
import { ParentInquiry, CallLog, Student, PlatformSettings, AppView } from '../types';

interface CallCenterProps {
  inquiries: ParentInquiry[];
  callLogs: CallLog[];
  students: Student[];
  onUpdateInquiry: (id: string, status: ParentInquiry['status']) => void;
  onAddCallLog: (log: Omit<CallLog, 'id'>) => void;
  teacherName: string;
  settings?: PlatformSettings;
}

const CallCenter: React.FC<CallCenterProps> = ({ inquiries, callLogs, students, onUpdateInquiry, onAddCallLog, teacherName, settings }) => {
  const [activeTab, setActiveTab] = useState<string>('inquiries');
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLog, setNewLog] = useState({ studentId: '', parentName: '', note: '' });

  const DEFAULT_TABS: { id: string; label: string; disabled?: boolean }[] = [
    { id: 'inquiries', label: 'الطلبات الواردة' },
    { id: 'logs', label: 'سجل المكالمات' }
  ];

  const tabs = useMemo(() => {
    if (!settings?.featureConfig?.[AppView.CALL_CENTER]) return DEFAULT_TABS;
    const config = settings.featureConfig[AppView.CALL_CENTER];
    return DEFAULT_TABS.map(t => {
        const conf = config.find(c => c.id === t.id);
        if (conf) {
            return { ...t, label: conf.label, disabled: !conf.enabled };
        }
        return t;
    }).filter(t => !t.disabled);
  }, [settings]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
        setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'high': return 'bg-rose-100 text-rose-600';
      case 'medium': return 'bg-amber-100 text-amber-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  const handleCall = (phone: string, id: string) => {
    onUpdateInquiry(id, 'calling');
    window.open(`tel:${phone}`, '_self');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slideUp pb-24 text-right font-['Cairo']" dir="rtl">
      {/* Royal Header */}
      <div className="bg-[#0f172a] p-10 md:p-14 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div>
              <h2 className="text-3xl md:text-5xl font-black mb-2">مركز الاتصال الذكي 📞</h2>
              <p className="text-blue-200 font-bold text-sm md:text-lg">إدارة تواصل أولياء الأمور وحل المشكلات الأكاديمية.</p>
           </div>
           <div className="flex bg-white/5 backdrop-blur-md p-1 rounded-2xl border border-white/10">
              {tabs.map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)} 
                  className={`px-6 py-3 rounded-xl font-black text-xs transition-all ${activeTab === tab.id ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
                >
                  {tab.label}
                </button>
              ))}
           </div>
        </div>
      </div>

      {activeTab === 'inquiries' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
          {inquiries.map((inq) => (
            <div key={inq.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                 <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getPriorityColor(inq.priority)}`}>
                   {inq.priority === 'high' ? 'عاجل جداً' : inq.priority === 'medium' ? 'متوسط' : 'عادي'}
                 </span>
                 <span className="text-[10px] font-bold text-slate-400">{inq.timestamp}</span>
              </div>
              
              <div className="space-y-4 mb-8">
                 <h4 className="text-lg font-black text-slate-800">ولي أمر: {inq.studentName}</h4>
                 <p className="text-indigo-600 font-bold text-xs">الموضوع: {inq.subject}</p>
                 <div className="bg-slate-50 p-4 rounded-2xl text-xs text-slate-500 font-medium leading-relaxed">
                   "{inq.message}"
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => handleCall(inq.parentPhone, inq.id)}
                   className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] shadow-lg shadow-emerald-900/10 hover:scale-105 transition-all flex items-center justify-center gap-2"
                 >
                   <span>اتصال مباشر</span>
                   <span>📞</span>
                 </button>
                 <button 
                   onClick={() => onUpdateInquiry(inq.id, 'resolved')}
                   className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                 >تم الحل ✓</button>
              </div>
            </div>
          ))}
          {inquiries.length === 0 && (
            <div className="col-span-full py-32 text-center opacity-30 bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
               <span className="text-6xl block mb-4">🔕</span>
               <p className="font-black text-lg">لا توجد اتصالات واردة حالياً</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-[3.5rem] shadow-xl border border-slate-100 overflow-hidden animate-fadeIn">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800">سجل مكالمات المعلم 📝</h3>
              <button 
                onClick={() => setShowLogModal(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs"
              >إضافة ملاحظة مكالمة ＋</button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-right">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">التاريخ</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">الطالب</th>
                       <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">ملاحظة المعلم</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {callLogs.map(log => (
                       <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5 text-xs text-slate-400 font-bold">{log.date}</td>
                          <td className="px-8 py-5 font-black text-slate-800 text-sm">
                            {students.find(s=>s.id===log.studentId)?.name || log.parentName}
                          </td>
                          <td className="px-8 py-5 text-sm text-slate-600 font-medium italic">"{log.note}"</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLogModal(false)}></div>
           <div className="bg-white w-full max-w-md p-10 rounded-[3.5rem] relative z-10 animate-slideUp space-y-6">
              <h3 className="text-2xl font-black text-slate-800">تدوين مكالمة جديدة</h3>
              <div className="space-y-4">
                 <select 
                   className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-xs outline-none"
                   value={newLog.studentId}
                   onChange={e => setNewLog({...newLog, studentId: e.target.value})}
                 >
                    <option value="">اختر الطالب...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
                 <textarea 
                   placeholder="ماذا تم في المكالمة؟"
                   className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm min-h-[120px] outline-none"
                   value={newLog.note}
                   onChange={e => setNewLog({...newLog, note: e.target.value})}
                 />
                 <button 
                   onClick={() => {
                     onAddCallLog({...newLog, date: new Date().toLocaleDateString('ar-EG')});
                     setShowLogModal(false);
                     setNewLog({studentId: '', parentName: '', note: ''});
                   }}
                   className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl"
                 >حفظ الملاحظة ✓</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CallCenter;