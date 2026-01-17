
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// ============================================================================
// 🛑 منطقة التعديل: هنا تضع "المفتاح" الذي جلبته من موقع Firebase
// ============================================================================

const PERMANENT_CONFIG = {
  // 1. انسخ الـ apiKey من موقع Firebase وضعه هنا بدلاً من النص الموجود
  apiKey: "AIzaSyD-YOUR_API_KEY_HERE", 
  
  // 2. انسخ الـ authDomain وضعه هنا
  authDomain: "your-project-id.firebaseapp.com",
  
  // 3. انسخ الـ projectId وضعه هنا (مهم جداً)
  projectId: "your-project-id",
  
  // 4. انسخ الـ storageBucket وضعه هنا
  storageBucket: "your-project-id.appspot.com",
  
  // 5. انسخ الـ messagingSenderId وضعه هنا
  messagingSenderId: "123456789",
  
  // 6. انسخ الـ appId وضعه هنا
  appId: "1:123456789:web:abcdef"
};

// ============================================================================
// لا تقم بتعديل أي شيء أسفل هذا الخط ⛔
// ============================================================================

const getConfig = () => {
  // استخدام البيانات المباشرة إذا تم تعديلها من قبل المبرمج
  if (PERMANENT_CONFIG.apiKey && !PERMANENT_CONFIG.apiKey.includes('YOUR_API_KEY')) {
    return PERMANENT_CONFIG;
  }

  // محاولة جلب الإعدادات من الذاكرة المؤقتة (للمعاينة السريعة)
  try {
    const stored = localStorage.getItem('math_firebase_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Config Error', e);
  }

  return PERMANENT_CONFIG;
};

const config = getConfig();
let app;
let db: Firestore;

try {
  app = initializeApp(config);
  db = getFirestore(app);
  console.log("Firebase Initialized with Project:", config.projectId);
} catch (error) {
  console.error("Firebase Init Error - تأكد من وضع مفاتيح الربط الصحيحة في ملف firebaseConfig.ts", error);
}

export { db };

// دوال مساعدة للتحقق من الحالة
export const isUsingDefaultConfig = () => {
  if (PERMANENT_CONFIG.apiKey && !PERMANENT_CONFIG.apiKey.includes('YOUR_API_KEY')) {
    return false;
  }
  const stored = localStorage.getItem('math_firebase_config');
  return !stored;
};

export const saveConfig = (newConfig: any) => {
  localStorage.setItem('math_firebase_config', JSON.stringify(newConfig));
  window.location.reload();
};

export const resetConfig = () => {
  localStorage.removeItem('math_firebase_config');
  window.location.reload();
};
