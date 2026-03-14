
import { PlatformSettings } from '../types';

/**
 * whatsappService.ts
 * مسئول عن إرسال رسائل واتساب تلقائية باستخدام مزودين مختلفين
 * مستوحى من نظام منصة نور (SQL)
 */

export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  let clean = phone.replace(/[^\d+]/g, '');
  // مصر: 01xxxxxxxxx -> 201xxxxxxxxx
  if (clean.startsWith('0') && !clean.startsWith('00')) {
    clean = '2' + clean;
  }
  if (!clean.startsWith('+')) {
    clean = '+' + clean;
  }
  return clean;
};

export const sendWhatsAppMessage = async (
  settings: PlatformSettings,
  to: string,
  message: string
) => {
  const provider = settings.whatsappProvider || 'none';
  const token = settings.whatsappToken;
  const instance = settings.whatsappInstance;
  const phone = formatPhone(to);

  if (provider === 'none' || !token) {
    // Fallback: Open WhatsApp Web/App link
    const url = `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    return { ok: true, mode: 'link' };
  }

  try {
    if (provider === 'ultramsg' && instance) {
      const response = await fetch(`https://api.ultramsg.com/${instance}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: token,
          to: phone,
          body: message
        })
      });
      const data = await response.json();
      return { ok: data.sent === 'true' || data.id, data };
    }

    if (provider === 'meta' && settings.whatsappPhoneFrom) {
      const response = await fetch(`https://graph.facebook.com/v18.0/${settings.whatsappPhoneFrom}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone.replace('+', ''),
          type: "text",
          text: { body: message }
        })
      });
      const data = await response.json();
      return { ok: !!data.messages, data };
    }

    if (provider === 'callmebot') {
       const encoded = encodeURIComponent(message);
       const phoneClean = phone.replace('+', '');
       const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneClean}&text=${encoded}&apikey=${token}`;
       await fetch(url, { mode: 'no-cors' }); // CallMeBot often works with no-cors for simple GET
       return { ok: true, mode: 'callmebot' };
    }

    return { ok: false, error: 'مزود غير مدعوم' };
  } catch (error) {
    console.error('WhatsApp Send Error:', error);
    return { ok: false, error };
  }
};

export const sendQuizResultToParent = async (
  settings: PlatformSettings,
  studentName: string,
  parentPhone: string,
  quizTitle: string,
  score: number
) => {
  const emoji = score >= 90 ? '🏆' : score >= 75 ? '✅' : '👍';
  const message = `📊 *تقرير نتيجة اختبار — ${settings.platformName}*\n\n` +
    `نود إبلاغكم بأن الطالب/ة *${studentName}* قد حصل في اختبار *"${quizTitle}"* على:\n` +
    `الدرجة: *${score}%* ${emoji}\n\n` +
    `نتمنى له/لها دوام التوفيق والنجاح. 🌟`;
  
  return await sendWhatsAppMessage(settings, parentPhone, message);
};
