
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
      <div className="bg-emerald-600 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <span className="text-6xl block mb-6 animate-bounce">🎉</span>
        <h2 className="text-4xl font-black mb-4">النظام يعمل بنجاح!</h2>
        <p className="text-emerald-100 font-bold text-lg">ألف مبروك أستاذ {teacherName}، بياناتك محفوظة وآمنة.</p>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg space-y-6">
         <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <span className="text-amber-500">❓</span>
            كيف أجد بياناتي (الاختبارات) في Firebase؟
         </h3>
         <div className="space-y-4 text-slate-600 font-medium leading-relaxed bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
            <p>عندما تفتح موقع Firebase، قد تكون داخل "مستند" معين (مثل <code>g17...</code>) كما ظهر في الصورة.</p>
            <ol className="list-decimal list-inside space-y-2 font-bold text-slate-800 mt-2">
               <li>انظر إلى العمود الأول على اليسار في صفحة Firestore Database.</li>
               <li>ستجد قائمة بالمجموعات الرئيسية (Collections) مثل: <code>students</code>، <code>quizzes</code>، <code>groups</code>.</li>
               <li>إذا لم تجدها، اضغط على <strong>اسم قاعدة البيانات</strong> (في أعلى العمود الأول) للرجوع للجذر (Root).</li>
               <li>قد تحتاج لتحديث صفحة المتصفح (Refresh) لظهور البيانات الجديدة.</li>
            </ol>
            <p className="text-xs text-indigo-600 mt-2">ملاحظة: البيانات تظهر في التطبيق فوراً، وهذا هو الدليل الأقوى على حفظها.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-emerald-100 shadow-lg">
           <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
             <span className="text-emerald-500">✔</span> حالة النظام
           </h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                 <span className="text-slate-500 font-bold text-xs">قاعدة البيانات</span>
                 <span className="text-emerald-600 font-black text-xs bg-emerald-100 px-3 py-1 rounded-lg">متصلة (Firestore)</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                 <span className="text-slate-500 font-bold text-xs">تخزين الصور</span>
                 <span className="text-indigo-600 font-black text-xs bg-indigo-100 px-3 py-1 rounded-lg">الوضع الذكي (Database)</span>
              </div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="text-xl font-black text-slate-800 mb-4">خطوتك القادمة</h3>
           <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
             يمكنك الآن البدء في إضافة الطلاب الفعليين، ونشر الجدول، وإنشاء الاختبارات. 
             <br/>
             <strong>نصيحة:</strong> استخدم تبويب "التقني" في لوحة التحكم لمشاهدة عداد البيانات الحية والتأكد من الحفظ.
           </p>
           <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl hover:scale-[1.02] transition-all">
             تحديث التطبيق للتأكد ↻
           </button>
        </div>
      </div>
    </div>
  );
};

export default LaunchGuide;
