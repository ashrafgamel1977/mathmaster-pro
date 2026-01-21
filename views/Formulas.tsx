
import React, { useState, useMemo } from 'react';
import { Year, MathFormula } from '../types';
import MathRenderer from '../components/MathRenderer';

interface FormulasProps {
  years: Year[];
  formulas: MathFormula[];
  onAdd: (formula: Omit<MathFormula, 'id'>) => void;
  onDelete: (id: string) => void;
}

const Formulas: React.FC<FormulasProps> = ({ years, formulas, onAdd, onDelete }) => {
  const [form, setForm] = useState({ branch: 'جبر', title: '', content: '', yearId: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');

  const filteredFormulas = useMemo(() => {
    return formulas.filter(f => {
      const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            f.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            f.branch.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === 'all' || f.yearId === selectedYear;
      return matchesSearch && matchesYear;
    });
  }, [formulas, searchQuery, selectedYear]);

  return (
    <div className="space-y-8 animate-slideUp text-right" dir="rtl" id="custom-section-math-formulas">
      {/* Header & Introduction */}
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-800">بنك القوانين الرياضية 📐</h2>
            <p className="text-sm text-slate-400 font-bold mt-1">مرجع دائم وشامل لأهم القوانين والنتائج.</p>
          </div>
        </div>

        <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 space-y-6">
           <div>
             <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 mb-2">
               <span className="text-xl">💡</span> أهمية القوانين الرياضية في حياتنا
             </h3>
             <p className="text-xs text-slate-600 font-medium leading-loose text-justify opacity-90">
               القوانين والمعادلات الرياضية هي لغة الكون وأداة أساسية لفهم العالم من حولنا. فهي ليست مجرد رموز مجردة، بل هي الأساس الذي تقوم عليه التكنولوجيا الحديثة، الهندسة المعمارية، الاقتصاد، وحتى الفنون. تساعدنا القوانين على نمذجة الواقع وحل المشكلات المعقدة بأسلوب منطقي دقيق، مما يجعلها مهارة حياتية لا غنى عنها لأي مبدع أو مفكر.
             </p>
           </div>
           
           <div>
             <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 mb-2">
               <span className="text-xl">🔍</span> دليل الاستخدام والبحث
             </h3>
             <p className="text-xs text-slate-600 font-medium leading-loose text-justify opacity-90">
               تم تصميم هذا البنك ليكون مساعدك الشخصي. يمكنك استخدام <b>شريط البحث</b> أدناه للوصول السريع لأي قانون عبر كتابة اسمه (مثلاً: "فيثاغورس") أو جزء من المعادلة. كما يمكنك <b>تصفية النتائج</b> حسب الصف الدراسي للتركيز على منهجك الحالي.
             </p>
           </div>
        </div>
      </div>

      {/* Search & Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Add Formula Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6 sticky top-10">
            <h3 className="text-xl font-black text-slate-800">＋ إضافة قانون</h3>
            <div className="space-y-4">
              <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600 transition-all" value={form.yearId} onChange={e => setForm({...form, yearId: e.target.value})}>
                <option value="">لكافة الصفوف</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <input type="text" placeholder="الفرع (جبر، هندسة...)" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600 transition-all" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} />
              <input type="text" placeholder="اسم القانون" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600 transition-all" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <textarea 
                placeholder="المحتوى (استخدم $ للمعادلات)" 
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none min-h-[120px] focus:ring-2 focus:ring-blue-600 transition-all resize-none" 
                value={form.content} 
                onChange={e => setForm({...form, content: e.target.value})}
              />
              <button 
                onClick={() => { if(form.title && form.content) { onAdd(form); setForm({...form, title: '', content: '', branch: 'جبر', yearId: ''}); } }}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-blue-700 transition-all"
              >حفظ القانون</button>
            </div>
          </div>
        </div>

        {/* Formulas List */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="ابحث عن قانون..." 
                  className="w-full pl-4 pr-12 py-4 bg-slate-50 rounded-3xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
             </div>
             <select 
               className="px-8 py-4 bg-slate-50 rounded-3xl font-bold text-xs outline-none cursor-pointer focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all"
               value={selectedYear}
               onChange={e => setSelectedYear(e.target.value)}
             >
                <option value="all">كل الصفوف الدراسية</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
             </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFormulas.map(f => (
              <div key={f.id} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 relative group overflow-hidden hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest">{f.branch}</span>
                  <button onClick={() => onDelete(f.id)} className="text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all w-8 h-8 flex items-center justify-center bg-rose-50 rounded-full">🗑️</button>
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-4 truncate">{f.title}</h4>
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 min-h-[100px] flex items-center justify-center">
                  <MathRenderer content={f.content} />
                </div>
                {f.yearId && (
                  <p className="text-[9px] font-bold text-slate-300 mt-4 text-left px-2">
                    {years.find(y => y.id === f.yearId)?.name}
                  </p>
                )}
              </div>
            ))}
            {filteredFormulas.length === 0 && (
              <div className="col-span-full py-24 text-center opacity-30 bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
                <span className="text-8xl block mb-6">📐</span>
                <p className="font-black text-2xl text-slate-400">لا توجد قوانين مطابقة للبحث</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Formulas;
