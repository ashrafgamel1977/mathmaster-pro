
import React, { useState } from 'react';
import { Assignment, AssignmentSubmission, Student } from '../types';
import InteractiveBoard from './InteractiveBoard';

interface AssignmentGradingProps {
  submission: AssignmentSubmission;
  student?: Student;
  assignment?: Assignment;
  onGrade: (submissionId: string, grade: number, feedback: string, correctedImg: string) => void;
  onCancel: () => void;
}

const AssignmentGrading: React.FC<AssignmentGradingProps> = ({ 
  submission, 
  student, 
  assignment, 
  onGrade, 
  onCancel 
}) => {
  const [grade, setGrade] = useState<string>(submission.grade?.toString() || '');
  const [feedback, setFeedback] = useState<string>(submission.feedback || '');
  const [annotatedImg, setAnnotatedImg] = useState<string | null>(null);

  const handleFinalSave = (boardDataUrl: string) => {
    if (!grade) {
      alert('يرجى إدخال الدرجة أولاً');
      return;
    }
    onGrade(submission.id, parseInt(grade), feedback, boardDataUrl);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-indigo-950 flex flex-col lg:flex-row overflow-hidden animate-fadeIn">
      {/* Sidebar - Grading Controls */}
      <div className="w-full lg:w-96 bg-white flex flex-col shadow-2xl z-10 border-l border-indigo-100">
        <div className="p-8 bg-indigo-600 text-white text-right">
          <div className="flex justify-between items-start mb-6">
            <button onClick={onCancel} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all">✕</button>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">✍️</div>
          </div>
          <h2 className="text-xl font-black mb-1">تصحيح واجب الطالب</h2>
          <p className="text-indigo-100 text-xs font-bold opacity-80">{student?.name || submission.studentName}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 text-right no-scrollbar" dir="rtl">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">الواجب الأساسي</label>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="font-black text-gray-800 text-sm">{assignment?.title || 'واجب غير محدد'}</p>
              <p className="text-[10px] text-gray-400 mt-1">تاريخ التسليم: {submission.id.substring(0, 8)}</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">الدرجة النهائية (%)</label>
            <div className="relative">
              <input 
                type="number" 
                max="100"
                min="0"
                className="w-full py-6 bg-indigo-50 border-2 border-transparent focus:border-indigo-600 rounded-3xl font-black text-5xl text-center text-indigo-700 outline-none transition-all shadow-inner"
                value={grade}
                onChange={e => setGrade(e.target.value)}
                placeholder="0"
              />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-indigo-200">%</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">ملاحظات المعلم للطلاب</label>
            <textarea 
              className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[2rem] font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none transition-all"
              placeholder="مثال: أحسنت يا بطل، راجع قواعد حساب المثلثات..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            />
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
             <p className="text-[10px] text-amber-700 font-black leading-relaxed">
               💡 استخدم السبورة المجاورة لوضع علامات الصح والخطأ مباشرة على حل الطالب قبل الحفظ.
             </p>
          </div>
        </div>

        <div className="p-8 border-t border-gray-100">
          <button 
            onClick={() => {
              // We trigger the board's save via the child component
              // In this implementation, the board's save button is used as the final step.
              // To make it smoother, we'll instruct the teacher to use the board's save.
              alert('يرجى الضغط على "حفظ العمل" داخل السبورة لاعتماد التعديلات والدرجة.');
            }}
            className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 group"
          >
            <span>اعتماد وحفظ التصحيح</span>
            <span className="group-hover:translate-x-[-4px] transition-transform">✓</span>
          </button>
        </div>
      </div>

      {/* Main Area - Interactive Board */}
      <div className="flex-1 bg-slate-100 relative p-4 lg:p-10">
        <div className="w-full h-full bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border-8 border-white">
          <InteractiveBoard 
            imageUrl={submission.fileUrl}
            onSave={handleFinalSave}
            onCancel={onCancel}
            title={`تصحيح حل: ${student?.name || submission.studentName}`}
          />
        </div>
        
        <div className="absolute top-14 left-14 pointer-events-none hidden md:block">
          <div className="px-6 py-3 bg-indigo-900/80 backdrop-blur-md text-white rounded-2xl font-black text-xs shadow-xl flex items-center gap-3">
             <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
             وضع التصحيح النشط
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentGrading;
