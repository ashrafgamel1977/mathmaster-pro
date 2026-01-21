
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, Group, Year, AppNotification, AssignmentSubmission, QuizResult } from '../types';
import AttendanceScanner from './AttendanceScanner';
import { generateParentReport } from '../services/geminiService';

interface StudentListProps {
  students: Student[];
  groups: Group[];
  years: Year[];
  notifications: AppNotification[];
  submissions?: AssignmentSubmission[];
  results?: QuizResult[];
  onAttendanceChange: (id: string) => void;
  onSendAlert: (student: Student, message: string, channel: 'whatsapp' | 'sms' | 'call') => void;
  onDeleteStudent: (id: string) => void;
  onResetDevice: (id: string) => void;
  onAddStudent: (data: any) => void;
  onUpdateStudent?: (id: string, updates: Partial<Student>) => void;
  teacherName: string;
}

const ITEMS_PER_PAGE = 50; 

const StudentList: React.FC<StudentListProps> = ({ 
  students, groups, years, notifications, submissions = [], results = [],
  onAttendanceChange, onSendAlert, onDeleteStudent, onResetDevice, onAddStudent, onUpdateStudent, teacherName 
}) => {
  // --- UI State ---
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'score'>('name');
  
  // --- Filter State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'unpaid' | 'report_needed'>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  
  // --- Modal States ---
  const [showScanner, setShowScanner] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Report Generation Modal (Enhanced for Bulk)
  const [reportModal, setReportModal] = useState<{ 
    isOpen: boolean; 
    targetStudents: Student[]; // Changed from single student to array
    currentIndex: number;      // To track progress in bulk mode
    content: string; 
    isLoading: boolean;
    period: 'weekly' | 'monthly' | 'absence';
  }>({
    isOpen: false, targetStudents: [], currentIndex: 0, content: '', isLoading: false, period: 'weekly'
  });

  // --- Bulk Action State ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // --- Import State ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  // --- Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  
  // --- New Student Form ---
  const [newStudent, setNewStudent] = useState({
    name: '', phone: '', parentPhone: '', yearId: '', groupId: '', code: ''
  });

  // --- Computed Data ---
  const filteredStudents = useMemo(() => {
    let result = students.filter(student => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = student.name.toLowerCase().includes(searchLower) || 
                            student.studentCode.toLowerCase().includes(searchLower) ||
                            student.studentPhone.includes(searchLower);
      
      let matchesStatus = true;
      if (filterStatus === 'present') matchesStatus = student.attendance;
      else if (filterStatus === 'absent') matchesStatus = !student.attendance;
      else if (filterStatus === 'unpaid') matchesStatus = !student.isPaid;
      else if (filterStatus === 'report_needed') {
         if (!student.lastReportDate) matchesStatus = true;
         else {
            const diff = new Date().getTime() - new Date(student.lastReportDate).getTime();
            matchesStatus = diff > (14 * 24 * 60 * 60 * 1000); // 2 weeks
         }
      }
      
      const matchesGroup = filterGroup === 'all' ? true : student.groupId === filterGroup;
      
      return matchesSearch && matchesStatus && matchesGroup;
    });

    // Sorting
    result.sort((a, b) => {
        if (sortBy === 'points') return (b.points || 0) - (a.points || 0);
        if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
        return a.name.localeCompare(b.name);
    });

    return result;
  }, [students, searchQuery, filterStatus, filterGroup, sortBy]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const currentStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats for Dashboard
  const stats = useMemo(() => {
      const presentCount = students.filter(s => s.attendance).length;
      const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;
      const totalPoints = students.reduce((acc, s) => acc + (s.points || 0), 0);
      return { presentCount, attendanceRate, totalPoints };
  }, [students]);

  // --- Handlers ---

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterGroup]);

  // Auto-Select All Logic for quick bulk actions
  const selectAllFiltered = () => {
      if (selectedIds.length === filteredStudents.length) setSelectedIds([]);
      else {
          setSelectedIds(filteredStudents.map(s => s.id));
          setIsSelectionMode(true);
      }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = (action: 'attendance' | 'points' | 'delete' | 'reset_payment' | 'report', value?: any) => {
    if (selectedIds.length === 0) return alert('يرجى تحديد طلاب أولاً');
    
    if (action === 'delete') {
        if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} طالب؟`)) return;
        selectedIds.forEach(id => onDeleteStudent(id));
    } else if (action === 'attendance') {
        if (!onUpdateStudent) return;
        selectedIds.forEach(id => onUpdateStudent(id, { attendance: value }));
    } else if (action === 'points') {
        if (!onUpdateStudent) return;
        selectedIds.forEach(id => {
            const s = students.find(st => st.id === id);
            if (s) onUpdateStudent(id, { points: (s.points || 0) + value });
        });
    } else if (action === 'reset_payment') {
        if (!onUpdateStudent) return;
        selectedIds.forEach(id => onUpdateStudent(id, { isPaid: false }));
    } else if (action === 'report') {
        // Prepare Bulk Report Mode
        const selectedStudents = students.filter(s => selectedIds.includes(s.id));
        setReportModal({ 
            isOpen: true, 
            targetStudents: selectedStudents, 
            currentIndex: 0, 
            content: '', 
            isLoading: false, 
            period: 'weekly' // Default
        });
    }
    
    if (action !== 'report') {
        setSelectedIds([]);
        setIsSelectionMode(false);
        alert('تم تنفيذ العملية بنجاح ✅');
    }
  };

  // --- Send Login Info (New Feature) ---
  const sendLoginInfo = (student: Student) => {
      const msg = `مرحباً ${student.name.split(' ')[0]} 👋\n\nإليك بيانات الدخول الخاصة بك لمنصة ${teacherName}:\n🔑 الكود: ${student.studentCode}\n\nاحتفظ بهذا الكود جيداً للدخول للمنصة وحل الواجبات.\nبالتوفيق!`;
      const phone = student.studentPhone.startsWith('0') ? `2${student.studentPhone}` : student.studentPhone;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
  };

  // --- Comprehensive Report Logic (Weekly/Monthly/Absence) ---
  const initReport = (student: Student) => {
      setReportModal({ 
          isOpen: true, 
          targetStudents: [student], 
          currentIndex: 0,
          content: '', 
          isLoading: false, 
          period: 'weekly' 
      });
  };

  // Triggered when period changes OR when skipping to next student in bulk mode
  useEffect(() => {
      if (reportModal.isOpen && reportModal.targetStudents.length > 0) {
          generateReportForCurrentStudent();
      }
  }, [reportModal.period, reportModal.currentIndex, reportModal.isOpen]);

  const generateReportForCurrentStudent = async () => {
    const student = reportModal.targetStudents[reportModal.currentIndex];
    if (!student) return;

    // --- UPDATE: Instant Template for Absence (No AI) ---
    if (reportModal.period === 'absence') {
        // Direct template for maximum speed
        const message = `السيد ولي أمر الطالب/ ${student.name} المحترم،\nنود إفادتكم بتغيب الطالب عن حضور حصة الرياضيات اليوم.\nيرجى المتابعة وتوضيح السبب للأهمية.\n\nإدارة أ. ${teacherName}`;
        
        setReportModal(prev => ({ 
            ...prev, 
            isLoading: false, 
            content: message 
        }));
        return;
    }
    // ----------------------------------------------------

    setReportModal(prev => ({ ...prev, isLoading: true, content: '' }));

    // 1. Determine Date Range
    const { period } = reportModal;
    const now = new Date();
    const pastDate = new Date();
    if (period === 'weekly') pastDate.setDate(now.getDate() - 7);
    else pastDate.setDate(now.getDate() - 30);

    // 2. Filter Activity (Assignments & Quizzes)
    const userSubmissions = submissions.filter(s => s.studentId === student.id);
    const userResults = results.filter(r => r.studentId === student.id);
    
    // For Logic: take recent N items
    const relevantItems = period === 'weekly' 
        ? [...userSubmissions.slice(-2), ...userResults.slice(-1)] 
        : [...userSubmissions.slice(-5), ...userResults.slice(-3)];

    const taskCount = relevantItems.length;
    
    // Calculate Average Score
    let totalScore = 0;
    let count = 0;
    userResults.slice(period === 'weekly' ? -1 : -3).forEach(r => { totalScore += r.score; count++; });
    userSubmissions.slice(period === 'weekly' ? -2 : -5).forEach(s => { if (s.grade) { totalScore += s.grade; count++; } });

    const avgScore = count > 0 ? Math.round(totalScore / count) : 0;
    const attendanceCount = student.attendance ? 1 : (student.streaks > 0 ? 1 : 0);

    try {
        const reportText = await generateParentReport(
            student.name,
            taskCount,
            avgScore,
            !!student.isPaid,
            teacherName,
            period === 'weekly' ? 'أسبوعي' : 'شهري', // Only weekly/monthly go to AI
            attendanceCount
        );
        setReportModal(prev => ({ ...prev, content: reportText, isLoading: false }));
    } catch (error) {
        setReportModal(prev => ({ ...prev, content: "تعذر توليد التقرير تلقائياً.", isLoading: false }));
    }
  };

  const sendReportAndNext = () => {
      const student = reportModal.targetStudents[reportModal.currentIndex];
      if (!student || !reportModal.content) return;
      
      const phone = student.parentPhone.startsWith('0') ? `2${student.parentPhone}` : student.parentPhone;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(reportModal.content)}`;
      window.open(url, '_blank');
      
      // Update last report date
      if(onUpdateStudent) {
          onUpdateStudent(student.id, { lastReportDate: new Date().toISOString() });
      }

      // Move to next student or close
      if (reportModal.currentIndex < reportModal.targetStudents.length - 1) {
          setReportModal(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      } else {
          // Finished
          setReportModal(prev => ({ ...prev, isOpen: false }));
          setSelectedIds([]); // Clear selection after finish
          setIsSelectionMode(false);
          // Optional alert removed to speed up workflow
      }
  };

  const skipCurrentStudent = () => {
      if (reportModal.currentIndex < reportModal.targetStudents.length - 1) {
          setReportModal(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
      } else {
          setReportModal(prev => ({ ...prev, isOpen: false }));
      }
  };

  const handleAddSubmit = () => {
    if (!newStudent.name || !newStudent.phone || !newStudent.yearId) return alert('يرجى إكمال البيانات الأساسية');
    onAddStudent({
      id: 's' + Date.now(),
      name: newStudent.name,
      studentPhone: newStudent.phone,
      parentPhone: newStudent.parentPhone,
      yearId: newStudent.yearId,
      groupId: newStudent.groupId,
      studentCode: newStudent.code || 'M' + Math.floor(1000 + Math.random() * 9000),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newStudent.name}`,
      points: 0, score: 0, attendance: false, scoreHistory: [], status: 'active', badges: [], streaks: 0, deviceIds: []
    });
    setShowAddModal(false);
    setNewStudent({ name: '', phone: '', parentPhone: '', yearId: '', groupId: '', code: '' });
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const rows = text.split('\n').filter(row => row.trim().length > 0);
          let successCount = 0;
          for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',').map(c => c.trim().replace(/"/g, ''));
            if (cols.length >= 2) {
               const name = cols[0];
               const phone = cols[1];
               if (name && phone) {
                 onAddStudent({
                    id: 's' + Date.now() + Math.random(),
                    name: name,
                    studentPhone: phone,
                    parentPhone: cols[2] || '',
                    yearId: years[0]?.id || 'unknown',
                    groupId: '',
                    studentCode: 'M' + Math.floor(1000 + Math.random() * 9000),
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                    points: 0, score: 0, attendance: false, scoreHistory: [], status: 'active', badges: [], streaks: 0, deviceIds: []
                 });
                 successCount++;
               }
            }
          }
          alert(`تم استيراد ${successCount} طالب بنجاح!`);
        } catch (err) { alert('خطأ في الملف'); } finally { setIsImporting(false); }
      };
      reader.readAsText(file);
  };

  const currentReportStudent = reportModal.targetStudents[reportModal.currentIndex];

  return (
    <div className="space-y-6 animate-fadeIn pb-32 text-right max-w-[1600px] mx-auto px-4" dir="rtl">
      
      {/* 1. Top Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-1">إجمالي الطلاب</p>
               <h3 className="text-4xl font-black">{students.length}</h3>
               <p className="text-[10px] mt-2 font-bold opacity-80">طالب مسجل في النظام</p>
            </div>
            <div className="absolute -right-4 -bottom-4 text-8xl opacity-10">👥</div>
         </div>
         
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
               <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">حضور اليوم</p>
               <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-slate-800">{stats.presentCount}</h3>
                  <span className={`text-sm font-black ${stats.attendanceRate > 75 ? 'text-emerald-500' : 'text-rose-500'}`}>({stats.attendanceRate}%)</span>
               </div>
               <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${stats.attendanceRate > 75 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{width: `${stats.attendanceRate}%`}}></div>
               </div>
            </div>
         </div>

         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
             <div>
               <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">إجمالي النقاط الموزعة</p>
               <h3 className="text-4xl font-black text-amber-500">{stats.totalPoints.toLocaleString()}</h3>
             </div>
             <button onClick={() => setShowAddModal(true)} className="mt-4 w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:scale-105 transition-all flex items-center justify-center gap-2">
                <span>إضافة طالب جديد</span>
                <span className="text-lg">＋</span>
             </button>
         </div>
      </div>

      {/* 2. Control Toolbar */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-40">
         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
               <input 
                 type="text" 
                 placeholder="بحث سريع (اسم، كود، هاتف)..." 
                 className="w-full pl-4 pr-12 py-3 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
               <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`} title="عرض البطاقات">
                  <span className="text-lg">🗂️</span>
               </button>
               <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`} title="عرض الجدول">
                  <span className="text-lg">📄</span>
               </button>
            </div>
         </div>

         <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0">
            <select className="px-4 py-3 bg-slate-50 rounded-xl font-bold text-xs outline-none cursor-pointer hover:bg-slate-100" value={filterGroup} onChange={e => setFilterGroup(e.target.value)}>
               <option value="all">كل المجموعات</option>
               {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <select className="px-4 py-3 bg-slate-50 rounded-xl font-bold text-xs outline-none cursor-pointer hover:bg-slate-100" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
               <option value="all">الكل</option>
               <option value="present">حضور اليوم</option>
               <option value="absent">غائبون</option>
               <option value="unpaid">عليهم مديونية</option>
            </select>
            <button onClick={() => setShowScanner(true)} className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs hover:bg-indigo-100 transition-all whitespace-nowrap flex items-center gap-2">
               <span>ماسح الكود</span> 📸
            </button>
            <button 
                onClick={() => {
                    if (isSelectionMode) { setIsSelectionMode(false); setSelectedIds([]); }
                    else selectAllFiltered();
                }} 
                className={`px-4 py-3 rounded-xl font-black text-xs transition-all whitespace-nowrap border ${isSelectionMode ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-500 border-slate-200'}`}
            >
               {isSelectionMode ? `إلغاء (${selectedIds.length})` : 'تحديد الكل'}
            </button>
         </div>
      </div>

      {/* 3. Main Content Area */}
      
      {/* --- TABLE VIEW --- */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-right">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                       {isSelectionMode && <th className="px-6 py-4 w-10"><input type="checkbox" onChange={() => { if(selectedIds.length===filteredStudents.length) setSelectedIds([]); else setSelectedIds(filteredStudents.map(s=>s.id)); }} checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0} className="w-4 h-4 accent-indigo-600" /></th>}
                       <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">الطالب</th>
                       <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">المجموعة</th>
                       <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-center">النقاط</th>
                       <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-center">الحضور اليوم</th>
                       <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-center">الدفع</th>
                       <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">إجراءات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {currentStudents.map(student => (
                       <tr key={student.id} className={`hover:bg-slate-50/50 transition-colors ${selectedIds.includes(student.id) ? 'bg-indigo-50/30' : ''}`}>
                          {isSelectionMode && <td className="px-6 py-4"><input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleSelection(student.id)} className="w-4 h-4 accent-indigo-600" /></td>}
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <img src={student.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                                <div>
                                   <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                                   <p className="text-[10px] text-slate-400 font-mono">{student.studentCode}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">
                                {groups.find(g => g.id === student.groupId)?.name || 'عام'}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-center font-black text-amber-500">{student.points}</td>
                          <td className="px-6 py-4 text-center">
                             <button 
                               onClick={() => onAttendanceChange(student.id)}
                               className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all mx-auto ${student.attendance ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                             >
                                {student.attendance ? '✔' : '✖'}
                             </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <button 
                               onClick={() => onUpdateStudent?.(student.id, { isPaid: !student.isPaid })}
                               className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${student.isPaid ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}
                             >
                                {student.isPaid ? 'تم الدفع' : 'مديونية'}
                             </button>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex gap-2">
                                <button onClick={() => setDeleteId(student.id)} className="w-8 h-8 bg-white border border-slate-200 text-rose-400 rounded-lg flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-all">🗑️</button>
                                <button onClick={() => initReport(student)} className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-all" title="تقرير دوري">📄</button>
                                <button onClick={() => sendLoginInfo(student)} className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-100 transition-all" title="إرسال بيانات الدخول">📤</button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* --- GRID VIEW --- */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
           {currentStudents.map(student => {
              const isSelected = selectedIds.includes(student.id);
              return (
                 <div 
                   key={student.id} 
                   className={`bg-white p-5 rounded-2xl border transition-all duration-200 relative group ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'}`}
                   onClick={() => isSelectionMode && toggleSelection(student.id)}
                 >
                    {/* Selection Checkbox */}
                    {isSelectionMode && (
                        <div className={`absolute top-3 left-3 w-5 h-5 rounded-md border flex items-center justify-center z-10 transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                           {isSelected && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4">
                       <div className="relative shrink-0">
                           <img src={student.avatar} className="w-12 h-12 rounded-full object-cover border border-slate-100 bg-slate-50" alt="" />
                           <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${student.attendance ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                       </div>
                       <div className="overflow-hidden">
                          <h4 className="font-bold text-slate-800 text-sm truncate" title={student.name}>{student.name}</h4>
                          <p className="text-xs text-slate-500 font-mono mt-0.5 tracking-wide">{student.studentCode}</p>
                       </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between px-1 mb-4">
                       <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                          <span className="text-amber-500 text-xs">⭐</span>
                          <span className="text-xs font-bold text-amber-700">{student.points}</span>
                       </div>
                       <div className="w-px h-4 bg-slate-100"></div>
                       <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">آخر درجة:</span>
                          <span className="text-xs font-bold text-slate-700">{student.scoreHistory?.[student.scoreHistory.length-1] || 0}%</span>
                       </div>
                    </div>

                    {/* Actions Row 1 */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                       <button onClick={(e) => { e.stopPropagation(); onAttendanceChange(student.id); }} className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-2 ${student.attendance ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${student.attendance ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {student.attendance ? 'حاضر' : 'غائب'}
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); onUpdateStudent?.(student.id, { isPaid: !student.isPaid }); }} className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all border flex items-center justify-center gap-2 ${student.isPaid ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                          <span>{student.isPaid ? '💰' : '💸'}</span>
                          {student.isPaid ? 'مدفوع' : 'مديونية'}
                       </button>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                       <button 
                         onClick={(e) => { e.stopPropagation(); sendLoginInfo(student); }}
                         className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors text-xs font-black px-2 py-1 hover:bg-emerald-50 rounded-lg"
                         title="إرسال بيانات الدخول واتساب"
                       >
                          <span className="text-lg">📤</span> إرسال الكود
                       </button>
                       
                       <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); initReport(student); }} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="تقرير شامل">
                             📄
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onResetDevice(student.id); }} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="تصفير الجهاز">
                             📱
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteId(student.id); }} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="حذف">
                             🗑️
                          </button>
                       </div>
                    </div>
                 </div>
              );
           })}
        </div>
      )}

      {/* 4. Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
         <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-3 px-6 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-slideUp border border-white/10 w-[95%] max-w-3xl justify-between flex-wrap">
            <div className="flex items-center gap-3">
               <span className="bg-indigo-600 px-3 py-1 rounded-full text-xs font-bold">{selectedIds.length}</span>
               <span className="text-xs font-medium text-slate-300">طالب محدد</span>
            </div>
            <div className="flex gap-2">
               <button onClick={() => handleBulkAction('attendance', true)} className="p-2 hover:bg-white/10 rounded-full text-emerald-400" title="تسجيل حضور للكل">✔</button>
               <button onClick={() => handleBulkAction('attendance', false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400" title="تسجيل غياب للكل">✖</button>
               <button onClick={() => handleBulkAction('points', 10)} className="p-2 hover:bg-white/10 rounded-full text-amber-400" title="مكافأة 10 نقاط">🎁</button>
               <div className="w-px h-6 bg-white/20 mx-1"></div>
               
               {/* Enhanced Bulk Report Button */}
               <button 
                 onClick={() => handleBulkAction('report')}
                 className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-500 transition-colors shadow-lg"
               >
                 <span>📢</span>
                 <span>إرسال تقارير</span>
               </button>

               <div className="w-px h-6 bg-white/20 mx-1"></div>
               <button onClick={() => handleBulkAction('delete')} className="p-2 hover:bg-rose-500/20 rounded-full text-rose-400" title="حذف المحدد">🗑️</button>
            </div>
         </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
           {Array.from({length: totalPages}).map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {i + 1}
              </button>
           ))}
        </div>
      )}

      {/* --- Modals --- */}
      
      {/* Enhanced Report Generation Modal */}
      {reportModal.isOpen && currentReportStudent && (
          <div className="fixed inset-0 z-[3000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
              <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                      <div>
                          <h3 className="text-xl font-black text-slate-800">
                             {reportModal.targetStudents.length > 1 ? `إرسال جماعي (${reportModal.currentIndex + 1}/${reportModal.targetStudents.length})` : 'تقرير ولي الأمر 📄'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                             <img src={currentReportStudent.avatar} className="w-6 h-6 rounded-full" alt="" />
                             <p className="text-slate-500 font-bold text-sm">{currentReportStudent.name}</p>
                          </div>
                      </div>
                      <button onClick={() => setReportModal({ ...reportModal, isOpen: false })} className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-rose-500 flex items-center justify-center shadow-sm">✕</button>
                  </div>
                  
                  <div className="p-8 space-y-6">
                      {/* Controls for Bulk Sending */}
                      {reportModal.targetStudents.length > 1 && (
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                              <div 
                                className="h-full bg-indigo-600 transition-all duration-500"
                                style={{ width: `${((reportModal.currentIndex + 1) / reportModal.targetStudents.length) * 100}%` }}
                              ></div>
                          </div>
                      )}

                      {/* Period Selection */}
                      {!reportModal.isLoading && (
                          <div className="flex bg-slate-100 p-1.5 rounded-2xl flex-wrap gap-1">
                              <button 
                                onClick={() => setReportModal({...reportModal, period: 'weekly'})}
                                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${reportModal.period === 'weekly' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                              >
                                تقرير أسبوعي 📅
                              </button>
                              <button 
                                onClick={() => setReportModal({...reportModal, period: 'monthly'})}
                                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${reportModal.period === 'monthly' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                              >
                                تقرير شهري 🗓️
                              </button>
                              <button 
                                onClick={() => setReportModal({...reportModal, period: 'absence'})}
                                className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${reportModal.period === 'absence' ? 'bg-rose-50 text-rose-600 shadow border border-rose-100' : 'text-slate-500'}`}
                              >
                                تنبيه غياب ⚠️
                              </button>
                          </div>
                      )}

                      {reportModal.isLoading ? (
                          <div className="py-12 text-center">
                              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-indigo-600 font-bold text-sm">جاري صياغة الرسالة للطالب {currentReportStudent.name.split(' ')[0]}...</p>
                          </div>
                      ) : (
                          <>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نص الرسالة المقترح</label>
                                  <textarea 
                                      className="w-full p-4 bg-slate-50 rounded-2xl font-medium text-sm text-slate-700 min-h-[150px] outline-none focus:ring-2 focus:ring-indigo-500"
                                      value={reportModal.content}
                                      onChange={(e) => setReportModal(prev => ({ ...prev, content: e.target.value }))}
                                  />
                              </div>

                              <div className="flex gap-3">
                                  {reportModal.targetStudents.length > 1 && (
                                      <button 
                                        onClick={skipCurrentStudent}
                                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                                      >
                                        تخطي ⏩
                                      </button>
                                  )}
                                  <button 
                                      onClick={sendReportAndNext}
                                      className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                  >
                                      <span>{reportModal.targetStudents.length > 1 ? 'إرسال والتالي' : 'إرسال واتساب'}</span>
                                      <span>🚀</span>
                                  </button>
                              </div>
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
         <div className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl animate-scaleIn">
               <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">🗑️</div>
               <h3 className="text-xl font-black text-slate-800 mb-2">تأكيد الحذف</h3>
               <p className="text-slate-500 text-sm font-medium mb-6">هل أنت متأكد من حذف هذا الطالب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
               <div className="flex gap-3">
                  <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">إلغاء</button>
                  <button onClick={() => { onDeleteStudent(deleteId); setDeleteId(null); }} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-200">نعم، احذف</button>
               </div>
            </div>
         </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl animate-slideUp">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-black text-slate-800">إضافة طالب جديد</h3>
                 <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors">✕</button>
              </div>
              <div className="space-y-4">
                 <input type="text" placeholder="اسم الطالب" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                 <div className="grid grid-cols-2 gap-4">
                    <input type="tel" placeholder="رقم الطالب" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
                    <input type="tel" placeholder="رقم ولي الأمر" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none cursor-pointer" value={newStudent.yearId} onChange={e => setNewStudent({...newStudent, yearId: e.target.value})}>
                       <option value="">الصف الدراسي</option>
                       {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                    <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none cursor-pointer" value={newStudent.groupId} onChange={e => setNewStudent({...newStudent, groupId: e.target.value})}>
                       <option value="">المجموعة (اختياري)</option>
                       {groups.filter(g => !newStudent.yearId || g.yearId === newStudent.yearId).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                 </div>
                 <input type="text" placeholder="كود الطالب (اختياري)" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={newStudent.code} onChange={e => setNewStudent({...newStudent, code: e.target.value})} />
                 
                 {/* Import Option */}
                 <div className="py-4 border-t border-slate-50 mt-2">
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                       <span>📥</span> <span>أو استيراد من ملف Excel/CSV</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleCSVImport} />
                 </div>

                 <button onClick={handleAddSubmit} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-all">حفظ وإضافة ✓</button>
              </div>
           </div>
        </div>
      )}

      {/* Scanner */}
      {showScanner && (
        <AttendanceScanner 
          students={students}
          onScan={(s) => {
             // Just navigate or focus on the student in list, or mark attendance
             // For comprehensive report, we can't do it automatically here without user confirmation
             // But we can mark attendance.
             if(!s.attendance) {
                 onAttendanceChange(s.id);
                 if(onUpdateStudent) onUpdateStudent(s.id, { points: (s.points||0)+10 });
             }
             // Optionally open report modal if requested feature expanded later
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default StudentList;
