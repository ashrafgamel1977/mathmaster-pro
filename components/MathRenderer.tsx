
import React, { useMemo } from 'react';

// @ts-ignore
import katex from 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.mjs';

interface MathRendererProps {
  content: string;
  inline?: boolean;
  className?: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content, inline = false, className = "" }) => {
  // دالة لتقسيم النص ومعالجة الأجزاء الرياضية
  const renderedContent = useMemo(() => {
    if (!content) return null;

    // تنظيف النص من أي هروب زائد قد يأتي من الـ JSON
    const sanitized = content.replace(/\\\\/g, '\\');
    
    // Regex مطور للبحث عن $...$ أو $$...$$ حتى لو كان ملتصقاً بنص عربي
    const parts = sanitized.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$')) {
        const isDisplayMode = part.startsWith('$$');
        const math = part.replace(/\$\$/g, '').replace(/\$/g, '').trim();
        
        try {
          const html = katex.renderToString(math, {
            throwOnError: false,
            displayMode: isDisplayMode,
            trust: true,
            strict: false,
            macros: {
              "\\س": "s",
              "\\ص": "y",
              "\\ع": "z",
              "\\د": "d"
            }
          });
          return (
            <span 
              key={index} 
              className={`${isDisplayMode ? "block my-6 py-2 overflow-x-auto no-scrollbar text-center" : "inline-block mx-1 align-middle"} math-content`}
              style={{ fontSize: inline ? '1.15em' : '1.25em' }}
              dangerouslySetInnerHTML={{ __html: html }} 
            />
          );
        } catch (e) {
          console.error("KaTeX Error:", e);
          return <span key={index} className="text-rose-500 font-mono text-xs">{part}</span>;
        }
      }
      
      // معالجة النصوص العادية (Markdown بسيط)
      const textWithBr = part.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i !== part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
      
      return <span key={index}>{textWithBr}</span>;
    });
  }, [content, inline]);

  return (
    <div className={`${className} ${inline ? 'inline' : 'block'} leading-[1.8] text-right font-medium`} dir="rtl">
      {renderedContent}
    </div>
  );
};

export default MathRenderer;
