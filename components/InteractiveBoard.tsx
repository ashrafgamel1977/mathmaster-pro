
import React, { useState, useCallback, useMemo } from 'react';
import { Tldraw, exportToBlob, Editor, createShapeId, DefaultColorThemePalette } from 'tldraw';
import { MathNotation } from '../types';

interface InteractiveBoardProps {
  imageUrl?: string;
  initialData?: string; // New: JSON string from AI for geometry
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  title?: string;
  initialBackground?: 'grid' | 'blank' | 'dotted';
  notation?: MathNotation;
}

const InteractiveBoard: React.FC<InteractiveBoardProps> = ({ 
  imageUrl,
  initialData, 
  onSave, 
  onCancel, 
  title, 
  initialBackground = 'grid', 
  notation = 'arabic' 
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // استخدام مفتاح فريد في كل مرة لضمان عدم تحميل بيانات قديمة معطوبة
  const persistenceKey = useMemo(() => `board-${Date.now()}-${Math.random().toString(36).substr(2,9)}`, []);

  // دالة تصدير المحتوى كصورة PNG عالية الجودة
  const handleSave = useCallback(async () => {
    if (!editor) return;
    
    setIsExporting(true);
    try {
      const shapeIds = editor.getCurrentPageShapeIds();
      
      if (shapeIds.size === 0) {
        alert("السبورة فارغة! قم برسم شيء ما أولاً.");
        setIsExporting(false);
        return;
      }

      const blob = await exportToBlob({
        editor,
        ids: Array.from(shapeIds),
        format: 'png',
        opts: { background: true }
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        onSave(reader.result as string);
        setIsExporting(false);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Export failed", err);
      alert("عذراً، فشل تصدير الرسم.");
      setIsExporting(false);
    }
  }, [editor, onSave]);

  // --- Quick Tools Handlers ---
  
  const selectTool = (color: 'red' | 'blue' | 'black', size: 's' | 'm' | 'l' | 'xl' = 'm') => {
    if (!editor) return;
    editor.setCurrentTool('draw');
    // Setting styles properly for tldraw
    editor.updateInstanceState({
        stylesForNextShapes: {
            ...editor.getInstanceState().stylesForNextShapes,
            'tldraw:color': color,
            'tldraw:size': size
        }
    });
  };

  const toggleGrid = () => {
    if (!editor) return;
    const isGrid = editor.getInstanceState().isGridMode;
    editor.updateInstanceState({ isGridMode: !isGrid });
  };

  const clearCanvas = () => {
    if (!editor) return;
    // Delete everything EXCEPT locked shapes (images)
    const allShapes = Array.from(editor.getCurrentPageShapeIds());
    const shapesToDelete = allShapes.filter(id => !editor.getShape(id)?.isLocked);
    editor.deleteShapes(shapesToDelete);
  };

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
    
    // إعدادات افتراضية
    editor.updateInstanceState({ isGridMode: initialBackground === 'grid' });

    // 1. معالجة صورة الخلفية (إذا وجدت)
    if (imageUrl) {
        const id = createShapeId('bg-image');
        if(!editor.getShape(id)) {
            editor.createShapes([
                {
                    id,
                    type: 'image',
                    x: 0,
                    y: 0,
                    props: {
                        src: imageUrl,
                        w: 800,
                        h: 1100,
                    },
                    isLocked: true, 
                }
            ]);
        }
    }

    // 2. معالجة بيانات الرسم الهندسي من الذكاء الاصطناعي (إذا وجدت)
    if (initialData) {
        try {
            const parsed = typeof initialData === 'string' ? JSON.parse(initialData) : initialData;
            const elements = parsed.elements || [];
            
            const shapesToCreate: any[] = [];
            
            elements.forEach((el: any, i: number) => {
                const shapeId = createShapeId(`geo_${i}_${Date.now()}`);
                
                // تحويل الألوان
                let colorName = 'black';
                if (el.color?.includes('blue')) colorName = 'blue';
                if (el.color?.includes('red')) colorName = 'red';
                if (el.color?.includes('green')) colorName = 'green';

                if (el.type === 'circle') {
                    shapesToCreate.push({
                        id: shapeId,
                        type: 'geo',
                        x: el.x - el.radius,
                        y: el.y - el.radius,
                        props: {
                            geo: 'ellipse',
                            w: el.radius * 2,
                            h: el.radius * 2,
                            color: colorName,
                            fill: 'none',
                            size: 'm'
                        }
                    });
                    // Label center
                    if (el.label) {
                        shapesToCreate.push({
                            id: createShapeId(`lbl_${i}`),
                            type: 'text',
                            x: el.x - 5,
                            y: el.y - 10,
                            props: { text: el.label, size: 's', color: 'red' }
                        });
                    }
                } else if (el.type === 'triangle' || el.type === 'rect') {
                    // إذا كان هناك نقاط محددة، نستخدم Line لربطها
                    if (el.points && el.points.length > 0) {
                        // إغلاق الشكل
                        const points = [...el.points, el.points[0]]; 
                        // تحويل النقاط إلى إحداثيات نسبية للشكل أو رسم خطوط منفصلة
                        // للأسهل: نرسم خطوط منفصلة
                        for (let j = 0; j < points.length - 1; j++) {
                            const p1 = points[j];
                            const p2 = points[j+1];
                            shapesToCreate.push({
                                id: createShapeId(`line_${i}_${j}`),
                                type: 'arrow', // Arrow بدون رأس يعمل كخط مستقيم جيد
                                x: p1.x,
                                y: p1.y,
                                props: {
                                    start: { x: 0, y: 0 },
                                    end: { x: p2.x - p1.x, y: p2.y - p1.y },
                                    color: colorName,
                                    arrowheadStart: 'none',
                                    arrowheadEnd: 'none'
                                }
                            });
                        }
                        // Labels
                        if (el.labels) {
                            el.labels.forEach((lbl: string, idx: number) => {
                                if (el.points[idx]) {
                                    shapesToCreate.push({
                                        id: createShapeId(`lbl_${i}_${idx}`),
                                        type: 'text',
                                        x: el.points[idx].x + 5,
                                        y: el.points[idx].y + 5,
                                        props: { text: lbl, size: 's', color: 'black' }
                                    });
                                }
                            });
                        }
                    }
                } else if (el.type === 'line') {
                    shapesToCreate.push({
                        id: shapeId,
                        type: 'arrow',
                        x: el.x1,
                        y: el.y1,
                        props: {
                            start: { x: 0, y: 0 },
                            end: { x: el.x2 - el.x1, y: el.y2 - el.y1 },
                            color: colorName,
                            arrowheadStart: 'none',
                            arrowheadEnd: 'none'
                        }
                    });
                } else if (el.type === 'text') {
                    shapesToCreate.push({
                        id: shapeId,
                        type: 'text',
                        x: el.x,
                        y: el.y,
                        props: {
                            text: el.text,
                            color: colorName,
                            size: 'm'
                        }
                    });
                }
            });

            if (shapesToCreate.length > 0) {
                editor.createShapes(shapesToCreate);
            }
        } catch (e) {
            console.error("Failed to parse geometry JSON", e);
        }
    }

    // Zoom to fit content finally
    setTimeout(() => editor.zoomToFit(), 100);

  }, [imageUrl, initialData, initialBackground]);

  return (
    <div className="relative w-full h-full flex flex-col bg-white overflow-hidden rounded-[2.5rem] shadow-2xl border-4 border-white group/board isolate">
      
      {/* شريط التحكم العلوي */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex gap-3 pointer-events-auto bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-100 transition-opacity">
          <div className="px-4 py-2 border-l border-slate-100 hidden md:block">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">اللوحة الحالية</h4>
              <p className="text-xs font-black text-slate-800 truncate max-w-[150px]">{title || 'سبورة المحترف'}</p>
          </div>
          
          <button 
            onClick={onCancel}
            className="px-5 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center gap-2"
          >
            إلغاء ✕
          </button>
          
          <button 
            onClick={handleSave}
            disabled={isExporting}
            className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            {isExporting ? (
                <>
                    <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>جاري الرفع...</span>
                </>
            ) : (
                <>
                    <span>اعتماد ونشر</span>
                    <span>✓</span>
                </>
            )}
          </button>
      </div>

      {/* شريط أدوات المعلم السريع (جانبي) */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 z-[1000] flex flex-col gap-2 pointer-events-auto bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-slate-100">
          <button onClick={() => selectTool('blue', 'm')} className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center hover:scale-110 transition-all" title="قلم أزرق (للكتابة)">
             <div className="w-4 h-4 rounded-full bg-blue-600"></div>
          </button>
          <button onClick={() => selectTool('red', 'l')} className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center hover:scale-110 transition-all" title="قلم أحمر (للتصحيح)">
             <div className="w-5 h-5 rounded-full bg-rose-600 border-2 border-white"></div>
          </button>
          <button onClick={() => selectTool('black', 'm')} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center hover:scale-110 transition-all" title="قلم أسود">
             <div className="w-3 h-3 rounded-full bg-black"></div>
          </button>
          
          <div className="h-px w-6 bg-slate-200 mx-auto my-1"></div>
          
          <button onClick={toggleGrid} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-all" title="شبكة مربعات">
             ▦
          </button>
          <button onClick={clearCanvas} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-all" title="مسح الكل">
             🗑️
          </button>
      </div>

      {/* محرك tldraw الرئيسي */}
      <div className="flex-1 w-full h-full relative min-h-0">
        <Tldraw 
          persistenceKey={persistenceKey}
          onMount={handleMount}
          inferDarkMode={false}
          autoFocus={false}
          dir="ltr"
        />
      </div>

      {/* لمسة جمالية في الأسفل */}
      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-[8px] font-black flex items-center gap-2 shadow-2xl border border-white/10">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
              MathMaster Board v2.1 (AI Ready)
          </div>
      </div>
    </div>
  );
};

export default InteractiveBoard;
