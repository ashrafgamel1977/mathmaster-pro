
import React, { useState } from 'react';
import { PlatformReward, RewardRedemption, Student } from '../types';

interface RewardsProps {
  rewards: PlatformReward[];
  redemptions: RewardRedemption[];
  student?: Student;
  role: 'teacher' | 'student';
  onAddReward: (r: Omit<PlatformReward, 'id'>) => void;
  onDeleteReward: (id: string) => void;
  onRedeem: (rewardId: string) => void;
  onMarkDelivered: (redemptionId: string) => void;
}

const Rewards: React.FC<RewardsProps> = ({ rewards, redemptions, student, role, onAddReward, onDeleteReward, onRedeem, onMarkDelivered }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newReward, setNewReward] = useState({ title: '', cost: 100, icon: '🎁', description: '' });

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-slideUp pb-24 text-right" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-10 md:p-14 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black">متجر العباقرة ✨</h2>
              <p className="text-amber-100 font-bold text-sm md:text-lg">استبدل نقاط اجتهادك بجوائز حقيقية ومفاجآت!</p>
           </div>
           {role === 'teacher' ? (
             <button 
               onClick={() => setShowAdd(true)}
               className="px-10 py-5 bg-white text-amber-600 rounded-[2rem] font-black text-xs shadow-xl hover:scale-105 transition-all"
             >إضافة جائزة جديدة ＋</button>
           ) : (
             <div className="bg-white/20 backdrop-blur-md px-8 py-4 rounded-[2rem] border border-white/30 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-200">رصيدك الحالي</p>
                <p className="text-3xl font-black">{student?.points || 0} <span className="text-sm">نقطة</span></p>
             </div>
           )}
        </div>
      </div>

      {role === 'teacher' && redemptions.length > 0 && (
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-amber-100 space-y-6">
           <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
              طلبات استبدال بانتظارك ({redemptions.filter(r => r.status === 'pending').length})
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {redemptions.filter(r => r.status === 'pending').map(r => (
                <div key={r.id} className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex justify-between items-center">
                   <div>
                      <p className="font-black text-slate-800 text-xs">{r.studentName}</p>
                      <p className="text-[10px] font-bold text-amber-600">يريد: {r.rewardTitle}</p>
                   </div>
                   <button onClick={() => onMarkDelivered(r.id)} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[9px] font-black shadow-lg">تم التسليم ✓</button>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {rewards.map(reward => (
          <div key={reward.id} className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-slate-100 flex flex-col items-center text-center group relative overflow-hidden hover:translate-y-[-10px] transition-all duration-500">
             <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-inner group-hover:scale-110 transition-transform">{reward.icon}</div>
             <h4 className="text-xl font-black text-slate-800 mb-2">{reward.title}</h4>
             <p className="text-xs text-slate-400 font-bold mb-6 flex-1">{reward.description}</p>
             
             <div className="w-full py-4 bg-slate-50 rounded-2xl flex items-center justify-center gap-2 mb-6 border border-slate-100">
                <span className="text-lg font-black text-amber-600">{reward.cost}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">نقطة</span>
             </div>

             {role === 'student' ? (
               <button 
                 disabled={(student?.points || 0) < reward.cost}
                 onClick={() => onRedeem(reward.id)}
                 className={`w-full py-4 rounded-2xl font-black text-xs shadow-lg transition-all ${
                   (student?.points || 0) >= reward.cost 
                   ? 'bg-amber-500 text-white shadow-amber-100 hover:scale-105' 
                   : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                 }`}
               >
                 {(student?.points || 0) >= reward.cost ? 'استبدل الآن 🎁' : 'نقاطك لا تكفي'}
               </button>
             ) : (
               <button onClick={() => onDeleteReward(reward.id)} className="w-full py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs hover:bg-rose-500 hover:text-white transition-all">حذف الجائزة</button>
             )}
          </div>
        ))}
        {rewards.length === 0 && (
           <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 opacity-30">
              <span className="text-6xl block mb-4">🏆</span>
              <p className="font-black text-slate-400 text-xl">المتجر فارغ حالياً، أضف بعض الحوافز لطلابك!</p>
           </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md p-10 rounded-[3.5rem] shadow-2xl space-y-6">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-2xl font-black text-slate-800">إضافة جائزة جديدة</h3>
               <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-rose-500 transition-all">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                 <div className="col-span-1 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 px-2 uppercase">أيقونة</label>
                    <input type="text" className="w-full px-4 py-4 bg-slate-50 rounded-2xl text-center text-xl" value={newReward.icon} onChange={e => setNewReward({...newReward, icon: e.target.value})} />
                 </div>
                 <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 px-2 uppercase">تكلفة النقاط</label>
                    <input type="number" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black" value={newReward.cost} onChange={e => setNewReward({...newReward, cost: parseInt(e.target.value)})} />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 px-2 uppercase">اسم الجائزة</label>
                 <input type="text" placeholder="مثلاً: خصم على الشهر القادم" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold" value={newReward.title} onChange={e => setNewReward({...newReward, title: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black text-slate-400 px-2 uppercase">الوصف</label>
                 <textarea placeholder="اكتب تفاصيل الجائزة..." className="w-full p-6 bg-slate-50 rounded-2xl font-medium text-xs h-24 outline-none" value={newReward.description} onChange={e => setNewReward({...newReward, description: e.target.value})} />
              </div>
              <button 
                onClick={() => { onAddReward(newReward); setShowAdd(false); setNewReward({title:'', cost: 100, icon: '🎁', description: ''}); }}
                className="w-full py-5 bg-amber-500 text-white rounded-2xl font-black shadow-xl"
              >نشر الجائزة في المتجر 🚀</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
