import React, { useState, useEffect, useRef } from 'react';
import { Assignment, AssignmentSubmission, Student } from '../types';

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
  onCancel,
}) => {
  const [grade, setGrade] = useState<string>(
    submission.grade?.toString() || ''
  );
  const [feedback, setFeedback] = useState<string>(
    submission.feedback || ''
  );
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(submission.audioFeedback || null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                setAudioUrl(reader.result as string);
            };
            // Clean up tracks
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        alert("يرجى السماح بالوصول للميكروفون.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const deleteRecording = () => {
      setAudioUrl(null);
  };

  const handleFinalSave = () => {
    if (!grade) {
      alert('يرجى إدخال الدرجة أولاً');
      return;
    }
    submission.audioFeedback = audioUrl || undefined;
    // Pass empty string for correctedImg since board is removed
    onGrade(submission.id, parseInt(grade), feedback, "");
  };

  return (
    <div className="fixed inset-0 z-[600] bg-slate-100 flex flex-col lg:flex-row-reverse overflow-hidden animate-fadeIn font-['Cairo']" dir="rtl">
      
      {/* Grading Panel (Right Side) */}
      <div className="w-full lg:w-[480px] bg-white h-full shadow-2xl z-20 flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
           <div>
             <h2 className="text-xl font-black text-slate-800">تصحيح الواجب</h2>
             <p className="text-xs font-bold text-slate-400 mt-1">{student?.name || submission.studentName}</p>
           </div>
           <button onClick={onCancel} className="w-10 h-10 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-xl flex items-center justify-center transition-colors">✕</button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           {/* Grade Input - Big and Clear */}
           <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">الدرجة المستحقة</label>
              <div className="flex items-center gap-4">
                 <div className="relative flex-1">
                    <input 
                      type="number" 
                      value={grade} 
                      onChange={e => setGrade(e.target.value)}
                      className="w-full h-20 bg-indigo-50 rounded-3xl text-center text-5xl font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                      placeholder="00"
                      max={100}
                      min={0}
                    />
                    <span className="absolute top-1/2 left-6 -translate-y-1/2 text-indigo-300 font-black text-xl">%</span>
                 </div>
                 {/* Quick Presets */}
                 <div className="flex flex-col gap-2">
                    <button onClick={() => setGrade('100')} className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black hover:bg-emerald-200">100%</button>
                    <button onClick={() => setGrade('50')} className="px-3 py-2 bg-amber-100 text-amber-700 rounded-xl text-xs font-black hover:bg-amber-200">50%</button>
                 </div>
              </div>
           </div>

           {/* Feedback */}
           <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase">ملاحظات المعلم</label>
              <textarea 
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                className="w-full h-32 bg-slate-50 rounded-3xl p-5 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="اكتب ملاحظاتك هنا..."
              />
              {/* Audio Recorder */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                {!audioUrl ? (
                    !isRecording ? (
                        <button onClick={startRecording} className="w-full py-3 bg-blue-100 text-blue-600 rounded-xl font-black text-xs hover:bg-blue-200 transition-all flex items-center justify-center gap-2">
                            <span>🎙️</span> تسجيل ملاحظة صوتية
                        </button>
                    ) : (
                        <button onClick={stopRecording} className="w-full py-3 bg-rose-100 text-rose-600 rounded-xl font-black text-xs hover:bg-rose-200 transition-all animate-pulse">
                            ⏹ إيقاف التسجيل
                        </button>
                    )
                ) : (
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
                        <audio src={audioUrl} controls className="flex-1 h-8" />
                        <button onClick={deleteRecording} className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-100">🗑️</button>
                    </div>
                )}
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50">
           <button onClick={handleFinalSave} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]">
             <span>حفظ وإرسال النتيجة</span>
             <span>🚀</span>
           </button>
        </div>
      </div>

      {/* Submission View (Left Side) */}
      <div className="flex-1 bg-slate-200 relative flex flex-col overflow-hidden items-center justify-center p-8">
         <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border-4 border-white max-h-full max-w-full">
            {submission.fileUrl ? (
                <img src={submission.fileUrl} alt="Submission" className="max-w-full max-h-full object-contain" />
            ) : (
                <div className="p-10 text-center text-slate-400 font-bold">لا يوجد ملف مرفق</div>
            )}
         </div>
      </div>

    </div>
  );
};

export default AssignmentGrading;