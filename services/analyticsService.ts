
import { QuizResult, QuestionAttempt } from '../types';

/**
 * analyticsService.ts
 * مسئول عن تحليل أداء الطالب واكتشاف نقاط القوة والضعف بناءً على الدروس
 */

export interface TopicPerformance {
  topic: string;
  totalAttempts: number;
  correctAttempts: number;
  scorePercentage: number;
  status: 'excellent' | 'good' | 'average' | 'weak';
}

/**
 * تحليل النتائج للتعرف على الموضوعات التي تحتاج مراجعة
 */
export const analyzeStudentPerformance = (results: QuizResult[]): TopicPerformance[] => {
  const topicStats: Record<string, { total: number, correct: number }> = {};

  results.forEach(result => {
    if (result.attempts) {
      result.attempts.forEach(attempt => {
        const topic = attempt.topic || 'عام';
        if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
        
        topicStats[topic].total++;
        if (attempt.isCorrect) {
          topicStats[topic].correct++;
        }
      });
    }
  });

  return Object.entries(topicStats).map(([topic, stats]) => {
    const percentage = Math.round((stats.correct / stats.total) * 100);
    let status: TopicPerformance['status'] = 'excellent';
    
    if (percentage < 50) status = 'weak';
    else if (percentage < 70) status = 'average';
    else if (percentage < 85) status = 'good';

    return {
      topic,
      totalAttempts: stats.total,
      correctAttempts: stats.correct,
      scorePercentage: percentage,
      status
    };
  });
};

/**
 * جلب الموضوعات "الضعيفة" التي تحتاج تركيز
 */
export const getWeakPoints = (performances: TopicPerformance[]) => {
  return performances.filter(p => p.status === 'weak' || p.status === 'average')
    .sort((a, b) => a.scorePercentage - b.scorePercentage);
};

/**
 * حساب متوسط الدرجات عبر الزمن
 */
export const calculateScoreTrend = (results: QuizResult[]) => {
  return results
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => ({ date: r.date, score: r.score }));
};
