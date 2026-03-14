
import React, { useState, useMemo } from 'react';
import { Student, Group, Year, AppNotification, AssignmentSubmission, QuizResult } from '../types';

interface StudentListProps {
  students: Student[];
  groups: Group[];
  years: Year[];
  notifications: AppNotification[];
  submissions: AssignmentSubmission[];
  results: QuizResult[];
  teacherName: string;
  onAttendanceChange: (id: string) => void;
  onSendAlert: (student: Student, message: string, type: 'academic' | 'urgent') => void;
  onDeleteStudent: (id: string) => void;
  onResetDevice: (id: string) => void;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
}

const StudentList: React.FC<StudentListProps> = ({
  students, groups, years, notifications, submissions, results, teacherName,
  onAttendanceChange, onSendAlert, onDeleteStudent, onResetDevice, onAddStudent, onUpdateStudent
}) => {
  const [filterYear, setFilterYear] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  
  // New Student Form State
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '', studentPhone: '', parentPhone: '', yearId: '', groupId: '', 
    status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewStudent'
  });

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchYear = filterYear === 'all' || s.yearId === filterYear;
      const matchGroup = filterGroup === 'all' || s.groupId === filterGroup;
      const matchPayment = filterPayment === 'all' || (filterPayment === 'paid' ? s.isPaid : !s.isPaid);
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchYear && matchGroup && matchSearch && matchPayment;
    });
  }, [students, filterYear, filterGroup, filterPayment, searchQuery]);

  const handleAddSubmit = () => {
    if(!newStudent.name || !newStudent.studentPhone || !newStudent.yearId) return alert('يرجى ملء البيانات الأساسية');
    
    const codePrefix = groups.find(g => g.id === newStudent.groupId)?.codePrefix || 'ST';
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    
    const studentData: Student = {
        id: 's'+Date.now(),
        studentCode: `${codePrefix}-${randomCode}`,
        name: newStudent.name!,
        studentPhone: newStudent.studentPhone!,
        parentPhone: newStudent.parentPhone || '',
        yearId: newStudent.yearId!,
        groupId: newStudent.groupId || '',
        attendance: false,
        score: 0,
        points: 0,
        avatar: newStudent.avatar!,
        scoreHistory: [],
        status: 'active',
        badges: [],
        streaks: 0,
        deviceIds: [],
        isPaid: false,
        registrationDate: new Date().toLocaleDateString('ar-EG')
    };
    onAddStudent(studentData);
    setShowAddModal(false);
    setNewStudent({ name: '', studentPhone: '', parentPhone: '', yearId: '', groupId: '' });
    alert(`تم إضافة الطالب بنجاح!\nكود الطالب هو: ${studentData.studentCode}\nيرجى حفظ هذا الكود لإعطائه للطالب.`);
  };

  const handleEditSubmit = () => {
    if (!editingStudent) return;
    onUpdateStudent(editingStudent.id, {
        name: editingStudent.name,
        studentPhone: editingStudent.studentPhone,
        parentPhone: editingStudent.parentPhone,
        yearId: editingStudent.yearId,
        groupId: editingStudent.groupId,
        avatar: editingStudent.avatar
    });
    setEditingStudent(null);
  };

  return (
    <div className="space-y-8 animate-slideUp pb-24 text-right" dir="rtl">
      {/* Header & Controls */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
         <div>
            <h2 className="text-3xl font-black text-slate-800">سجل الطلاب 👨‍🎓</h2>
            <p className="text-sm text-slate-400 font-bold mt-1">إدارة شاملة لبيانات وحضور الطلاب.</p>
         </div>
         <button onClick={() => setShowAddModal(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-xl hover:scale-105 transition-all flex items-center gap-2">
            <span>إضافة طالب</span>
            <span className="text-xl">＋</span>
         </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm">
         <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="بحث بالاسم أو الكود..." 
              className="w-full pl-4 pr-12 py-4 bg-slate-50 rounded-3xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
         </div>
         <select className="px-6 py-4 bg-slate-50 rounded-3xl font-bold text-xs outline-none cursor-pointer" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="all">كل الصفوف</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
         </select>
         <select className="px-6 py-4 bg-slate-50 rounded-3xl font-bold text-xs outline-none cursor-pointer" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
            <option value="all">كل المجموعات</option>
            {groups.filter(g => filterYear === 'all' || g.yearId === filterYear).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
         </select>
         <select className="px-6 py-4 bg-slate-50 rounded-3xl font-bold text-xs outline-none cursor-pointer" value={filterPayment} onChange={e => setFilterPayment(e.target.value as any)}>
            <option value="all">المالية (الكل)</option>
            <option value="paid">مدفوع</option>
            <option value="unpaid">غير مدفوع</option>
         </select>
      </div>

      {/* Students List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {filteredStudents.map(student => {
            const isPending = student.status === 'pending';
            const groupName = groups.find(g => g.id === student.groupId)?.name || 'غير محدد';
            
            return (
                <div key={student.id} className={`bg-white rounded-[2.5rem] p-6 shadow-lg border transition-all relative overflow-hidden group ${isPending ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 hover:border-indigo-200 hover:shadow-xl'}`}>
                    {/* Status Strip */}
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${student.attendance ? 'bg-emerald-500' : 'bg-slate-200'}`} />

                    {/* Header Info */}
                    <div className="flex items-start justify-between mt-2 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="relative cursor-pointer" onClick={() => setSelectedStudent(student)}>
                                <img src={student.avatar} className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md bg-slate-100" alt="" />
                                <span className={`absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full text-[10px] border-2 border-white shadow-sm ${student.isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {student.isPaid ? '💰' : '💸'}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-lg leading-tight mb-1 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setSelectedStudent(student)}>{student.name}</h3>
                                <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{student.studentCode}</span>
                                    <span>•</span>
                                    <span>{groupName}</span>
                                </p>
                            </div>
                        </div>
                        <div className="text-center bg-amber-50 px-3 py-2 rounded-2xl border border-amber-100 min-w-[70px]">
                            <span className="block text-xl font-black text-amber-500">{student.points}</span>
                            <span className="text-[9px] font-bold text-amber-400">نقطة</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                            <span className={`block text-sm font-black ${student.score >= 80 ? 'text-emerald-600' : student.score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{student.score}%</span>
                            <span className="text-[9px] text-slate-400 font-bold">المستوى</span>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                            <span className={`block text-sm font-black ${student.attendance ? 'text-emerald-600' : 'text-slate-500'}`}>{student.attendance ? 'حاضر' : 'غائب'}</span>
                            <span className="text-[9px] text-slate-400 font-bold">الحالة</span>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onResetDevice(student.id)}>
                            <span className={`block text-sm font-black ${(student.deviceIds?.length || 0) >= 2 ? 'text-rose-500' : 'text-blue-500'}`}>{student.deviceIds?.length || 0}</span>
                            <span className="text-[9px] text-slate-400 font-bold">أجهزة</span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        {isPending ? (
                           <button onClick={() => onUpdateStudent(student.id, { status: 'active' })} className="col-span-2 py-3 bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg hover:bg-emerald-600 transition-all">قبول الطالب ✓</button>
                        ) : (
                           <>
                             <button onClick={() => onAttendanceChange(student.id)} className={`py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${student.attendance ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                 {student.attendance ? 'تسجيل انصراف 🏃' : 'تسجيل حضور ✅'}
                             </button>
                             <button onClick={() => setSelectedStudent(student)} className="py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                                 التفاصيل 📋
                             </button>
                           </>
                        )}
                    </div>
                    
                    {/* Floating Actions (Hover) */}
                    <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onSendAlert(student, 'يرجى مراجعة الإدارة', 'urgent')} className="w-8 h-8 bg-white text-rose-500 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform" title="إرسال تنبيه">🔔</button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingStudent(student); }} className="w-8 h-8 bg-white text-indigo-500 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform" title="تعديل">✎</button>
                        <a href={`tel:${student.parentPhone}`} onClick={(e) => e.stopPropagation()} className="w-8 h-8 bg-white text-emerald-500 rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform" title="اتصال">📞</a>
                    </div>
                </div>
            );
         })}
      </div>

      {filteredStudents.length === 0 && (
          <div className="text-center py-20 opacity-40">
              <p className="font-black text-xl text-slate-400">لا يوجد طلاب مطابقين للبحث</p>
          </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white w-full max-w-2xl p-8 rounded-[3rem] shadow-2xl relative animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-start mb-6 shrink-0">
                  <div className="flex items-center gap-4">
                      <img src={selectedStudent.avatar} className="w-20 h-20 rounded-[2rem] bg-slate-100 object-cover border-4 border-white shadow-lg" alt="" />
                      <div>
                          <h3 className="text-2xl font-black text-slate-800">{selectedStudent.name}</h3>
                          <p className="text-slate-400 font-bold text-sm">{selectedStudent.studentCode}</p>
                      </div>
                  </div>
                  <button onClick={() => setSelectedStudent(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-8">
                  {/* Info Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-indigo-50 p-4 rounded-2xl text-center">
                          <span className="block text-2xl font-black text-indigo-600">{selectedStudent.points}</span>
                          <span className="text-[10px] font-bold text-indigo-400">النقاط</span>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                          <span className="block text-2xl font-black text-emerald-600">{selectedStudent.score}%</span>
                          <span className="text-[10px] font-bold text-emerald-400">المستوى</span>
                      </div>
                      <div className="bg-amber-50 p-4 rounded-2xl text-center">
                          <span className="block text-2xl font-black text-amber-600">{selectedStudent.badges?.length || 0}</span>
                          <span className="text-[10px] font-bold text-amber-400">الأوسمة</span>
                      </div>
                      <div className="bg-rose-50 p-4 rounded-2xl text-center">
                          <span className="block text-2xl font-black text-rose-600">{selectedStudent.streaks || 0}</span>
                          <span className="text-[10px] font-bold text-rose-400">أيام متتالية</span>
                      </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                      <h4 className="font-black text-slate-800 mb-4 text-sm">بيانات التواصل</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">📱</span>
                              <div>
                                  <p className="text-[10px] text-slate-400 font-bold">رقم الطالب</p>
                                  <p className="font-black text-slate-700 text-sm">{selectedStudent.studentPhone}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100">
                              <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs">📞</span>
                              <div>
                                  <p className="text-[10px] text-slate-400 font-bold">رقم ولي الأمر</p>
                                  <p className="font-black text-slate-700 text-sm">{selectedStudent.parentPhone}</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                      <h4 className="font-black text-slate-800 mb-4 text-sm">آخر النشاطات</h4>
                      <div className="space-y-3">
                          {submissions.filter(s => s.studentId === selectedStudent.id).slice(0, 3).map(sub => (
                              <div key={sub.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                                  <div className="flex items-center gap-3">
                                      <span className="text-xl">📝</span>
                                      <div>
                                          <p className="font-bold text-slate-800 text-xs">تسليم واجب</p>
                                          <p className="text-[10px] text-slate-400">{sub.timestamp}</p>
                                      </div>
                                  </div>
                                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${sub.status === 'graded' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                      {sub.status === 'graded' ? `${sub.grade} درجة` : 'قيد المراجعة'}
                                  </span>
                              </div>
                          ))}
                          {results.filter(r => r.studentId === selectedStudent.id).slice(0, 3).map(res => (
                              <div key={res.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                                  <div className="flex items-center gap-3">
                                      <span className="text-xl">⚡</span>
                                      <div>
                                          <p className="font-bold text-slate-800 text-xs">{res.quizTitle}</p>
                                          <p className="text-[10px] text-slate-400">اختبار</p>
                                      </div>
                                  </div>
                                  <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-indigo-100 text-indigo-600">
                                      {res.score}%
                                  </span>
                              </div>
                          ))}
                          {(!submissions.some(s => s.studentId === selectedStudent.id) && !results.some(r => r.studentId === selectedStudent.id)) && (
                              <p className="text-center text-slate-400 text-xs py-4">لا توجد نشاطات حديثة</p>
                          )}
                      </div>
                  </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3 shrink-0">
                  <button onClick={() => { setEditingStudent(selectedStudent); setSelectedStudent(null); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all">تعديل البيانات</button>
                  <button onClick={() => setStudentToDelete(selectedStudent)} className="flex-1 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black hover:bg-rose-100 transition-all">حذف الطالب</button>
              </div>
           </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative">
              <h3 className="text-2xl font-black text-slate-800 mb-6">تسجيل طالب جديد</h3>
              <div className="space-y-4">
                 <input type="text" placeholder="اسم الطالب" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                 <input type="tel" placeholder="رقم الطالب" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newStudent.studentPhone} onChange={e => setNewStudent({...newStudent, studentPhone: e.target.value})} />
                 <input type="tel" placeholder="رقم ولي الأمر" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} />
                 <input type="url" placeholder="رابط صورة الطالب (اختياري)" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newStudent.avatar === 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewStudent' ? '' : newStudent.avatar} onChange={e => setNewStudent({...newStudent, avatar: e.target.value || 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewStudent'})} />
                 
                 <div className="grid grid-cols-2 gap-4">
                    <select className="px-4 py-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newStudent.yearId} onChange={e => setNewStudent({...newStudent, yearId: e.target.value})}>
                        <option value="">الصف الدراسي</option>
                        {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                    <select className="px-4 py-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newStudent.groupId} onChange={e => setNewStudent({...newStudent, groupId: e.target.value})}>
                        <option value="">المجموعة</option>
                        {groups.filter(g => !newStudent.yearId || g.yearId === newStudent.yearId).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button onClick={handleAddSubmit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">حفظ</button>
                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">إلغاء</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative">
              <h3 className="text-2xl font-black text-slate-800 mb-6">تعديل بيانات الطالب</h3>
              <div className="space-y-4">
                 <input 
                    type="text" 
                    placeholder="اسم الطالب" 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs" 
                    value={editingStudent.name} 
                    onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} 
                 />
                 <input 
                    type="tel" 
                    placeholder="رقم الطالب" 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs" 
                    value={editingStudent.studentPhone} 
                    onChange={e => setEditingStudent({...editingStudent, studentPhone: e.target.value})} 
                 />
                 <input 
                    type="tel" 
                    placeholder="رقم ولي الأمر" 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs" 
                    value={editingStudent.parentPhone} 
                    onChange={e => setEditingStudent({...editingStudent, parentPhone: e.target.value})} 
                 />
                 <input 
                    type="url" 
                    placeholder="رابط صورة الطالب (اختياري)" 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs" 
                    value={editingStudent.avatar} 
                    onChange={e => setEditingStudent({...editingStudent, avatar: e.target.value})} 
                 />
                 
                 <div className="grid grid-cols-2 gap-4">
                    <select 
                        className="px-4 py-4 bg-slate-50 rounded-2xl font-bold text-xs" 
                        value={editingStudent.yearId} 
                        onChange={e => setEditingStudent({...editingStudent, yearId: e.target.value})}
                    >
                        <option value="">الصف الدراسي</option>
                        {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                    <select 
                        className="px-4 py-4 bg-slate-50 rounded-2xl font-bold text-xs" 
                        value={editingStudent.groupId} 
                        onChange={e => setEditingStudent({...editingStudent, groupId: e.target.value})}
                    >
                        <option value="">المجموعة</option>
                        {groups.filter(g => !editingStudent.yearId || g.yearId === editingStudent.yearId).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button onClick={handleEditSubmit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">حفظ التعديلات</button>
                    <button onClick={() => setStudentToDelete(editingStudent)} className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100">حذف الطالب</button>
                    <button onClick={() => setEditingStudent(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">إلغاء</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white w-full max-w-md p-8 rounded-[3rem] shadow-2xl relative text-center">
              <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                 ⚠️
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">تأكيد الحذف</h3>
              <p className="text-slate-500 font-bold text-sm mb-8">
                 هل أنت متأكد من حذف الطالب <span className="text-slate-800">"{studentToDelete.name}"</span> نهائياً؟ لا يمكن التراجع عن هذا الإجراء وسيتم حذف جميع بياناته ودرجاته.
              </p>
              
              <div className="flex gap-3">
                 <button 
                    onClick={() => { 
                       onDeleteStudent(studentToDelete.id); 
                       setStudentToDelete(null);
                       setSelectedStudent(null);
                       setEditingStudent(null);
                    }} 
                    className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl hover:bg-rose-700 transition-all"
                 >
                    نعم، احذف الطالب
                 </button>
                 <button 
                    onClick={() => setStudentToDelete(null)} 
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                 >
                    إلغاء
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
