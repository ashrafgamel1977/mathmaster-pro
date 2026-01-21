
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
  teacherName?: string; 
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

  // Helper to format code
  const formatCode = (code: string) => {
    return code;
  };

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
          {years.length === 0 ? (
             <div className="text-center py-20 opacity-50 bg-white rounded-[3rem] border-4 border-dashed border-slate-200">
                <span className="text-6xl block mb-4">🏫</span>
                <p className="font-black text-xl text-slate-500">لا توجد صفوف دراسية حالياً</p>
                <p className="text-sm font-bold text-slate-400 mt-2">ابدأ بإضافة "صف دراسي" جديد من القائمة الجانبية لتتمكن من إنشاء المجموعات.</p>
             </div>
          ) : (
             years.map(y => (
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
                          <button onClick={() => setShowCardsForGroup(g.id)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition-all">🪪 كارنيهات VIP</button>
                          <button onClick={() => onBatchGenerateCodes?.(g.id)} className="w-12 h-10 bg-white border border-slate-200 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all">🔑</button>
                        </div>
                        <button onClick={() => onDeleteGroup(g.id)} className="absolute -top-2 -left-2 w-8 h-8 bg-white border border-slate-100 text-rose-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">✕</button>
                      </div>
                    ))}
                    {groups.filter(g => g.yearId === y.id).length === 0 && (
                        <p className="text-center text-slate-400 text-xs font-bold py-10 col-span-full border-2 border-dashed border-slate-100 rounded-3xl">لا توجد مجموعات في هذا الصف</p>
                    )}
                  </div>
                </div>
             ))
          )}
        </div>
      </div>

      {/* Modern ID Card Modal - 8.5x5.5cm Landscape */}
      {showCardsForGroup && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-start animate-fadeIn overflow-hidden">
          
          {/* Sticky Header for Controls */}
          <div className="w-full bg-[#0f172a] shadow-xl border-b border-white/10 p-4 z-50 sticky top-0 flex justify-between items-center px-6 md:px-12 print:hidden">
             <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                   <span>🖨️</span> معاينة الطباعة
                </h3>
                <p className="text-slate-400 text-[10px]">المقاس القياسي: 8.5 × 5.5 سم</p>
             </div>
             <div className="flex gap-3">
                <button onClick={() => window.print()} className="px-6 py-2 bg-amber-500 text-white rounded-xl font-black text-xs hover:bg-amber-600 transition-all shadow-lg flex items-center gap-2">
                   <span>طباعة الكل</span>
                   <span>🖨️</span>
                </button>
                <button onClick={() => setShowCardsForGroup(null)} className="px-6 py-2 bg-rose-600 text-white rounded-xl font-black text-xs hover:bg-rose-700 transition-all shadow-lg flex items-center gap-2">
                   <span>إغلاق</span>
                   <span>✕</span>
                </button>
             </div>
          </div>
          
          <div className="flex-1 w-full overflow-y-auto p-8 print:p-0 print:overflow-visible">
            <div className="flex flex-wrap justify-center gap-4 print:gap-2 print:block">
                {students.filter(s => s.groupId === showCardsForGroup).map(student => {
                  const group = groups.find(g => g.id === student.groupId);
                  
                  return (
                    <div 
                      key={student.id} 
                      className="relative rounded-xl overflow-hidden shadow-xl print:shadow-none print:break-inside-avoid print:inline-block print:m-1 mb-6 break-inside-avoid"
                      style={{ 
                        width: '8.5cm', 
                        height: '5.5cm',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }}
                    >
                      {/* Card Background */}
                      <div className="absolute inset-0 bg-[#0f172a] z-0 print:bg-[#0f172a]">
                         {/* Golden Accents */}
                         <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-amber-500/20 to-transparent"></div>
                         <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-600"></div>
                         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                      </div>

                      {/* Content Container */}
                      <div className="relative z-10 w-full h-full flex items-center p-3 gap-3">
                         
                         {/* Left Side: Photo & Info */}
                         <div className="flex-1 flex flex-col justify-center gap-1.5 h-full pt-1">
                            <div className="flex items-center gap-3">
                               <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-300 to-amber-600 shrink-0">
                                  <img src={student.avatar} className="w-full h-full rounded-full object-cover bg-white" alt="Std" />
                               </div>
                               <div>
                                  <h3 className="text-white font-black text-xs leading-tight mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[110px]">{student.name.split(' ').slice(0, 2).join(' ')}</h3>
                                  <span className="text-[8px] text-amber-400 font-bold bg-white/10 px-1.5 py-0.5 rounded">{group?.name}</span>
                               </div>
                            </div>

                            <div className="mt-auto">
                               <p className="text-[6px] text-slate-400 uppercase tracking-widest font-bold">Student ID</p>
                               <p className="text-white font-mono font-black text-sm tracking-widest">{student.studentCode}</p>
                            </div>
                         </div>

                         {/* Divider */}
                         <div className="w-[1px] h-[80%] bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

                         {/* Right Side: QR & Brand */}
                         <div className="w-[30%] flex flex-col items-center justify-center gap-1">
                            <div className="bg-white p-1 rounded-lg">
                               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.studentCode}`} className="w-16 h-16 object-contain" alt="QR" />
                            </div>
                            <div className="text-center mt-1">
                               <p className="text-[7px] text-white font-black">{platformName}</p>
                               <p className="text-[5px] text-amber-500 font-bold">VIP ACCESS</p>
                            </div>
                         </div>

                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Management;
