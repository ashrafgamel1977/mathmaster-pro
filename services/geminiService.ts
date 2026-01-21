
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MathNotation } from "../types";

// --- خريطة توجيه المناهج المصرية ---
const getCurriculumRules = (yearName: string) => {
  if (yearName.includes('إعدادي')) {
    return `
    - المرحلة: تعليم أساسي (مرحلة إعدادية - مصر).
    - القيود: التزم بالقوانين الأساسية للهندسة المستوية والجبر البسيط. ممنوع استخدام التفاضل أو التكامل.
    - الرموز: استخدم الرموز العربية (س، ص، ع) والأرقام الهندية (١، ٢، ٣) إذا كان النمط عربي، أو (x, y) والأرقام العربية (1, 2) لمدارس اللغات.
    - التنسيق: خطوات الحل يجب أن تكون بسيطة ومباشرة (بما أن... إذن...).
    `;
  } else if (yearName.includes('ثانوي')) {
    return `
    - المرحلة: تعليم ثانوي (مرحلة الثانوية العامة - مصر).
    - القيود: التزم بطرق الحل المعتمدة في كتب الوزارة المصرية للصفوف الثانوية.
    - تنبيه هام للتفاضل: لا تستخدم "قاعدة لوبيتال" (L'Hopital's rule) في حساب النهايات إلا للتحقق، الحل يجب أن يكون بالخطوات الجبرية والقوانين المقررة.
    - الرموز: التزم بنمط الرموز المحدد (عربي/لغات). في العربي: جا، جتا، ظا، قا، قتا، ظتا.
    `;
  }
  return "- التزم بمناهج الرياضيات المصرية العامة.";
};

const getSystemInstruction = (notation: MathNotation, yearName: string = 'عام', referenceText: string = '') => {
  const curriculumContext = getCurriculumRules(yearName);
  
  // --- تعليمات الرسم البرمجي ---
  const drawingInstructions = `
  **بروتوكول الرسم الهندسي (Strict Geometry Visualization):**
  إذا تطلب الشرح رسم شكل هندسي (مثلث، دائرة، دالة...)، لا تصفه بالكلمات فقط.
  يجب عليك توليد كود JSON خاص في نهاية ردك لرسم الشكل برمجياً.
  التنسيق المطلوب:
  ||DRAWING_JSON||
  {
    "elements": [
      { "type": "triangle", "points": [{"x": 100, "y": 200}, {"x": 300, "y": 200}, {"x": 200, "y": 50}], "color": "#3b82f6", "labels": ["أ", "ب", "ج"] },
      { "type": "circle", "x": 200, "y": 150, "radius": 50, "color": "#ef4444" }
    ]
  }
  ||END_DRAWING||
  `;

  let groundingInstruction = "";
  if (referenceText) {
      groundingInstruction = `
      🚨 **قاعدة الالتزام بالمصدر (STRICT GROUNDING):**
      أمامك "نص مرجعي" يمثل (كتاب الوزارة/المذكرة المعتمدة).
      1. يجب أن تكون إجابتك مستمدة **حصرياً** من هذا النص قدر الإمكان.
      2. استخدم نفس المصطلحات، نفس الرموز، ونفس طرق الحل الموجودة في النص.
      
      --- النص المرجعي ---
      ${referenceText.substring(0, 50000)} ... (نهاية المقتطف)
      ---------------------
      `;
  }

  return `
  أنت معلم رياضيات مصري خبير ومصحح وزاري معتمد.
  
  ${groundingInstruction}

  تعليمات عامة:
  1. **المرجعية:** مصدرك الوحيد هو المنهج المصري والمصادر المرفقة.
  2. **طريقة الحل:** استخدم الخطوات التقليدية (بما أن ∵ ... إذن ∴).
  3. **الصف الدراسي:** الطالب في مرحلة: "${yearName}".
  4. **اللغة والرموز:** ${notation === 'english' ? 'English Symbols (x, y)' : 'Arabic Symbols (س، ص)'}.
  5. **التنسيق:** LaTeX للمعادلات داخل $$.

  ${drawingInstructions}

  سياق المنهج:
  ${curriculumContext}
  `;
};

export const solveMathProblem = async (problem: string, imageData?: { data: string, mimeType: string }, notation: MathNotation = 'arabic', yearName: string = 'عام', referenceText: string = '') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];
  
  if (imageData) {
    parts.push({ inlineData: { data: imageData.data.split(',')[1], mimeType: imageData.mimeType } });
    const promptText = problem 
      ? `السؤال المرفق مع الصورة: ${problem}\n\nقم بتحليل الصورة، استخراج المسألة، وحلها وفق المصادر المعتمدة.`
      : "قم بتحليل الصورة بدقة، استخرج المسألة الرياضية كاملة، ثم قدم الحل التفصيلي.";
    parts.push({ text: promptText });
  } else {
    parts.push({ text: problem || "حل المسألة التالية بالتفصيل." });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: { 
      systemInstruction: getSystemInstruction(notation, yearName, referenceText), 
      temperature: 0.2, 
      thinkingConfig: { thinkingBudget: 2048 }
    }
  });
  return response.text?.trim() || "";
};

