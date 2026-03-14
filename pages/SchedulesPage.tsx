
import React, { useState } from 'react';
import { Group, ScheduleEntry } from '../types';

interface SchedulesProps {
  groups: Group[];
  schedules: ScheduleEntry[];
  onAdd: (entry: Omit<ScheduleEntry, 'id'>) => void;
  onDelete: (id: string) => void;
}

const Schedules: React.FC<SchedulesProps> = ({ groups, schedules, onAdd, onDelete }) => {
  const [form, setForm] = useState({ groupId: '', day: '', time: '', topic: '', type: 'center' as const });

  return (
    <div className="space-y-10 animate-slideUp text-right" dir="rtl">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">إدارة الجدول الدراسي 📅</h2>
          <p className="text-sm text-slate-400 font-bold mt-1">نظم مواعيد الحصص واللقاءات لطلابك.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6 sticky top-10">
            <h3 className="text-xl font-black text-slate-800">＋ إضافة موعد</h3>
            <div className="space-y-4">
              <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={form.groupId} onChange={e => setForm({...form, groupId: e.target.value})}>
                <option value="">اختر المجموعة...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <select className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={form.day} onChange={e => setForm({...form, day: e.target.value})}>
                <option value="">اختر اليوم...</option>
                {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input type="text" placeholder="الساعة (مثلاً: ٠٤:٠٠ م)" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
              <input type="text" placeholder="الموضوع (مثلاً: مراجعة هندسة)" className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={form.topic} onChange={e => setForm({...form, topic: e.target.value})} />
              <button 
                onClick={() => { if(form.groupId && form.day) { onAdd(form); setForm({...form, topic: '', time: ''}); } }}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg"
              >تثبيت في الجدول</button>
            </div>
          </div>
        </div>
        <div className="lg:col-span-3 space-y-6">
          {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => {
            const dayEntries = schedules.filter(s => s.day === day);
            if (dayEntries.length === 0) return null;
            return (
              <div key={day} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100">
                <h4 className="text-xl font-black text-indigo-600 mb-6">{day}</h4>
                <div className="space-y-4">
                  {dayEntries.map(entry => {
                    const group = groups.find(g => g.id === entry.groupId);
                    return (
                      <div key={entry.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl border border-slate-100 group">
                        <div className="flex gap-6 items-center">
                          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-lg font-black">📅</div>
                          <div>
                            <p className="font-black text-slate-800">{entry.topic || 'حصة أساسية'}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{group?.name} • {entry.time}</p>
                          </div>
                        </div>
                        <button onClick={() => onDelete(entry.id)} className="w-10 h-10 bg-rose-50 text-rose-400 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {schedules.length === 0 && (
            <div className="py-24 text-center opacity-20 bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
              <span className="text-8xl block mb-6">📅</span>
              <p className="font-black text-2xl">الجدول فارغ حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedules;
