
import React from 'react';

interface CertificateProps {
  studentName: string;
  quizTitle: string;
  score: number;
  date: string;
  teacherName: string;
  platformName: string;
  onClose: () => void;
}

const Certificate: React.FC<CertificateProps> = ({ studentName, quizTitle, score, date, teacherName, platformName, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[600] flex items-center justify-center p-4 md:p-10 animate-fadeIn">
      <div className="bg-white max-w-5xl w-full rounded-[2rem] shadow-2xl relative overflow-hidden print:shadow-none print:m-0 border-[12px] border-double border-amber-400">
        <div className="p-8 md:p-16 flex flex-col items-center justify-center text-center relative min-h-[600px]">
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-bl-[100%]"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-tr-[100%]"></div>

          <div className="mb-10">
             <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-4xl font-black mb-4 mx-auto shadow-xl">∑</div>
             <h4 className="text-xl font-black text-slate-800 tracking-widest uppercase">{platformName} Academy</h4>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-amber-600 mb-8 font-serif">شهادة تقدير وتفوق</h1>
          
          <p className="text-lg md:text-xl text-slate-500 mb-8">يمنح الأستاذ <span className="font-bold text-slate-900">{teacherName}</span> هذه الشهادة للطالب المتميز:</p>
          
          <div className="mb-10 py-6 border-b-4 border-dashed border-slate-100 min-w-[320px]">
            <h2 className="text-3xl md:text-5xl font-black text-blue-600 tracking-tight">{studentName}</h2>
          </div>

          <p className="text-lg md:text-xl text-slate-600 mb-12 leading-loose max-w-2xl">
            وذلك تقديراً لاجتهاده وتفوقه الباهر وحصوله على الدرجة النهائية <span className="font-black text-emerald-600">($100\%$)</span> <br />
            في تقييم <span className="font-black text-slate-800">"{quizTitle}"</span> <br />
            متمنين له دوام الرفعة والتميز في علم الرياضيات.
          </p>

          <div className="flex flex-col md:flex-row justify-between w-full mt-10 gap-8 px-10">
            <div className="text-right">
              <p className="text-slate-400 text-[10px] font-black uppercase mb-1">تاريخ الإصدار</p>
              <p className="font-black text-slate-800 text-sm">{date}</p>
            </div>
            
            <div className="relative">
              <div className="w-24 h-24 bg-amber-400 rounded-full flex items-center justify-center text-white font-black rotate-12 shadow-xl border-4 border-white">
                <span className="text-center text-[10px]">ختم <br/> التميز</span>
              </div>
            </div>

            <div className="text-left">
              <p className="text-slate-400 text-[10px] font-black uppercase mb-1">توقيع المعلم</p>
              <p className="font-black text-blue-600 text-lg italic">{teacherName}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 flex justify-end gap-4 print:hidden border-t border-slate-100">
          <button 
            onClick={() => window.print()}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <span>🖨️</span> طباعة الشهادة
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white text-slate-400 border border-slate-200 rounded-xl font-black text-xs hover:bg-slate-100 transition-all"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