export const analyzeStudentWork = async (imageData: { data: string, mimeType: string }, notation: MathNotation = 'arabic', yearName: string = 'عام') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: imageData.data.split(',')[1], mimeType: imageData.mimeType } },
        { text: "صحح هذه الورقة بدقة كأنك مصحح في امتحان رسمي مصري." }
      ]
    },
    config: {
      systemInstruction: getSystemInstruction(notation, yearName),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedGrade: { type: Type.INTEGER },
          feedback: { type: Type.STRING }
        },
        required: ["suggestedGrade", "feedback"]
      },
      thinkingConfig: { thinkingBudget: 1024 }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const createLiveSession = async (callbacks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: "أنت مدرس رياضيات مصري. تحدث باللهجة المصرية البيضاء المحترمة."
    },
  });
};

export const generateQuizFromContent = async (topic: string, imageData?: { data: string, mimeType: string }, notation: MathNotation = 'arabic', difficulty: string = 'medium', qCount: number = 5, yearName: string = 'عام', referenceText: string = '') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        ...(imageData ? [{ inlineData: { data: imageData.data.split(',')[1], mimeType: imageData.mimeType } }] : []),
        { text: `ولد اختباراً حول ${topic} للصف ${yearName} بمستوى صعوبة ${difficulty} مكون من ${qCount} أسئلة.` }
      ]
    },
    config: {
      systemInstruction: getSystemInstruction(notation, yearName, referenceText),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.INTEGER },
            branch: { type: Type.STRING, enum: ['algebra', 'geometry', 'calculus', 'trig', 'statics', 'dynamics'] }
          },
          required: ["question", "options", "correctAnswer", "branch"]
        }
      },
      thinkingConfig: { thinkingBudget: 1024 }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const findEducationalResources = async (topic: string, count: number = 6) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: `Find ${count} high-quality, free educational YouTube video suggestions for: "${topic}". Focus on Egyptian Math channels.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING },
            channel: { type: Type.STRING },
            duration: { type: Type.STRING }
          },
          required: ["title", "url", "channel"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const generateThemeConfig = async (description: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: `Generate a UI theme configuration based on: "${description}". Return JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryColor: { type: Type.STRING },
            secondaryColor: { type: Type.STRING },
            fontFamily: { type: Type.STRING, enum: ['Cairo', 'Tajawal', 'Almarai', 'El Messiri'] }
          },
          required: ["primaryColor", "secondaryColor", "fontFamily"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
};

