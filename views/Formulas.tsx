
import React, { useState } from 'react';
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

  return (
    <div className="space-y-10 animate-slideUp text-right" dir="rtl">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">بنك القوانين الرياضية 📐</h2>
          <p className="text-sm text-slate-400 font-bold mt-1">مرجع دائم للطلاب لأهم القوانين والنتائج.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6 sticky top-10">
            <h3 className="text-xl font-black text-slate-800">＋ إضافة قانون</h3>
            <div className="space-y-4">
              <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={form.yearId} onChange={e => setForm({...form, yearId: e.target.value})}>
                <option value="">لكافة الصفوف</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
              <input type="text" placeholder="اسم القانون (مثلاً: قانون الجيب)" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <textarea 
                placeholder="محتوى القانون (مثلاً: $\sin A / a = \dots$)" 
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none min-h-[150px]" 
                value={form.content} 
                onChange={e => setForm({...form, content: e.target.value})}
              />
              <button 
                onClick={() => { if(form.title && form.content) { onAdd(form); setForm({...form, title: '', content: ''}); } }}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg"
              >حفظ القانون</button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {formulas.map(f => (
            <div key={f.id} className="bg-white p-10 rounded-[3.5rem] shadow-lg border border-slate-100 relative group overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest">{f.branch}</span>
                <button onClick={() => onDelete(f.id)} className="text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
              </div>
              <h4 className="text-xl font-black text-slate-800 mb-6">{f.title}</h4>
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <MathRenderer content={f.content} />
              </div>
            </div>
          ))}
          {formulas.length === 0 && (
            <div className="col-span-full py-24 text-center opacity-20 bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
              <span className="text-8xl block mb-6">📐</span>
              <p className="font-black text-2xl">بنك القوانين فارغ حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Formulas;
