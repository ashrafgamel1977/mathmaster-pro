
import React from 'react';
import { Student, Year } from '../types';

interface LeaderboardProps {
  students: Student[];
  years: Year[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ students, years }) => {
  const sortedStudents = [...students].sort((a, b) => (b.points + b.score) - (a.points + a.score)).slice(0, 10);

  return (
    <div className="space-y-10 animate-slideUp pb-24 text-right" dir="rtl">
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="relative z-10">
          <span className="text-6xl block mb-4 animate-bounce">🏆</span>
          <h2 className="text-4xl font-black italic">لوحة الشرف الذهبية</h2>
          <p className="text-indigo-200 font-bold mt-2">تكريم عباقرة الرياضيات في منصة الأستاذ أشرف جميل</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end max-w-4xl mx-auto mb-16">
        {/* المركز الثاني */}
        {sortedStudents[1] && (
          <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-xl text-center order-2 lg:order-1 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-300"></div>
            <img src={sortedStudents[1].avatar} className="w-24 h-24 rounded-3xl mx-auto mb-4 border-4 border-slate-100 shadow-lg group-hover:scale-110 transition-transform" alt="" />
            <span className="text-2xl block mb-2">🥈</span>
            <h4 className="font-black text-gray-800 text-lg truncate">{sortedStudents[1].name}</h4>
            <p className="text-[10px] font-black text-indigo-500 uppercase">{years.find(y=>y.id===sortedStudents[1].yearId)?.name}</p>
            <div className="mt-4 py-2 bg-slate-50 rounded-2xl font-black text-slate-600 text-xl">{sortedStudents[1].points + sortedStudents[1].score} نقطة</div>
          </div>
        )}

        {/* المركز الأول */}
        {sortedStudents[0] && (
          <div className="bg-white p-10 rounded-[4rem] border-4 border-amber-400 shadow-[0_35px_60px_-15px_rgba(251,191,36,0.3)] text-center order-1 lg:order-2 relative z-10 transform lg:scale-110 group">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-5xl">👑</div>
            <img src={sortedStudents[0].avatar} className="w-32 h-32 rounded-[2.5rem] mx-auto mb-6 border-4 border-amber-50 shadow-2xl group-hover:rotate-3 transition-transform" alt="" />
            <span className="text-3xl block mb-2">🥇</span>
            <h4 className="font-black text-gray-900 text-2xl truncate">{sortedStudents[0].name}</h4>
            <p className="text-xs font-black text-amber-600 uppercase tracking-widest">{years.find(y=>y.id===sortedStudents[0].yearId)?.name}</p>
            <div className="mt-6 py-4 bg-amber-50 rounded-[2rem] font-black text-amber-700 text-3xl shadow-inner">{sortedStudents[0].points + sortedStudents[0].score}</div>
          </div>
        )}

        {/* المركز الثالث */}
        {sortedStudents[2] && (
          <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-xl text-center order-3 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-amber-700"></div>
            <img src={sortedStudents[2].avatar} className="w-24 h-24 rounded-3xl mx-auto mb-4 border-4 border-amber-50 shadow-lg group-hover:scale-110 transition-transform" alt="" />
            <span className="text-2xl block mb-2">🥉</span>
            <h4 className="font-black text-gray-800 text-lg truncate">{sortedStudents[2].name}</h4>
            <p className="text-[10px] font-black text-indigo-500 uppercase">{years.find(y=>y.id===sortedStudents[2].yearId)?.name}</p>
            <div className="mt-4 py-2 bg-amber-50 rounded-2xl font-black text-amber-800 text-xl">{sortedStudents[2].points + sortedStudents[2].score} نقطة</div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[4rem] shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-8 py-6 font-black text-gray-400 text-xs">الترتيب</th>
              <th className="px-8 py-6 font-black text-gray-400 text-xs">الطالب</th>
              <th className="px-8 py-6 font-black text-gray-400 text-xs text-center">إجمالي النقاط</th>
              <th className="px-8 py-6 font-black text-gray-400 text-xs">المستوى</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedStudents.slice(3).map((student, idx) => (
              <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-8 py-5 font-black text-gray-400">#{idx + 4}</td>
                <td className="px-8 py-5">
                   <div className="flex items-center gap-4">
                     <img src={student.avatar} className="w-10 h-10 rounded-xl" alt="" />
                     <span className="font-bold text-gray-800">{student.name}</span>
                   </div>
                </td>
                <td className="px-8 py-5 text-center font-black text-indigo-600 text-lg">{student.points + student.score}</td>
                <td className="px-8 py-5">
                   <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">عبقري رياضيات</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
