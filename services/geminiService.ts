
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MathNotation } from "../types";

const getSystemInstruction = (notation: MathNotation) => {
  return `أنت خبير رياضيات. لغة العمل: العربية. التنسيق: LaTeX. النمط: ${notation}.`;
};

export const solveMathProblem = async (problem: string, imageData?: { data: string, mimeType: string }, notation: MathNotation = 'arabic') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [{ text: problem || "حل المسألة." }];
  if (imageData) {
    parts.push({ inlineData: { data: imageData.data.split(',')[1], mimeType: imageData.mimeType } });
  }
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: { 
      systemInstruction: getSystemInstruction(notation), 
      temperature: 0.1,
    }
  });
  return response.text?.trim() || "";
};

export const analyzeStudentWork = async (imageData: { data: string, mimeType: string }, notation: MathNotation = 'arabic') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: imageData.data.split(',')[1], mimeType: imageData.mimeType } },
        { text: "صحح هذه الورقة." }
      ]
    },
    config: {
      systemInstruction: getSystemInstruction(notation),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedGrade: { type: Type.INTEGER },
          feedback: { type: Type.STRING }
        },
        required: ["suggestedGrade", "feedback"]
      }
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
    },
  });
};

export const generateQuizFromContent = async (topic: string, imageData?: { data: string, mimeType: string }, notation: MathNotation = 'arabic', difficulty: string = 'medium', qCount: number = 5) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        ...(imageData ? [{ inlineData: { data: imageData.data.split(',')[1], mimeType: imageData.mimeType } }] : []),
        { text: `ولد اختباراً حول ${topic} مكون من ${qCount} أسئلة.` }
      ]
    },
    config: {
      systemInstruction: getSystemInstruction(notation),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.INTEGER }
          },
          required: ["question", "options", "correctAnswer"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};
