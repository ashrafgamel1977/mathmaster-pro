import React from 'react';
import { Student } from '../types';

interface StudentHeroProps {
  student: Student;
  level: number;
  progressToNextLevel: number;
  streaks: number;
  cardThemeClass?: string;
  buttonTextThemeClass?: string;
}

const StudentHero: React.FC<StudentHeroProps> = ({ student, level, progressToNextLevel, streaks, cardThemeClass = 'bg-[#1e293b]', buttonTextThemeClass = 'text-amber-400' }) => {
  return (
    <div className={`relative overflow-hidden rounded-[3rem] ${cardThemeClass} border border-white/5 shadow-2xl p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-8 group`}>
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.05),transparent_50%)]"></div>
      
      <div className="relative z-10 flex items-center gap-6 w-full md:w-auto">
          <div className="relative">
            <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-br from-white/20 to-white/5 shadow-xl">
                <img src={student.avatar} className="w-full h-full rounded-full object-cover border-4 border-black/20" alt="Avatar" />
            </div>
            <div className={`absolute -bottom-2 -right-2 bg-slate-900 border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1`}>
                <span className={buttonTextThemeClass}>LVL</span> {level}
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
                  <div className="h-full bg-gradient-to-r from-white/50 to-white transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${progressToNextLevel}%` }}></div>
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
