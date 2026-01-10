
import React, { useState } from 'react';
import { Year, Group, Student } from '../types';

interface ManagementProps {
  years: Year[];
  groups: Group[];
  students: Student[];
  onAddYear: (name: string) => void;
  onAddGroup: (name: string, yearId: string, time: string, type: 'center' | 'online', gender: 'boys' | 'girls' | 'mixed', capacity: number, prefix: string) => void;
  onDeleteGroup: (id: string) => void;
  onBatchGenerateCodes?: (groupId: string) => void;
  teacherName?: string; // Made optional and unused in logic to prevent errors
  platformName: string;
}

const Management: React.FC<ManagementProps> = ({ 
  years, groups, students, 
  onAddYear, onAddGroup, onDeleteGroup, onBatchGenerateCodes, platformName 
}) => {
  const [newYear, setNewYear] = useState('');
  const [showCardsForGroup, setShowCardsForGroup] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', yearId: '', time: '', type: 'center' as const, gender: 'mixed' as const, capacity: 40, prefix: '' });

  const getStudentCount = (groupId: string) => students.filter(s => s.groupId === groupId).length;

  return (
    <div className="space-y-12 animate-slideUp pb-24 text-right font-['Cairo']" dir="rtl">
      <div className="relative overflow-hidden rounded-[4rem] bg-[#0f172a] p-10 md:p-16 text-white shadow-2xl">
        <h2 className="text-3xl md:text-5xl font-black">إدارة الصفوف والمجموعات 🏫</h2>
        <p className="text-slate-400 font-medium mt-2">قم بتهيئة النظام الدراسي وإصدار بطاقات QR للطلاب.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-black text-slate-800">＋ إضافة صف</h3>
            <input type="text" placeholder="اسم الصف..." className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" value={newYear} onChange={e => setNewYear(e.target.value)} />
            <button onClick={() => { if(newYear) { onAddYear(newYear); setNewYear(''); } }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg">حفظ الصف</button>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-black text-slate-800">＋ إضافة مجموعة</h3>
            <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={groupForm.yearId} onChange={e => setGroupForm({...groupForm, yearId: e.target.value})}>
              <option value="">اختر الصف...</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <input type="text" placeholder="اسم المجموعة" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={groupForm.name} onChange={e => setGroupForm({...groupForm, name: e.target.value})} />
            <input type="text" placeholder="الموعد (السبت ٤م)" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={groupForm.time} onChange={e => setGroupForm({...groupForm, time: e.target.value})} />
            <input type="text" placeholder="بادئة الأكواد (M3)" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={groupForm.prefix} onChange={e => setGroupForm({...groupForm, prefix: e.target.value.toUpperCase()})} />
            <button onClick={() => { if(groupForm.name && groupForm.yearId) { onAddGroup(groupForm.name, groupForm.yearId, groupForm.time, groupForm.type, groupForm.gender, groupForm.capacity, groupForm.prefix); setGroupForm({...groupForm, name: '', prefix: ''}); } }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg">إنشاء المجموعة</button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          {years.map(y => (
            <div key={y.id} className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-slate-100">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <span>{y.name}</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px]">{groups.filter(g => g.yearId === y.id).length} مجموعة</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groups.filter(g => g.yearId === y.id).map(g => (
                  <div key={g.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 transition-all relative group flex flex-col justify-between min-h-[200px]">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-black text-slate-800">{g.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{g.time}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black ${g.type === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          {g.type === 'online' ? 'أونلاين' : 'سنتر'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        <span className="text-[10px] font-black text-slate-500">{getStudentCount(g.id)} طالباً مسجلاً</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowCardsForGroup(g.id)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] shadow-lg flex items-center justify-center gap-2">🪪 كارنيهات QR الذكية</button>
                      <button onClick={() => onBatchGenerateCodes?.(g.id)} className="w-12 h-10 bg-white border border-slate-200 text-indigo-600 rounded-xl flex items-center justify-center">🔑</button>
                    </div>
                    <button onClick={() => onDeleteGroup(g.id)} className="absolute -top-2 -left-2 w-8 h-8 bg-white border border-slate-100 text-rose-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCardsForGroup && (
        <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-fadeIn overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] min-h-[90vh] flex flex-col shadow-2xl relative my-10">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[3rem]">
              <div><h3 className="text-2xl font-black text-slate-800">إصدار كارنيهات QR 🪪</h3></div>
              <div className="flex gap-3">
                <button onClick={() => window.print()} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs">طباعة 🖨️</button>
                <button onClick={() => setShowCardsForGroup(null)} className="px-8 py-3 bg-slate-200 text-slate-600 rounded-xl font-black text-xs">إغلاق</button>
              </div>
            </div>
            <div className="flex-1 p-10 print:p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:grid-cols-2">
                {students.filter(s => s.groupId === showCardsForGroup).map(student => (
                  <div key={student.id} className="relative w-[300px] h-[480px] bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-100 mx-auto print:shadow-none mb-4">
                    <div className="h-32 bg-[#0f172a] flex flex-col items-center justify-center text-white p-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest">{platformName}</h4>
                    </div>
                    <div className="px-6 -mt-12 flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-2xl border-[6px] border-white shadow-2xl overflow-hidden bg-slate-100 mb-4">
                        <img src={student.avatar} className="w-full h-full object-cover" alt="" />
                      </div>
                      <h3 className="text-lg font-black text-slate-800">{student.name}</h3>
                      <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center mt-6">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.studentCode}`} className="h-24 w-24 object-contain mb-2" alt="QR Code" />
                        <span className="text-[9px] font-black text-slate-400 tracking-[0.4em]">{student.studentCode}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Management;
