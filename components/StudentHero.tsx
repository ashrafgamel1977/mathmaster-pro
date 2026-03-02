import React from 'react';
import { Student } from '../types';

interface StudentHeroProps {
  student: Student;
  level: number;
  progressToNextLevel: number;
  streaks: number;
}

const StudentHero: React.FC<StudentHeroProps> = ({ student, level, progressToNextLevel, streaks }) => {
  return (
    <div className="relative overflow-hidden rounded-[3rem] bg-[#1e293b] border border-white/5 shadow-2xl p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-8 group">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_rgba(245,158,11,0.1),transparent_50%)]"></div>
      
      <div className="relative z-10 flex items-center gap-6 w-full md:w-auto">
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-br from-amber-400 to-orange-600 shadow-xl shadow-orange-500/20">
                <img src={student.avatar} className="w-full h-full rounded-full object-cover border-4 border-[#1e293b]" alt="Avatar" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1">
                <span className="text-amber-400">LVL</span> {level}
            </div>
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">أهلاً، {student.name.split(' ')[0]} 👋</h2>
            <div className="w-full max-w-[200px]">
                <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                  <span>الخبرة</span>
                  <span>{Math.floor(progressToNextLevel)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 ease-out shadow-[0_0_10px_#fbbf24]" style={{ width: `${progressToNextLevel}%` }}></div>
                </div>
            </div>
          </div>
      </div>
      
      {/* Stats */}
      <div className="relative z-10 flex gap-4 w-full md:w-auto justify-center">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center min-w-[90px] shadow-lg">
            <div className="text-2xl mb-1">🔥</div>
            <div className="text-xl font-black text-white">{streaks}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">يوم حماس</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center min-w-[90px] shadow-lg">
            <div className="text-2xl mb-1">💎</div>
            <div className="text-xl font-black text-white">{student.points}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">نقطة</div>
          </div>
      </div>
    </div>
  );
};

export default StudentHero;