export const generateParentReport = async (
  studentName: string, 
  attendanceRate: number, 
  avgScore: number, 
  isPaid: boolean,
  teacherName: string,
  periodType: string = 'أسبوعي',
  attendanceCount: number = 0
) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let prompt = "";
    
    let toneInstruction = "";
    if (avgScore >= 85) toneInstruction = "النبرة: فخر، تشجيع قوي، تهنئة.";
    else if (avgScore >= 70) toneInstruction = "النبرة: إيجابية، تحفيز للاستمرار.";
    else if (avgScore >= 50) toneInstruction = "النبرة: هادئة، تنبيه لطيف، دعوة للمتابعة.";
    else toneInstruction = "النبرة: حازمة بتهذيب، قلق أبوي، طلب تعاون عاجل.";

    prompt = `
      أنت مساعد شخصي للمعلم "${teacherName}".
      المهمة: كتابة رسالة واتساب بسيطة جداً وغير رسمية لولي أمر الطالب "${studentName}".
      
      نوع التقرير: ${periodType}.
      
      البيانات:
      - مستوى الدرجات (متوسط): ${avgScore}%
      - الحضور: ${attendanceCount > 0 ? 'حضر وتفاعل' : 'غياب أو قلة مشاركة'}
      - المصروفات: ${isPaid ? 'مدفوعة' : 'عليه متأخرات'}

      ${toneInstruction}

      تعليمات الصياغة (هام جداً):
      1. ابدأ بـ "أهلاً ولي أمر الطالب..."
      2. لا تستخدم مصطلحات معقدة.
      3. استخدم الرموز التعبيرية (Emojis).
      4. اختصر الكلام.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: { temperature: 0.7 }
    });
    return response.text?.trim() || "";
};

export const generateDailySummary = async (stats: any[], teacherName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    أنت مستشار إداري لسنتر تعليمي يديره الأستاذ "${teacherName}".
    لديك إحصائيات نهاية اليوم للحضور والغياب في المجموعات المختلفة.
    
    البيانات (JSON):
    ${JSON.stringify(stats)}
    
    المطلوب:
    اكتب "تقرير إغلاق اليوم" موجز وموجه للمدير (الأستاذ).
    1. ابدأ بملخص سريع (إجمالي الحضور والغياب في السنتر اليوم).
    2. اذكر المجموعة الأفضل في الحضور (النجم).
    3. نبه على المجموعة التي بها نسبة غياب مقلقة (إن وجدت).
    4. قدم نصيحة إدارية واحدة بناءً على الأرقام.
    
    الأسلوب: مهني، مختصر، مدير لمدير. استخدم النقاط (Bullet points).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }] },
    config: { temperature: 0.4 }
  });
  return response.text?.trim() || "";
};

// NEW: Analyze weak students and suggest remedial plan
export const generateRemedialPlan = async (weakStudentsData: any[], teacherName: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    أنت خبير تربوي ومساعد للأستاذ "${teacherName}".
    لديك قائمة بطلاب حصلوا على درجات ضعيفة في الاختبارات الأخيرة.
    
    البيانات (JSON):
    ${JSON.stringify(weakStudentsData)}
    
    المطلوب:
    1. حدد نقاط الضعف المشتركة (إن وجدت بناءً على أسماء الاختبارات).
    2. اقترح "خطة علاجية" قصيرة (مثلاً: حصة مراجعة، ورقة عمل إضافية، فيديو معين).
    3. صغ رسالة تشجيعية عامة يمكن إرسالها لجروب هؤلاء الطلاب.
    
    الرد يجب أن يكون بتنسيق Markdown منظم.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }] },
    config: { temperature: 0.5 }
  });
  return response.text?.trim() || "تعذر تحليل البيانات.";
};

export const explainWrongAnswer = async (question: string, userAnswer: string, correctAnswer: string, notation: MathNotation = 'arabic', yearName: string = 'عام', referenceText: string = '') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    الطالب في الصف: ${yearName}.
    السؤال: ${question}
    إجابة الطالب: ${userAnswer}
    الإجابة الصحيحة: ${correctAnswer}
    اشرح الخطأ وكيفية الحل الصحيح بناء على المصدر المرفق (إن وجد).
  `;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      systemInstruction: getSystemInstruction(notation, yearName, referenceText),
      temperature: 0.5,
    }
  });
  return response.text?.trim() || "تعذر توليد الشرح.";
};

export const refineGeometrySketch = async (imageData: { data: string, mimeType: string }, notation: MathNotation = 'arabic') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    أنت محرك هندسي خبير. مهمتك تحويل الرسم اليدوي المرفق (Sketch) إلى بيانات هندسية دقيقة (Vector Data) ليتم رسمها برمجياً.
    
    1. تعرف على الأشكال الهندسية في الصورة (دوائر، مثلثات، خطوط، مماسات).
    2. استخدم الرموز المناسبة: ${notation === 'arabic' ? 'استخدم حروف عربية (أ، ب، ج، م)' : 'Use English letters (A, B, C, M)'}.
    3. أعد JSON يصف العناصر بدقة عالية. اجعل الخطوط مستقيمة، والدوائر مثالية.
    
    Format:
    {
      "elements": [
        { "type": "circle", "x": 300, "y": 200, "radius": 100, "label": "م", "color": "#000000" },
        { "type": "line", "x1": 200, "y1": 200, "x2": 400, "y2": 200, "label": "أ ب", "color": "#000000" },
        { "type": "text", "x": 310, "y": 210, "text": "م", "color": "#ef4444" }
      ]
    }
    
    Supported types: 'circle', 'line', 'triangle', 'rect', 'text'.
    For triangle/rect use 'points': [{x,y}, ...]
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: imageData.data.split(',')[1], mimeType: imageData.mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          elements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                radius: { type: Type.NUMBER },
                x1: { type: Type.NUMBER },
                y1: { type: Type.NUMBER },
                x2: { type: Type.NUMBER },
                y2: { type: Type.NUMBER },
                w: { type: Type.NUMBER },
                h: { type: Type.NUMBER },
                text: { type: Type.STRING },
                label: { type: Type.STRING },
                color: { type: Type.STRING },
                points: { 
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '{"elements": []}');
};

export const extractTextFromMedia = async (fileData: { data: string, mimeType: string }) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Extract ALL text from this document/image verbatim. 
    Maintain the structure, formulas, and content as accurately as possible.
    If it contains mathematical equations, convert them to LaTeX format enclosed in $.
    Ignore page numbers or headers if they are irrelevant to the content.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', 
    contents: {
      parts: [
        { inlineData: { data: fileData.data.split(',')[1], mimeType: fileData.mimeType } },
        { text: prompt }
      ]
    },
    config: {
      temperature: 0.1, 
    }
  });
  return response.text?.trim() || "";
};
