
import React, { useState, useMemo } from 'react';
import { Student, Group, Year, AppNotification } from '../types';
import AttendanceScanner from './AttendanceScanner';

interface StudentListProps {
  students: Student[];
  groups: Group[];
  years: Year[];
  notifications: AppNotification[];
  onAttendanceChange: (id: string) => void;
  onSendAlert: (student: Student, message: string, channel: 'whatsapp' | 'sms' | 'call') => void;
  onDeleteStudent: (id: string) => void;
  onResetDevice: (id: string) => void;
  onAddStudent: (data: any) => void;
  onUpdateStudent?: (id: string, updates: Partial<Student>) => void;
  teacherName: string;
}

const StudentList: React.FC<StudentListProps> = ({ students, groups, years, notifications, onAttendanceChange, onSendAlert, onDeleteStudent, onResetDevice, onAddStudent, onUpdateStudent, teacherName }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'unpaid'>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [showScanner, setShowScanner] = useState(false);
  
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.studentCode.includes(searchQuery);
      let matchesStatus = true;
      if (filterStatus === 'present') matchesStatus = student.attendance;
      else if (filterStatus === 'absent') matchesStatus = !student.attendance;
      else if (filterStatus === 'unpaid') matchesStatus = !student.isPaid;
      
      const matchesGroup = filterGroup === 'all' ? true : student.groupId === filterGroup;
      return searchQuery ? matchesSearch : (matchesSearch && matchesStatus && matchesGroup);
    });
  }, [students, searchQuery, filterStatus, filterGroup]);

  const hasReadLatest = (student: Student) => {
    const relevantNotifs = notifications.filter(n => n.targetYearId === student.yearId || n.targetStudentId === student.id || n.targetYearId === undefined);
    if (relevantNotifs.length === 0) return true;
    const latestId = relevantNotifs[0].id;
    return student.lastReadNotificationId === latestId;
  };

  const handleQuickAttendance = (code: string) => {
    const student = students.find(s => s.studentCode === code);
    if (student) {
      if (!student.attendance) {
        onAttendanceChange(student.id);
        // نكتفي بالتسجيل ولا نغلق الماسح للمسح التالي
      }
    }
  };

  return (
    <div className="space-y-10 animate-slideUp max-w-7xl mx-auto pb-20 px-4 md:px-0 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight">إدارة شؤون الطلاب 👥</h2>
           <p className="text-sm text-slate-400 font-bold mt-1">متابعة الحضور، تحصيل المصروفات، وإدارة الأجهزة.</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
           <button 
             onClick={() => setShowScanner(true)}
             className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-blue-200 hover:scale-105 transition-all flex items-center gap-2"
           >
             <span>ماسح الحضور السريع</span>
             <span className="text-xl">📸</span>
           </button>
           <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              {['all', 'present', 'unpaid'].map((f) => (
                <button 
                  key={f} 
                  onClick={() => setFilterStatus(f as any)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${filterStatus === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                >
                  {f === 'all' ? 'الكل' : f === 'present' ? 'الحضور اليوم' : 'غير المسددين 💰'}
                </button>
              ))}
           </div>
           <input 
             type="text" 
             placeholder="بحث بالاسم أو الكود..." 
             className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-blue-600 transition-all w-64 shadow-inner"
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStudents.map((student) => {
          const group = groups.find(g => g.id === student.groupId);
          const isReader = hasReadLatest(student);
          
          return (
            <div key={student.id} className="premium-card p-6 rounded-[3rem] flex flex-col gap-6 relative group overflow-hidden bg-white shadow-xl hover:translate-y-[-8px] transition-all duration-500">
               <div className="absolute top-4 left-4 flex gap-2 items-center">
                  <span title={isReader ? "قرأ آخر الإشعارات" : "لم يقرأ آخر الإشعارات بعد"} className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] ${isReader ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>👁️</span>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${student.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`}>
                    {student.isPaid ? 'مسدد' : 'لم يسدد'}
                  </span>
               </div>

               <div className="flex flex-col items-center text-center gap-4 mt-4">
                  <div className="relative">
                    <img src={student.avatar} className="w-20 h-20 rounded-[2.5rem] object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform" alt="" />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center text-[8px] ${student.attendance ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'}`}>
                      {student.attendance ? '✓' : ''}
                    </div>
                  </div>
                  <div>
                     <h4 className="font-black text-slate-800 text-sm truncate max-w-[150px] mx-auto">{student.name}</h4>
                     <p className="text-[10px] font-black text-slate-400 mt-1">{group?.name || 'بدون مجموعة'}</p>
                     <p className="text-[10px] font-black text-blue-600 mt-1 tracking-widest">{student.studentCode}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onUpdateStudent?.(student.id, { isPaid: !student.isPaid })}
                    className={`py-3 rounded-xl font-black text-[9px] transition-all flex items-center justify-center gap-2 ${student.isPaid ? 'bg-slate-100 text-slate-500' : 'bg-amber-500 text-white shadow-lg shadow-amber-200'}`}
                  >
                    <span>💰</span>
                    <span>{student.isPaid ? 'إلغاء السداد' : 'تحصيل الشهر'}</span>
                  </button>
                  <button onClick={() => onAttendanceChange(student.id)} className={`py-3 rounded-xl font-black text-[9px] shadow-sm transition-all ${student.attendance ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {student.attendance ? 'تسجيل انصراف' : 'تسجيل حضور'}
                  </button>
               </div>

               <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex gap-2">
                     <button onClick={() => window.open(`tel:${student.studentPhone}`)} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm hover:bg-blue-600 hover:text-white transition-all shadow-sm">📞</button>
                     <button onClick={() => window.open(`https://wa.me/${student.studentPhone}`)} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm hover:bg-emerald-600 hover:text-white transition-all shadow-sm">💬</button>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onResetDevice(student.id)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center text-xs hover:bg-slate-200 hover:text-slate-600 transition-all" title="تصفير الأجهزة">⚙️</button>
                    <button onClick={() => onDeleteStudent(student.id)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-400 flex items-center justify-center text-xs hover:bg-rose-500 hover:text-white transition-all shadow-sm">🗑️</button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {showScanner && (
        <AttendanceScanner 
          onScan={handleQuickAttendance}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default StudentList;
