import React, { useState, useCallback, useRef } from 'react';
import { Assignment, AssignmentSubmission, PlatformSettings } from '../../types';
import { FileText, CheckCircle2, Upload, X, Image, File, AlertCircle } from 'lucide-react';
import { usePortalTheme } from '../../hooks/usePortalTheme';

interface AssignmentsTabProps {
    filteredAssignments: Assignment[];
    submissions: AssignmentSubmission[];
    onAssignmentSubmit: (submission: Omit<AssignmentSubmission, 'id' | 'status'>) => void;
    student: { id: string; name: string };
    setScannedAsgId: (id: string) => void;
    setShowScanner: (v: boolean) => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
    settings: PlatformSettings;
    isDark?: boolean;
}

// ─── Upload Preview Item ──────────────────────────────────────────────────────
interface UploadFile {
    id: string;
    name: string;
    type: string;
    size: number;
    dataUrl: string;
    progress: number;
    done: boolean;
}

// ─── Drag & Drop Modal ────────────────────────────────────────────────────────
const AssignmentUploadModal: React.FC<{
    assignment: Assignment;
    cardClass: string;
    buttonClass: string;
    textClass: string;
    bgClass: string;
    onClose: () => void;
    onSubmit: (fileUrl: string) => void;
}> = ({ assignment, cardClass, buttonClass, textClass, bgClass, onClose, onSubmit }) => {
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const ALLOWED = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/zip', 'application/pdf'];

    const processFiles = useCallback((fileList: FileList) => {
        Array.from(fileList).forEach(file => {
            if (!ALLOWED.includes(file.type)) return;
            const reader = new FileReader();
            const id = crypto.randomUUID();
            reader.onload = (ev) => {
                const dataUrl = ev.target?.result as string;
                const newFile: UploadFile = { id, name: file.name, type: file.type, size: file.size, dataUrl, progress: 0, done: false };
                setFiles(prev => [...prev, newFile]);
                // Simulate upload progress
                let prog = 0;
                const interval = setInterval(() => {
                    prog += Math.random() * 25 + 10;
                    if (prog >= 100) {
                        prog = 100;
                        clearInterval(interval);
                        setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 100, done: true } : f));
                    } else {
                        setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: Math.round(prog) } : f));
                    }
                }, 300);
            };
            reader.readAsDataURL(file);
        });
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    const handleSubmit = () => {
        const doneFiles = files.filter(f => f.done);
        if (!doneFiles.length) return;
        // Combine all files into JSON string for submission
        const combined = JSON.stringify(doneFiles.map(f => ({ name: f.name, dataUrl: f.dataUrl })));
        onSubmit(combined);
        onClose();
    };

    const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));
    const allDone = files.length > 0 && files.every(f => f.done);

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[#0f172a] border border-white/10 rounded-[3rem] w-full max-w-lg p-8 relative z-10 shadow-2xl space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-black text-white">📤 تسليم الواجب</h3>
                        <p className={`text-xs ${textClass} font-bold mt-1`}>{assignment.title}</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all">
                        <X size={16} />
                    </button>
                </div>

                {/* Drag & Drop Zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all ${isDragging ? `border-white/50 ${bgClass}` : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                >
                    <Upload size={36} className={`mx-auto mb-3 ${isDragging ? 'text-white scale-110' : 'text-slate-500'} transition-all`} />
                    <p className="text-white font-black text-sm mb-1">اسحب الملفات هنا أو اضغط للاختيار</p>
                    <p className="text-slate-500 text-[10px] font-bold">JPG, PNG, SVG, ZIP, PDF مسموح</p>
                    <input ref={inputRef} type="file" multiple accept=".jpg,.jpeg,.png,.svg,.zip,.pdf" className="hidden"
                        onChange={e => e.target.files && processFiles(e.target.files)} />
                </div>

                {/* File Previews */}
                {files.length > 0 && (
                    <div className="space-y-3 max-h-52 overflow-y-auto no-scrollbar">
                        {files.map(file => (
                            <div key={file.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                {/* Thumbnail */}
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0 flex items-center justify-center">
                                    {file.type.startsWith('image/') ? (
                                        <img src={file.dataUrl} alt={file.name} className="w-full h-full object-cover" />
                                    ) : file.type === 'application/pdf' ? (
                                        <div className="bg-rose-500/20 w-full h-full flex items-center justify-center">
                                            <span className="text-[10px] font-black text-rose-400">PDF</span>
                                        </div>
                                    ) : (
                                        <File size={20} className="text-slate-400" />
                                    )}
                                </div>

                                {/* Info + Progress */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-bold truncate mb-2">{file.name}</p>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${file.done ? 'bg-emerald-500' : `${buttonClass.split(' ')[0]}`}`}
                                            style={{ width: `${file.progress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-1 font-bold">
                                        {file.done ? '✅ جاهز' : `${file.progress}%...`}
                                    </p>
                                </div>

                                {/* Remove */}
                                <button onClick={() => removeFile(file.id)} className="w-7 h-7 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center hover:bg-rose-500/20 transition-all shrink-0">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Allowed Types Info */}
                <p className="text-slate-600 text-[10px] font-bold flex items-center gap-1">
                    <AlertCircle size={12} /> يُسمح فقط بـ .jpg, .png, .svg, .zip, .pdf — الحد الأقصى للملف 5MB
                </p>

                {/* Submit Button */}
                <button
                    disabled={!allDone}
                    onClick={handleSubmit}
                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${allDone ? `${buttonClass} text-white shadow-lg hover:scale-[1.02]` : 'bg-white/5 text-slate-600 cursor-not-allowed'}`}
                >
                    {allDone ? 'تسليم الواجب ✅' : files.length === 0 ? 'اختر ملفاً أولاً' : 'جارٍ تحميل الملفات...'}
                </button>
            </div>
        </div>
    );
};

// ─── AssignmentsTab ───────────────────────────────────────────────────────────
const AssignmentsTab: React.FC<AssignmentsTabProps> = ({
    filteredAssignments, submissions, onAssignmentSubmit,
    student, addToast, settings, isDark = true,
}) => {
    const { getCardThemeClasses, getButtonThemeClasses, getButtonTextThemeClasses, getButtonBgThemeClasses } = usePortalTheme(settings.portalTheme, isDark);
    const [uploadingAsg, setUploadingAsg] = useState<Assignment | null>(null);

    const handleSubmit = (fileUrl: string) => {
        if (!uploadingAsg) return;
        onAssignmentSubmit({ assignmentId: uploadingAsg.id, studentId: student.id, studentName: student.name, fileUrl });
        addToast('تم تسليم الواجب بنجاح! 🚀', 'success');
    };

    return (
        <>
            <div className="space-y-8 pb-24 animate-fadeIn">
                <h2 className={`text-3xl font-black text-white border-b border-white/10 pb-4 flex items-center gap-3`}>
                    <FileText className={getButtonTextThemeClasses()} /> الواجبات المدرسية
                </h2>

                <div className="flex flex-col gap-4">
                    {filteredAssignments.map(asg => {
                        const isSubmitted = submissions.find(s => s.assignmentId === asg.id);
                        return (
                            <div key={asg.id} className={`${getCardThemeClasses()} p-6 rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-all group flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-lg`}>
                                <div className="flex items-start gap-5">
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner ${isSubmitted ? 'bg-emerald-500/10 text-emerald-500' : `${getButtonBgThemeClasses()} ${getButtonTextThemeClasses()}`}`}>
                                        {isSubmitted ? <CheckCircle2 size={32} /> : <FileText size={32} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg mb-2">{asg.title}</h3>
                                        <div className="flex flex-wrap gap-3">
                                            <span className={`text-[10px] px-3 py-1 rounded-lg font-bold border ${!isSubmitted ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                تسليم: {asg.dueDate}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {!isSubmitted ? (
                                    <div className="flex gap-3 w-full lg:w-auto">
                                        {asg.externalLink ? (
                                            <button onClick={() => window.open(asg.externalLink, '_blank')} className={`flex-1 lg:flex-none px-6 py-3 ${getButtonThemeClasses()} text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2`}>
                                                فتح الرابط 🔗
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setUploadingAsg(asg)}
                                                className={`flex-1 lg:flex-none px-6 py-3 ${getButtonThemeClasses()} text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all`}
                                            >
                                                <Upload size={16} /> رفع الواجب
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-2xl font-black text-xs border border-emerald-500/20 flex items-center gap-2">
                                        <CheckCircle2 size={16} /> تم التسليم بنجاح
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filteredAssignments.length === 0 && (
                        <div className={`${getCardThemeClasses()} p-16 rounded-[3rem] border border-dashed border-slate-700 text-center`}>
                            <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500/50" />
                            <p className="text-slate-400 font-bold">لا توجد واجبات لصفك الدراسي حالياً.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {uploadingAsg && (
                <AssignmentUploadModal
                    assignment={uploadingAsg}
                    cardClass={getCardThemeClasses()}
                    buttonClass={getButtonThemeClasses()}
                    textClass={getButtonTextThemeClasses()}
                    bgClass={getButtonBgThemeClasses()}
                    onClose={() => setUploadingAsg(null)}
                    onSubmit={handleSubmit}
                />
            )}
        </>
    );
};

export default AssignmentsTab;
