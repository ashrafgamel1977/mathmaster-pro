
import React, { useState, useRef } from 'react';
import { Assignment, Student, Year, AssignmentSubmission, AssignmentAttachment, MathNotation } from '../types';
import AssignmentGrading from '../components/AssignmentGrading';
import InteractiveBoard from '../components/InteractiveBoard';
import MathRenderer from '../components/MathRenderer';

interface AssignmentsViewProps {
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  students: Student[];
  years: Year[];
  teacherName: string;
  notation: MathNotation;
  onAdd: (a: Assignment) => void;
  onDelete: (id: string) => void;
  onGrade: (submissionId: string, grade: number, feedback: string, correctedImg?: string) => void;
}

const AssignmentsView: React.FC<AssignmentsViewProps> = ({ assignments, submissions, students, years, teacherName, notation, onAdd, onDelete, onGrade }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedAsgId, setSelectedAsgId] = useState<string | null>(null);
  const [gradingSub, setGradingSub] = useState<AssignmentSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'link' | 'file' | 'board'>('board');
  const [showBoard, setShowBoard] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const fileTypeInputRef = useRef<HTMLInputElement>(null);
  
  const [newAsg, setNewAsg] = useState<{ 
    title: string; 
    desc: string; 
    dueDate: string; 
    yearId: string; 
    externalLink: string;
    fileUrl: string;
    attachments: AssignmentAttachment[] 
  }>({ 
    title: '', 
    desc: '', 
    dueDate: '', 
    yearId: '',
    externalLink: '',
    fileUrl: '',
    attachments: []
  });

  const handleAdd = () => {
    if (!newAsg.title || !newAsg.yearId) return alert('يرجى إكمال العنوان والصف الدراسي');
    onAdd({
      id: 'asg' + Date.now(),
      title: newAsg.title,
      description: newAsg.desc,
      dueDate: newAsg.dueDate || new Date().toLocaleDateString('ar-EG'),
      yearId: newAsg.yearId,
      type: activeTab,
      externalLink: activeTab === 'link' ? newAsg.externalLink : undefined,
      fileUrl: (activeTab === 'file' || activeTab === 'board') ? newAsg.fileUrl : undefined,
      status: 'active',
      submissions: 0,
      attachments: newAsg.attachments
    });
    setShowAdd(false);
    setNewAsg({ title: '', desc: '', dueDate: '', yearId: '', externalLink: '', fileUrl: '', attachments: [] });
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewAsg(prev => ({
          ...prev,
          attachments: [...prev.attachments, { name: (file as File).name, url: ev.target?.result as string }]
        }));
      };
      reader.readAsDataURL(file as File);
    });
  };

  const handleMainFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewAsg(prev => ({ ...prev, fileUrl: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setNewAsg(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleBoardCapture = (dataUrl: string) => {
    setNewAsg(prev => ({ 
      ...prev, 
      fileUrl: dataUrl,
      desc: prev.desc + (prev.desc ? '\n' : '') + '[رسم توضيحي مرفق من السبورة]'
    }));
    setShowBoard(false);
    alert('تم التقاط الرسم وإلحاقه بالواجب بنجاح ✓');
  };

  const selectedAsg = assignments.find(a => a.id === selectedAsgId);
  const isEnglish = notation === 'english';

  return (
    <div className="space-y-10 animate-slideUp pb-24 max-w-7xl mx-auto text-right" dir="rtl">
      <div className="bg-indigo-950 p-12 rounded-[4rem] shadow-2xl text-white flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-indigo-600/20 blur-[100px] rounded-full"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tight">إدارة الواجبات 📚</h2>
          <p className="text-indigo-200 font-bold mt-2">
            {isEnglish ? 'النمط الإنجليزي مفعل (Math Notation)' : 'النمط العربي مفعل (الرموز العربية)'}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-12 py-5 bg-white text-indigo-950 rounded-[2rem] font-black text-sm shadow-2xl hover:scale-105 transition-transform relative z-10">إضافة واجب ＋</button>
      </div>

      {!selectedAsgId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {assignments.map(asg => (
            <div key={asg.id} onClick={() => setSelectedAsgId(asg.id)} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex flex-col h-full group">
               <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">{years.find(y=>y.id===asg.yearId)?.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(asg.id); }} className="text-rose-300 hover:text-rose-500 transition-colors">🗑️</button>
               </div>
               <h3 className="text-xl font-black text-gray-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{asg.title}</h3>
               <div className="text-xs text-gray-400 font-bold line-clamp-3 mb-6">
                  <MathRenderer content={asg.description} inline />
               </div>
               <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-black">📅 الموعد: {asg.dueDate}</span>
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                     <span className="text-[10px] font-black text-emerald-600">نشط</span>
                  </div>
               </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30 bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
               <span className="text-6xl block mb-4">📚</span>
               <p className="font-black text-lg text-slate-500">لم يتم إضافة أي واجبات بعد</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
           <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
              <button onClick={() => setSelectedAsgId(null)} className="px-6 py-2 bg-gray-100 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all flex items-center gap-2"><span>←</span> رجوع للقائمة</button>
              <div className="text-right">
                <h3 className="text-2xl font-black text-indigo-600">{selectedAsg?.title}</h3>
                <p className="text-[10px] font-black text-gray-400">{years.find(y=>y.id===selectedAsg?.yearId)?.name}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-4">
                    <h4 className="font-black text-gray-800 text-sm underline">محتوى الواجب:</h4>
                    <div className="p-6 bg-gray-50 rounded-2xl text-gray-700 font-bold text-sm leading-relaxed border border-gray-100">
                      <MathRenderer content={selectedAsg?.description || ''} />
                      {selectedAsg?.fileUrl && (
                        <div className="mt-4">
                           <img src={selectedAsg.fileUrl} className="max-h-96 rounded-2xl shadow-lg border" alt="Main content" />
                        </div>
                      )}
                      {selectedAsg?.externalLink && (
                        <div className="mt-4">
                          <a href={selectedAsg.externalLink} target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs shadow-lg">🔗 فتح الرابط الخارجي</a>
                        </div>
                      )}
                    </div>
                 </div>

                 <h4 className="font-black text-gray-500 text-[10px] uppercase tracking-widest px-4">تسليمات الطلاب ({submissions.filter(s=>s.assignmentId===selectedAsgId).length})</h4>
                 <div className="space-y-4">
                    {submissions.filter(s=>s.assignmentId===selectedAsgId).map(sub => (
                       <div key={sub.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                             <img src={students.find(s=>s.id===sub.studentId)?.avatar} className="w-12 h-12 rounded-xl object-cover" alt="" />
                             <div>
                                <p className="font-black text-gray-800">{sub.studentName}</p>
                                <p className={`text-[9px] font-black uppercase ${sub.status === 'graded' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                   {sub.status === 'graded' ? `تم التصحيح (${sub.grade}%)` : 'قيد الانتظار'}
                                </p>
                             </div>
                          </div>
                          <button onClick={() => setGradingSub(sub)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-indigo-100 hover:scale-105 transition-all">
                             {sub.status === 'graded' ? 'مراجعة التصحيح' : 'بدء التصحيح ✍️'}
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowAdd(false)}></div>
          <div className="bg-white w-full max-w-4xl rounded-[4rem] p-10 relative z-10 animate-slideUp overflow-y-auto max-h-[90vh] shadow-2xl no-scrollbar">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
              <h3 className="text-3xl font-black text-gray-800 flex items-center gap-3"><span>🚀</span> إضافة واجب جديد</h3>
              <button onClick={() => setShowAdd(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
            </div>
            
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 px-4 uppercase tracking-widest">عنوان الواجب</label>
                    <input type="text" placeholder="مثال: مسائل على النهايات" className="w-full px-8 py-5 bg-gray-50 rounded-[2rem] font-black outline-none border-2 border-transparent focus:border-indigo-600 shadow-inner" value={newAsg.title} onChange={e => setNewAsg({...newAsg, title: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 px-4 uppercase tracking-widest">الصف الدراسي</label>
                    <select className="w-full px-8 py-5 bg-gray-50 rounded-[2rem] font-black outline-none appearance-none cursor-pointer border-2 border-transparent focus:border-indigo-600 shadow-inner" value={newAsg.yearId} onChange={e => setNewAsg({...newAsg, yearId: e.target.value})}>
                        <option value="">اختر الصف</option>
                        {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 px-4 uppercase tracking-widest">الموعد النهائي للتسليم</label>
                    <input type="date" className="w-full px-8 py-5 bg-gray-50 rounded-[2rem] font-black outline-none border-2 border-transparent focus:border-indigo-600 shadow-inner" value={newAsg.dueDate} onChange={e => setNewAsg({...newAsg, dueDate: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 px-4 uppercase tracking-widest">نوع الواجب</label>
                    <div className="flex bg-gray-100 p-1.5 rounded-[2rem]">
                      {['board', 'file', 'link', 'text'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-3 rounded-2xl text-[9px] font-black transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                          {t === 'board' ? 'سبورة' : t === 'file' ? 'ملف' : t === 'link' ? 'رابط' : 'نص'}
                        </button>
                      ))}
                    </div>
                 </div>
               </div>
               
               <div className="space-y-3">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">وصف الواجب والتفاصيل</label>
                  </div>
                  <textarea 
                    className="w-full p-8 bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-[2.5rem] font-bold text-sm h-40 outline-none shadow-inner resize-none transition-all"
                    placeholder={`اكتب المسائل هنا.. يمكنك استخدام $ $ للرموز الرياضية.`}
                    value={newAsg.desc}
                    onChange={e => setNewAsg({...newAsg, desc: e.target.value})}
                  />
               </div>

               {/* Conditional Inputs based on Tab */}
               <div className="p-8 bg-indigo-50/50 rounded-[3rem] border-2 border-dashed border-indigo-100 animate-fadeIn">
                  {activeTab === 'link' && (
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-indigo-400 px-4 uppercase">الرابط الخارجي (Google Form أو غيره)</label>
                       <input type="url" placeholder="https://..." className="w-full px-8 py-5 bg-white rounded-2xl font-bold border border-indigo-100 outline-none" value={newAsg.externalLink} onChange={e => setNewAsg({...newAsg, externalLink: e.target.value})} />
                    </div>
                  )}
                  {activeTab === 'file' && (
                    <div className="space-y-4 text-center">
                       {newAsg.fileUrl ? (
                         <div className="relative inline-block group">
                           <img src={newAsg.fileUrl} className="max-h-40 rounded-2xl border-4 border-white shadow-xl" alt="Preview" />
                           <button onClick={() => setNewAsg({...newAsg, fileUrl: ''})} className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg">✕</button>
                         </div>
                       ) : (
                         <div className="py-6 cursor-pointer hover:scale-105 transition-all" onClick={() => fileTypeInputRef.current?.click()}>
                           <span className="text-5xl block mb-2">📁</span>
                           <p className="font-black text-indigo-600 text-sm">اضغط لرفع ملف الواجب الأساسي (صورة)</p>
                           <input type="file" ref={fileTypeInputRef} className="hidden" accept="image/*" onChange={handleMainFileUpload} />
                         </div>
                       )}
                    </div>
                  )}
                  {activeTab === 'board' && (
                    <div className="text-center py-4">
                       {newAsg.fileUrl ? (
                          <div className="relative inline-block">
                             <img src={newAsg.fileUrl} className="max-h-40 rounded-2xl border-4 border-white shadow-xl" alt="Board Capture" />
                             <button onClick={() => setNewAsg({...newAsg, fileUrl: ''})} className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg">✕</button>
                          </div>
                       ) : (
                         <button onClick={() => setShowBoard(true)} className="px-10 py-5 bg-amber-500 text-white rounded-[2rem] font-black text-sm shadow-xl flex items-center gap-3 mx-auto hover:bg-amber-600 transition-all">
                           <span>🖋️</span> افتح السبورة لرسم المسألة
                         </button>
                       )}
                    </div>
                  )}
                  {activeTab === 'text' && <p className="text-center text-[10px] font-black text-indigo-300 uppercase">سيتم نشر الواجب كـنص فقط بدون ملفات مرفقة أساسية</p>}
               </div>

               <div className="space-y-4 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                 <div className="flex justify-between items-center px-2">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المرفقات الإضافية (ملفات المساعدة)</h4>
                   <button onClick={() => attachmentInputRef.current?.click()} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black shadow-lg hover:scale-105 transition-all">إرفاق 📎</button>
                   <input type="file" ref={attachmentInputRef} multiple className="hidden" onChange={handleAttachmentUpload} />
                 </div>
                 
                 {newAsg.attachments.length > 0 && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {newAsg.attachments.map((at, idx) => (
                       <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm group">
                         <div className="flex items-center gap-3 overflow-hidden">
                           <span className="text-xl">📄</span>
                           <span className="text-[10px] font-bold text-gray-700 truncate">{at.name}</span>
                         </div>
                         <button onClick={() => removeAttachment(idx)} className="text-rose-400 hover:text-rose-600 px-2 transition-all">✕</button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               <button onClick={handleAdd} className="w-full py-7 bg-indigo-600 text-white font-black rounded-[2.5rem] shadow-2xl text-xl hover:scale-[1.01] transition-transform">بث الواجب لطلابك الآن 🚀</button>
            </div>
          </div>
        </div>
      )}

      {showBoard && (
        <div className="fixed inset-0 z-[600] bg-indigo-950 p-2 md:p-6 flex flex-col animate-fadeIn">
           <div className="flex justify-between items-center mb-4 px-8 text-white">
              <h3 className="font-black text-xl md:text-2xl">سبورة رسم الواجب 🖋️</h3>
              <button onClick={() => setShowBoard(false)} className="w-12 h-12 bg-white/10 hover:bg-rose-600 rounded-2xl flex items-center justify-center text-2xl transition-all">✕</button>
           </div>
           <div className="flex-1 bg-white rounded-[4rem] overflow-hidden shadow-2xl">
              <InteractiveBoard 
                onSave={handleBoardCapture} 
                onCancel={() => setShowBoard(false)} 
                title="رسم محتوى الواجب" 
                initialBackground="grid"
                notation={notation}
              />
           </div>
        </div>
      )}

      {gradingSub && (
        <AssignmentGrading 
          submission={gradingSub}
          student={students.find(s => s.id === gradingSub.studentId)}
          assignment={assignments.find(a => a.id === gradingSub.assignmentId)}
          onGrade={(sid, grade, feedback, correctedImg) => {
            onGrade(sid, grade, feedback, correctedImg);
            setGradingSub(null);
          }}
          onCancel={() => setGradingSub(null)}
        />
      )}
    </div>
  );
};

export default AssignmentsView;
