
import React from 'react';
import { Group, Year } from '../types';

interface LaunchGuideProps {
  groups: Group[];
  years: Year[];
  teacherName: string;
  platformName: string;
  addToast: (msg: string, type: any) => void;
}

const LaunchGuide: React.FC<LaunchGuideProps> = ({ teacherName, platformName }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slideUp text-right" dir="rtl">
      <div className="bg-indigo-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <h2 className="text-3xl font-black mb-4">مركز الدعم: كيف تطلق منصتك؟ 🚀</h2>
        <p className="text-indigo-200 font-medium">أستاذ أشرف، أنت الآن في مرحلة "رفع الكود". إليك كيفية الحصول على كل الملفات.</p>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-xl font-black text-gray-800">قائمة الملفات المطلوبة (انسخها واحفظها):</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {[
             { n: 'index.html', d: 'واجهة الموقع الأساسية' },
             { n: 'index.tsx', d: 'محرك التشغيل' },
             { n: 'App.tsx', d: 'تنظيم الصفحات' },
             { n: 'types.ts', d: 'قواعد البيانات' },
             { n: 'geminiService.ts', d: 'خدمات الذكاء الاصطناعي' },
             { n: 'Dashboard.tsx', d: 'لوحة التحكم' },
             { n: 'StudentPortal.tsx', d: 'بوابة الطلاب' }
           ].map((f, i) => (
             <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-indigo-600">{f.n}</span>
                <span className="text-[9px] font-bold text-gray-400">{f.d}</span>
             </div>
           ))}
        </div>
        
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
           <p className="text-xs text-amber-700 font-bold leading-relaxed">
             أستاذ أشرف، بما أنك على الموبايل، الطريقة الأسهل هي نسخ كود كل ملف من رسائلي، وحفظه في تطبيق "الملاحظات" مؤقتاً، ثم عند رفع الملفات لـ GitHub اختر **choose your files** وارفعهم جميعاً من هاتفك.
           </p>
        </div>
      </div>
    </div>
  );
};

export default LaunchGuide;
