
import React from 'react';
import { Student, Year } from '../types';

interface LeaderboardProps {
  students: Student[];
  years: Year[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ students, years }) => {
  const sortedStudents = [...students].sort((a, b) => (b.points + b.score) - (a.points + a.score)).slice(0, 10);

  return (
    <div className="space-y-12 animate-slideUp pb-24 text-right" dir="rtl">
      {/* Dynamic Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-12 md:p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden text-center border-b-4 border-indigo-500/30">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent"></div>
        
        {/* Confetti Animation Placeholder (CSS) */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="confetti-slow absolute top-0 left-1/4 w-2 h-2 bg-amber-400 rounded-full"></div>
            <div className="confetti-fast absolute top-0 left-2/4 w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="confetti-medium absolute top-0 left-3/4 w-2 h-2 bg-blue-400 rounded-full"></div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-3xl mb-6 border border-white/20">
             <span className="text-5xl">🏆</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">مجلس العمالقة ⚡</h2>
          <p className="text-indigo-200 font-bold text-sm md:text-xl max-w-2xl mx-auto leading-relaxed">أفضل 10 طلاب في رحلة التميز لهذا الشهر في الفيزياء والرياضيات.</p>
        </div>
      </div>

      {/* The Elite Podium */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-end justify-center gap-0 md:gap-4 mb-20">
          
          {/* المركز الثاني - Silver */}
          {sortedStudents[1] && (
            <div className="relative flex flex-col items-center group w-full md:w-64 order-2 md:order-1 mt-10 md:mt-0">
                <div className="mb-4 relative">
                    <img src={sortedStudents[1].avatar} className="w-24 h-24 rounded-full border-4 border-slate-300 shadow-xl group-hover:scale-105 transition-transform" alt="" />
                    <div className="absolute -bottom-2 -right-2 bg-slate-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-black border-4 border-white">2</div>
                </div>
                <h4 className="font-black text-slate-800 text-sm mb-1">{sortedStudents[1].name}</h4>
                <div className="w-full h-40 bg-slate-200 rounded-t-[2.5rem] relative flex flex-col items-center justify-center shadow-lg border-x border-t border-slate-300">
                    <span className="text-4xl opacity-20 mb-2">🥈</span>
                    <span className="font-black text-slate-500 text-lg">{sortedStudents[1].points + sortedStudents[1].score}</span>
                </div>
            </div>
          )}

          {/* المركز الأول - Gold (King) */}
          {sortedStudents[0] && (
            <div className="relative flex flex-col items-center group w-full md:w-80 order-1 md:order-2 z-10">
                <div className="absolute -top-12 animate-bounce flex flex-col items-center">
                    <span className="text-5xl">👑</span>
                </div>
                <div className="mb-6 relative">
                    <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-30 animate-pulse"></div>
                    <img src={sortedStudents[0].avatar} className="w-32 h-32 rounded-full border-[6px] border-amber-400 shadow-2xl relative z-10 group-hover:rotate-3 transition-transform" alt="" />
                    <div className="absolute -bottom-3 -right-3 bg-amber-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-[6px] border-white z-20">1</div>
                </div>
                <h4 className="font-black text-slate-900 text-xl mb-2">{sortedStudents[0].name}</h4>
                <div className="w-full h-56 bg-emerald-500 rounded-t-[3rem] relative flex flex-col items-center justify-center shadow-2xl border-x-4 border-t-4 border-white/20">
                    {/* Radial glow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/50 to-transparent"></div>
                    <span className="text-5xl mb-3 relative z-10 drop-shadow-lg">🥇</span>
                    <span className="font-black text-white text-3xl relative z-10">{sortedStudents[0].points + sortedStudents[0].score}</span>
                    <p className="text-white/70 font-bold text-xs mt-1 relative z-10 uppercase tracking-widest">القائد المطلق</p>
                </div>
            </div>
          )}

          {/* المركز الثالث - Bronze */}
          {sortedStudents[2] && (
            <div className="relative flex flex-col items-center group w-full md:w-64 order-3 mt-10 md:mt-0">
                <div className="mb-4 relative">
                    <img src={sortedStudents[2].avatar} className="w-20 h-20 rounded-full border-4 border-amber-700/50 shadow-xl group-hover:scale-105 transition-transform" alt="" />
                    <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white w-7 h-7 rounded-full flex items-center justify-center font-black text-sm border-4 border-white">3</div>
                </div>
                <h4 className="font-black text-slate-800 text-sm mb-1">{sortedStudents[2].name}</h4>
                <div className="w-full h-32 bg-amber-100 rounded-t-[2rem] relative flex flex-col items-center justify-center shadow-lg border-x border-t border-amber-200">
                    <span className="text-3xl opacity-30 mb-1">🥉</span>
                    <span className="font-black text-amber-800 text-lg">{sortedStudents[2].points + sortedStudents[2].score}</span>
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Rest of the Winners */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-[4rem] shadow-2xl shadow-indigo-100/50 border border-indigo-50/50 overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-10 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">المركز</th>
                <th className="px-10 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">المحارب</th>
                <th className="px-10 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">النقاط</th>
                <th className="px-10 py-6 font-black text-slate-400 text-[10px] uppercase tracking-widest">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedStudents.slice(3).map((student, idx) => (
                <tr key={student.id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-10 py-6">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs">
                        #{idx + 4}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                     <div className="flex items-center gap-4">
                       <div className="relative">
                          <img src={student.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-110 transition-transform" alt="" />
                          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${idx < 3 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                       </div>
                       <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-sm">{student.name}</span>
                          <span className="text-[10px] font-bold text-slate-400">{years.find(y => y.id === student.yearId)?.name}</span>
                       </div>
                     </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className="text-xl font-black text-indigo-600 bg-indigo-50 px-4 py-1 rounded-xl">{student.points + student.score}</span>
                  </td>
                  <td className="px-10 py-6">
                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${idx < 2 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                        {idx < 2 ? 'منافس قوي 🔥' : 'مجتهد 📖'}
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Global CSS for animations provided here for brevity, would normally be in index.css */}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) rotate(0deg); }
          100% { transform: translateY(100vh) rotate(360deg); }
        }
        .confetti-slow { animation: fall 8s linear infinite; }
        .confetti-medium { animation: fall 5s linear infinite; }
        .confetti-fast { animation: fall 3s linear infinite; }
      `}</style>
    </div>
  );
};

export default Leaderboard;
