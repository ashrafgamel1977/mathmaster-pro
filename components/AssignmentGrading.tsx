
import React, { useState, useEffect, useRef } from 'react';
import { Assignment, AssignmentSubmission, Student } from '../types';
import InteractiveBoard from './InteractiveBoard';

interface AssignmentGradingProps {
  submission: AssignmentSubmission;
  student?: Student;
  assignment?: Assignment;
  onGrade: (submissionId: string, grade: number, feedback: string, correctedImg: string) => void; // Keeps original signature but we will inject audio into parent
  onCancel: () => void;
  aiParams?: { grade: number, feedback: string } | null;
}

const AssignmentGrading: React.FC<AssignmentGradingProps> = ({ 
  submission, 
  student, 
  assignment, 
  onGrade, 
  onCancel,
  aiParams 
}) => {
  const [grade, setGrade] = useState<string>(
    aiParams?.grade?.toString() || submission.grade?.toString() || ''
  );
  const [feedback, setFeedback] = useState<string>(
    aiParams?.feedback || submission.feedback || ''
  );
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(submission.audioFeedback || null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (aiParams) {
        if (aiParams.grade !== undefined) setGrade(aiParams.grade.toString());
        if (aiParams.feedback) setFeedback(aiParams.feedback);
    }
  }, [aiParams]);

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

  const handleFinalSave = (boardDataUrl: string) => {
    if (!grade) {
      alert('يرجى إدخال الدرجة أولاً');
      return;
    }
    // We append the audio URL to the submission object in parent by passing it somehow.
    // Since onGrade signature is fixed in the interface, we usually update the parent.
    // However, here we will attach the audio to the submission object temporarily
    // OR we assume the parent handles `submission` object update.
    // For this specific architecture, let's inject it into the submission object reference directly 
    // or rely on a hacked `feedback` string if backend doesn't support it yet?
    // BETTER: The parent `AssignmentsView` should update the submission including audio.
    // But `onGrade` only takes specific args.
    // Let's modify the parent `onGrade` logic to accept the whole submission update or modify the submission object before calling onGrade.
    
    // Quick Fix: Modifying the submission object directly in memory before passing up 
    // (This works because objects are passed by reference in JS/React props usually, 
    // but cleaner is to update `onGrade` in parent. For now, let's update submission ref)
    submission.audioFeedback = audioUrl || undefined;
    
    onGrade(submission.id, parseInt(grade), feedback, boardDataUrl);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-indigo-950 flex flex-col lg:flex-row overflow-hidden animate-fadeIn">
      {/* Sidebar - Grading Controls */}
      <div className="w-full lg:w-96 bg-white flex flex-col shadow-2xl z-10 border-l border-indigo-100">
        <div className="p-8 bg-indigo-600 text-white text-right">
          <div className="flex justify-between items-start mb-6">
            <button onClick={onCancel} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all">✕</button>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                {aiParams ? '🤖' : '✍️'}
            </div>
          </div>
          <h2 className="text-xl font-black mb-1">{aiParams ? 'مراجعة التصحيح الذكي' : 'تصحيح واجب الطالب'}</h2>
          <p className="text-indigo-100 text-xs font-bold opacity-80">{student?.name || submission.studentName}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 text-right no-scrollbar" dir="rtl">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">الدرجة النهائية (%)</label>
            <div className="relative">
              <input 
                type="number" 
                max="100"
                min="0"
                className={`w-full py-6 border-2 focus:border-indigo-600 rounded-3xl font-black text-5xl text-center text-indigo-700 outline-none transition-all shadow-inner ${aiParams ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-transparent'}`}
                value={grade}
                onChange={e => setGrade(e.target.value)}
                placeholder="0"
              />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-indigo-200">%</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">ملاحظات صوتية 🎙️</label>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                {!audioUrl ? (
                    !isRecording ? (
                        <button onClick={startRecording} className="w-16 h-16 bg-rose-500 rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform mx-auto">
                            🎙️
                        </button>
                    ) : (
                        <button onClick={stopRecording} className="w-16 h-16 bg-white border-4 border-rose-500 rounded-full shadow-lg flex items-center justify-center animate-pulse mx-auto">
                            <div className="w-6 h-6 bg-rose-500 rounded"></div>
                        </button>
                    )
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <audio src={audioUrl} controls className="w-full h-8" />
                        <button onClick={deleteRecording} className="text-xs text-rose-500 font-bold hover:underline">حذف التسجيل 🗑️</button>
                    </div>
                )}
                <p className="text-[10px] text-slate-400 mt-2 font-bold">{isRecording ? 'جاري التسجيل...' : audioUrl ? 'تم تسجيل الملاحظة' : 'اضغط للتسجيل'}</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">ملاحظات نصية</label>
            <textarea 
              className={`w-full p-5 border rounded-[2rem] font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none transition-all ${aiParams ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}
              placeholder="مثال: أحسنت يا بطل..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
            />
          </div>
        </div>

        <div className="p-8 border-t border-gray-100">
          <button 
            onClick={() => {
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
      </div>
    </div>
  );
};

export default AssignmentGrading;
