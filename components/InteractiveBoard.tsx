
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { solveMathProblem } from '../services/geminiService';
import MathRenderer from './MathRenderer';
import { MathNotation } from '../types';

type Tool = 'pen' | 'highlighter' | 'eraser' | 'line' | 'ruler' | 'circle' | 'rect' | 'triangle' | 'pan';
type Background = 'blank' | 'grid' | 'ruled' | 'coordinates' | 'dark';

interface InteractiveBoardProps {
  imageUrl?: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  title?: string;
  initialBackground?: Background;
  notation?: MathNotation;
}

const COLORS = ['#0f172a', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

const InteractiveBoard: React.FC<InteractiveBoardProps> = ({ imageUrl, onSave, onCancel, title, initialBackground = 'grid', notation = 'arabic' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [bgType, setBgType] = useState<Background>(initialBackground);
  const [color, setColor] = useState('#3b82f6');
  const [lineWidth, setLineWidth] = useState(3);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);

  const getDPR = () => window.devicePixelRatio || 1;

  const drawBackground = useCallback(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = getDPR();
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = bgType === 'dark' ? '#0f172a' : '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const step = 40;
    const gridColor = bgType === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9';
    
    if (bgType === 'grid' || bgType === 'coordinates') {
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y <= h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }
    ctx.restore();
  }, [bgType]);

  const initCanvases = useCallback(() => {
    const parent = containerRef.current;
    if (!parent) return;
    const dpr = getDPR();
    const w = parent.clientWidth;
    const h = parent.clientHeight;

    const setup = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) { 
        ctx.resetTransform();
        ctx.scale(dpr, dpr); 
        ctx.lineCap = 'round'; 
        ctx.lineJoin = 'round'; 
      }
    };

    setup(bgCanvasRef.current); setup(canvasRef.current); setup(tempCanvasRef.current);
    drawBackground();

    if (imageUrl) {
      const ctx = canvasRef.current?.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => { if (ctx) ctx.drawImage(img, 0, 0, w, h); };
    }
  }, [imageUrl, drawBackground]);

  useEffect(() => { 
    initCanvases();
    window.addEventListener('resize', initCanvases);
    return () => window.removeEventListener('resize', initCanvases);
  }, [initCanvases]);

  const screenToWorld = (screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (screenX - rect.left - offset.x) / scale, y: (screenY - rect.top - offset.y) / scale };
  };

  const start = (e: any) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    if (e.button === 1 || tool === 'pan') { setIsPanning(true); lastPanPos.current = { x: clientX, y: clientY }; return; }
    const pos = screenToWorld(clientX, clientY);
    setStartPos(pos);
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && ['pen', 'eraser', 'highlighter'].includes(tool)) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.strokeStyle = tool === 'eraser' ? (bgType === 'dark' ? '#0f172a' : '#ffffff') : color;
      ctx.lineWidth = tool === 'eraser' ? 40 : (tool === 'highlighter' ? lineWidth * 4 : lineWidth);
      ctx.globalAlpha = tool === 'highlighter' ? 0.3 : 1.0;
    }
  };

  const draw = (e: any) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    if (isPanning) {
      setOffset(p => ({ x: p.x + (clientX - lastPanPos.current.x), y: p.y + (clientY - lastPanPos.current.y) }));
      lastPanPos.current = { x: clientX, y: clientY };
      return;
    }
    if (!isDrawing) return;
    const pos = screenToWorld(clientX, clientY);
    const ctx = canvasRef.current?.getContext('2d'), tCtx = tempCanvasRef.current?.getContext('2d');
    if (!ctx || !tCtx) return;
    if (['pen', 'eraser', 'highlighter'].includes(tool)) { ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
    else {
      tCtx.clearRect(0, 0, tempCanvasRef.current!.width, tempCanvasRef.current!.height);
      tCtx.save(); tCtx.beginPath(); tCtx.strokeStyle = color; tCtx.lineWidth = lineWidth;
      const width = pos.x - startPos.x; const height = pos.y - startPos.y;
      if (tool === 'line') { tCtx.moveTo(startPos.x, startPos.y); tCtx.lineTo(pos.x, pos.y); tCtx.stroke(); }
      else if (tool === 'rect') { tCtx.strokeRect(startPos.x, startPos.y, width, height); }
      else if (tool === 'circle') { const r = Math.sqrt(width**2 + height**2); tCtx.arc(startPos.x, startPos.y, r, 0, Math.PI * 2); tCtx.stroke(); }
      tCtx.restore();
    }
  };

  const stop = () => {
    if (isPanning) { setIsPanning(false); return; }
    if (!isDrawing) return;
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d'), tCtx = tempCanvasRef.current?.getContext('2d');
    if (ctx && tCtx && !['pen', 'eraser', 'highlighter'].includes(tool)) {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lineWidth;
      ctx.drawImage(tempCanvasRef.current!, 0, 0, tempCanvasRef.current!.width/getDPR(), tempCanvasRef.current!.height/getDPR());
      tCtx.clearRect(0, 0, tempCanvasRef.current!.width, tempCanvasRef.current!.height);
      ctx.restore();
    }
  };

  const handleAiRecognize = async () => {
    const parent = containerRef.current; if (!parent || !canvasRef.current) return;
    setIsAiAnalyzing(true);
    try {
      const final = document.createElement('canvas'); const dpr = getDPR();
      final.width = parent.clientWidth * dpr; final.height = parent.clientHeight * dpr;
      const fCtx = final.getContext('2d');
      if (fCtx) {
        fCtx.fillStyle = '#ffffff'; fCtx.fillRect(0, 0, final.width, final.height);
        fCtx.drawImage(canvasRef.current!, 0, 0); 
        const base64 = final.toDataURL('image/jpeg', 0.8);
        // Fix: Explicitly cast notation to MathNotation to satisfy solveMathProblem type requirement
        const solution = await solveMathProblem("حل هذه المسألة الرياضية.", { data: base64, mimeType: 'image/jpeg' }, notation as MathNotation);
        setAiAnalysisResult(solution);
      }
    } catch (e) { alert("فشل التحليل."); }
    finally { setIsAiAnalyzing(false); }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden select-none font-['Cairo']" dir="rtl">
      {/* Floating Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
        <div className="glass p-2.5 rounded-[2rem] shadow-xl flex items-center gap-3 border border-slate-200">
          <div className="flex bg-slate-200/50 p-1 rounded-2xl gap-1">
            <button onClick={() => setTool('pen')} className={`p-2 rounded-xl transition-all ${tool === 'pen' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>🖋️</button>
            <button onClick={() => setTool('eraser')} className={`p-2 rounded-xl transition-all ${tool === 'eraser' ? 'bg-white shadow-sm text-rose-500' : 'text-slate-400'}`}>🧽</button>
            <button onClick={() => setTool('rect')} className={`p-2 rounded-xl transition-all ${tool === 'rect' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>⬜</button>
            <button onClick={() => setTool('circle')} className={`p-2 rounded-xl transition-all ${tool === 'circle' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>⭕</button>
          </div>
          <div className="h-6 w-px bg-slate-300"></div>
          <div className="flex gap-1.5">
            {COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${color === c ? 'border-blue-600 scale-110' : 'border-white'}`} style={{backgroundColor: c}} />)}
          </div>
          <div className="h-6 w-px bg-slate-300"></div>
          <button onClick={handleAiRecognize} disabled={isAiAnalyzing} className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-[10px] hover:bg-black transition-all flex items-center gap-2">
            <span>{isAiAnalyzing ? 'جاري التحليل...' : 'حل ذكي'}</span>
            <span>✨</span>
          </button>
          <button onClick={() => onSave(canvasRef.current!.toDataURL())} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-[10px] shadow-lg hover:bg-blue-700 transition-all">حفظ ✓</button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative overflow-hidden cursor-crosshair touch-none">
        <div style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }} className="absolute inset-0">
          <canvas ref={bgCanvasRef} className="absolute inset-0" />
          <canvas ref={canvasRef} onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} className="absolute inset-0" />
          <canvas ref={tempCanvasRef} className="absolute inset-0 pointer-events-none" />
        </div>

        {aiAnalysisResult && (
          <div className="absolute top-24 left-6 z-[60] glass p-6 rounded-[2rem] shadow-2xl max-w-xs animate-slideUp border border-blue-100">
             <div className="flex justify-between items-center mb-4 border-b border-blue-50 pb-2">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">النتائج ✨</span>
                <button onClick={() => setAiAnalysisResult(null)} className="text-slate-400 text-[10px]">إغلاق</button>
             </div>
             <div className="max-h-80 overflow-y-auto no-scrollbar text-sm">
                <MathRenderer content={aiAnalysisResult} inline />
             </div>
          </div>
        )}

        {/* Bg Toggler */}
        <div className="absolute bottom-6 left-6 z-40 glass p-1.5 rounded-2xl flex gap-1 border border-slate-200">
          {(['blank', 'grid', 'ruled', 'dark'] as Background[]).map(b => (
            <button key={b} onClick={() => setBgType(b)} className={`px-4 py-2 rounded-xl text-[9px] font-bold transition-all ${bgType === b ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
              {b === 'blank' ? 'سادة' : b === 'grid' ? 'مربعات' : b === 'ruled' ? 'مسطر' : 'ليلي'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractiveBoard;
