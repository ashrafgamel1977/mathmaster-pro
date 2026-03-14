
import { Quiz, QuestionAttempt } from '../types';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface AssistantResponse {
  text: string;
  type: 'summary' | 'explanation' | 'chat' | 'flashcards' | 'quiz';
  data?: any;
}

/**
 * AI Assistant Service
 * This service simulates AI capabilities for video summarization, 
 * explanation, flashcard generation, and quiz creation.
 */
export const aiAssistantService = {
  /**
   * Generates a summary for a video lesson.
   */
  async summarizeVideo(videoId: string, title: string): Promise<AssistantResponse> {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    
    return {
      type: 'summary',
      text: `ملخص فيديو: ${title}\n\nيغطي هذا الدرس المفاهيم الأساسية التالية:\n1. مقدمة شاملة للموضوع وأهميته في المنهج.\n2. شرح القوانين الأساسية وكيفية تطبيقها في المسائل المختلفة.\n3. تحليل الأمثلة المتقدمة التي وردت في الامتحانات السابقة.\n4. نصائح ذهبية لتجنب الأخطاء الشائعة أثناء الحل.`
    };
  },

  /**
   * Generates an easy explanation for complex content.
   */
  async explainSimply(videoId: string, topic: string): Promise<AssistantResponse> {
    await new Promise(r => setTimeout(r, 2000));
    
    return {
      type: 'explanation',
      text: `تبسيط موضوع: ${topic}\n\nتخيل أن الأمر يشبه... (شرح مبسط باستخدام أمثلة من حياتنا اليومية للحث على الفهم العميق بدلاً من الحفظ). نحن هنا نركز على المنطق وراء القاعدة الرياضية/الفيزيائية لجعلها عالقة في ذهلك للأبد.`
    };
  },

  /**
   * Generates flashcards for active recall.
   */
  async generateFlashcards(videoId: string): Promise<Flashcard[]> {
    await new Promise(r => setTimeout(r, 1200));
    
    return [
      { id: 'fc1', front: 'ما هو القانون الأول لنيوتن؟', back: 'يبقى الجسم الساكن ساكناً والجسم المتحرك متحركاً ما لم تؤثر عليه قوة خارجية.' },
      { id: 'fc2', front: 'ما هي وحدة قياس القوة؟', back: 'النيوتن (Newton).' },
      { id: 'fc3', front: 'متى تنعدم السرعة النهائية؟', back: 'عندما يتوقف الجسم تماماً عن الحركة أو يصل لأقصى ارتفاع.' },
    ];
  },

  /**
   * Generates a quick quiz for the lesson.
   */
  async generateQuickQuiz(videoId: string, title: string): Promise<Partial<Quiz>> {
    await new Promise(r => setTimeout(r, 2000));
    
    return {
      id: 'ai-quiz-' + Date.now(),
      title: `اختبار ذكي: ${title}`,
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          question: 'بناءً على ما تعلمته في الفيديو، ما هو العامل المؤثر الأساسي في المعادلة؟',
          options: ['الكتلة', 'السرعة', 'الزمن', 'المسافة'],
          correctAnswer: 0,
          points: 10,
          difficulty: 'medium'
        },
        {
          id: 'q2',
          type: 'mcq',
          question: 'أي من الوحدات التالية تعتبر وحدة دولية للمقدار المشروح؟',
          options: ['متر', 'ثانية', 'نيوتن', 'جول'],
          correctAnswer: 2,
          points: 10,
          difficulty: 'easy'
        }
      ]
    };
  },

  /**
   * General chat handler.
   */
  async askQuestion(question: string): Promise<string> {
    await new Promise(r => setTimeout(r, 1000));
    
    const q = question.toLowerCase();
    if (q.includes('قانون') || q.includes('شرح')) {
      return "سؤال ممتاز! هذا يتعلق بالجزء الثاني من الدرس حيث شرحنا العلاقة الطردية بين المتغيرين. هل تريد مني إعادة شرحها بمثال عملي؟";
    }
    if (q.includes('امتحان') || q.includes('درجة')) {
      return "لا تقلق من الامتحان، هذا الجزء يتكرر كثيراً في الامتحانات السابقة بنسبة 80%، ركز فقط على فهم القاعدة الأساسية.";
    }
    
    return "أنا معك يا بطل! سؤالك رائع جداً، يبدو أنك تركز في التفاصيل. هل هناك نقطة محددة في الفيديو لفتت انتباهك؟";
  }
};
