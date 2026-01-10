
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// ============================================================================
// منطقة التعديل (أهم خطوة)
// ============================================================================
// 1. امسح كل ما بداخل القوسين { } في الأسفل
// 2. الصق الكود الذي نسخته من Firebase (الذي يبدأ بـ apiKey, authDomain...)
// ============================================================================

const PERMANENT_CONFIG = {
  // --- امسح هذا السطر وما تحته والصق بياناتك الحقيقية هنا ---
  apiKey:"AIzaSyCN2U3fVbLAWV5zrpBnZxxu-XfjRtev3tA",  
  authDomain: "mathmaster-pri.firebaseapp.com",  
  projectId: "mathmaster-pri",  
  storageBucket:"mathmaster-pri.firebasestorage.app",
  messagingSenderId: "784442354442",  
  appId:"1:784442354442:web:5a0b4772c144d4e01228f3",  
  // ---------------------------------------------------------
};

// ============================================================================
// لا تقم بتعديل أي شيء أسفل هذا الخط
// ============================================================================

const getConfig = () => {
  // If user put real data in PERMANENT_CONFIG, use it
  if (PERMANENT_CONFIG.apiKey && !PERMANENT_CONFIG.apiKey.includes('YOUR_API_KEY')) {
    return PERMANENT_CONFIG;
  }

  // Otherwise, try local storage (for development/owner only)
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
} catch (error) {
  console.error("Firebase Init Error:", error);
  // Fail gracefully to allow ConfigScreen to show
}

export { db };

export const isUsingDefaultConfig = () => {
  // Returns true if we are still using placeholders (need to show setup screen)
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
