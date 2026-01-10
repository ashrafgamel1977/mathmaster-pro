
import React, { useRef, useEffect, useState } from 'react';

interface GradingCanvasProps {
  imageUrl: string;
  onSave: (annotatedImageUrl: string) => void;
  onCancel: () => void;
}

const GradingCanvas: React.FC<GradingCanvasProps> = ({ imageUrl, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ef4444'); // الأحمر الافتراضي للمعلمين
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      // ضبط أبعاد الكانفاس لتناسب الصورة مع الحفاظ على التناسب
      const maxWidth = window.innerWidth * 0.9;
      const maxHeight = window.innerHeight * 0.6;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // إعدادات الخط
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
  }, [imageUrl]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath(); // إنهاء المسار الحالي
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    e.preventDefault(); // منع التمرير أثناء الرسم
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL('image/jpeg', 0.8));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 w-full justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setColor('#ef4444')} className={`w-8 h-8 rounded-full bg-red-500 border-4 ${color === '#ef4444' ? 'border-indigo-600' : 'border-transparent'}`}></button>
          <button onClick={() => setColor('#22c55e')} className={`w-8 h-8 rounded-full bg-green-500 border-4 ${color === '#22c55e' ? 'border-indigo-600' : 'border-transparent'}`}></button>
          <button onClick={() => setColor('#3b82f6')} className={`w-8 h-8 rounded-full bg-blue-500 border-4 ${color === '#3b82f6' ? 'border-indigo-600' : 'border-transparent'}`}></button>
          <div className="w-px h-6 bg-gray-100 mx-2"></div>
          <input type="range" min="1" max="10" value={lineWidth} onChange={(e) => setLineWidth(parseInt(e.target.value))} className="w-24" />
        </div>
        <div className="flex gap-2">
          <button onClick={clearCanvas} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black hover:bg-gray-200">إعادة تعيين ↺</button>
          <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-indigo-100">اعتماد التصحيح ✓</button>
        </div>
      </div>
      
      <div className="relative bg-gray-200 rounded-2xl overflow-hidden shadow-inner border-4 border-white cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="max-w-full h-auto"
        />
      </div>
    </div>
  );
};

export default GradingCanvas;
