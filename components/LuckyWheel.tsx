
import React, { useState } from 'react';

interface LuckyWheelProps {
  onWin: (points: number) => void;
  onClose: () => void;
}

const PRIZES = [
  { p: 10, label: '10 نقاط', color: '#3b82f6' },
  { p: 5, label: '5 نقاط', color: '#10b981' },
  { p: 20, label: '20 نقطة', color: '#f59e0b' },
  { p: 0, label: 'حظ أوفر', color: '#64748b' },
  { p: 50, label: '50 نقطة', color: '#8b5cf6' },
  { p: 15, label: '15 نقطة', color: '#ec4899' },
  { p: 5, label: '5 نقاط', color: '#06b6d4' },
  { p: 10, label: '10 نقاط', color: '#f97316' },
];

const LuckyWheel: React.FC<LuckyWheelProps> = ({ onWin, onClose }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<number | null>(null);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setWonPrize(null);

    const randomPrizeIndex = Math.floor(Math.random() * PRIZES.length);
    const extraSpins = 5 * 360; // 5 لفات كاملة
    const prizeSliceAngle = 360 / PRIZES.length;
    const finalRotation = rotation + extraSpins + (360 - (randomPrizeIndex * prizeSliceAngle));
    
    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      const prize = PRIZES[randomPrizeIndex].p;
      setWonPrize(prize);
      setTimeout(() => onWin(prize), 1500);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl text-center space-y-10 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div>
           <h3 className="text-3xl font-black text-slate-800">عجلة الحظ اليومية 🎡</h3>
           <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">جرب حظك واربح نقاط مجانية</p>
        </div>

        <div className="relative mx-auto w-64 h-64 md:w-80 md:h-80">
          {/* Arrow */}
          <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20 text-4xl drop-shadow-lg">▼</div>
          
          {/* Wheel SVG */}
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full transition-transform duration-[4s] ease-out shadow-2xl rounded-full border-8 border-slate-100"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {PRIZES.map((prize, i) => {
              const angle = 360 / PRIZES.length;
              const startAngle = i * angle;
              const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 50 + 50 * Math.cos((Math.PI * (startAngle + angle)) / 180);
              const y2 = 50 + 50 * Math.sin((Math.PI * (startAngle + angle)) / 180);

              return (
                <g key={i}>
                  <path 
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`} 
                    fill={prize.color}
                    className="opacity-90 hover:opacity-100 transition-opacity"
                  />
                  <text 
                    x="75" y="50" 
                    fill="white" 
                    fontSize="4" 
                    fontWeight="900"
                    transform={`rotate(${startAngle + angle/2}, 50, 50)`}
                    style={{ textAnchor: 'middle' }}
                  >
                    {prize.p > 0 ? prize.p : '😞'}
                  </text>
                </g>
              );
            })}
            <circle cx="50" cy="50" r="8" fill="white" className="shadow-lg" />
            <text x="50" y="52" textAnchor="middle" fontSize="5" fontWeight="900" fill="#0f172a">∑</text>
          </svg>
        </div>

        <div className="space-y-4">
           {wonPrize !== null ? (
             <div className="animate-bounce">
               <p className="text-2xl font-black text-blue-600">
                 {wonPrize > 0 ? `مبروك! ربحت ${wonPrize} نقطة 🎉` : 'حظ أوفر المرة القادمة! 🍀'}
               </p>
             </div>
           ) : (
             <button 
               disabled={spinning}
               onClick={spin}
               className={`w-full py-6 rounded-3xl font-black text-xl shadow-2xl transition-all ${spinning ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:scale-[1.02] active:scale-95 shadow-blue-200'}`}
             >
               {spinning ? 'جاري اللف...' : 'لف العجلة الآن 🚀'}
             </button>
           )}
           <button onClick={onClose} disabled={spinning} className="text-slate-400 font-bold text-[10px] hover:text-slate-600">إغلاق</button>
        </div>
      </div>
    </div>
  );
};

export default LuckyWheel;
