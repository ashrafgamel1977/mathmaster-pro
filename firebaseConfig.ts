
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// ============================================================================
// إعدادات Firebase - يتم التعامل معها بمرونة
// ============================================================================

const PERMANENT_CONFIG = {
  apiKey: "AIzaSyCN2U3fVbLAWV5zrpBnZxxu-XfjRtev3tA", // تأكد من صحة هذا المفتاح في لوحة تحكم Firebase
  authDomain: "mathmaster-pri.firebaseapp.com",
  projectId: "mathmaster-pri",
  storageBucket: "mathmaster-pri.firebasestorage.app",
  messagingSenderId: "784442354442",
  appId: "1:784442354442:web:3760b6b9062420651228f3",
  measurementId: "G-JK1YWQ8ZY7"
};

let app = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let initializationError: string | null = null; // متغير لتخزين رسالة الخطأ

const initFirebase = () => {
  try {
    // التحقق السريع من صحة التكوين قبل المحاولة
    if (!PERMANENT_CONFIG.apiKey || PERMANENT_CONFIG.apiKey.includes('YOUR_API_KEY')) {
      initializationError = "API Key is missing or placeholder.";
      console.warn("⚠️ Firebase Config: Missing API Key. App will run in Offline Mode.");
      return;
    }

    app = initializeApp(PERMANENT_CONFIG);
    
    try {
      db = getFirestore(app);
      console.log("✅ Database Connected");
    } catch (e: any) {
      initializationError = e.message || "Firestore Init Failed";
      console.warn("⚠️ Database Connection Failed (Using Local Storage):", e);
    }

    try {
      storage = getStorage(app);
    } catch (e: any) {
      console.warn("⚠️ Storage Connection Failed (Using Local Encoding):", e);
    }

  } catch (error: any) {
    initializationError = error.message || "Unknown Firebase Init Error";
    console.error("❌ Firebase Critical Init Error (App will continue offline):", error);
  }
};

// تنفيذ التهيئة
initFirebase();

export { db, storage };

// دالة لاسترجاع الخطأ لعرضه في الواجهة
export const getFirebaseInitError = () => {
    return initializationError;
};

// دالة مساعدة للتحقق من حالة النظام
export const isOnlineMode = () => {
  return db !== null;
};

// التحقق مما إذا كان التطبيق يستخدم التكوين الافتراضي (وضع العرض التجريبي/غير المتصل)
export const isUsingDefaultConfig = () => {
  return !PERMANENT_CONFIG.apiKey || PERMANENT_CONFIG.apiKey.includes('YOUR_API_KEY');
};
