
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// ============================================================================
// إعدادات Firebase الخاصة بمشروع MathMaster Pro (mathmaster-pri)
// ============================================================================

// تغيير هذا المتغير إلى true لإجبار التطبيق على العمل في الوضع غير المتصل (Offline Mode)
// هذا يحل مشكلة "Could not reach Cloud Firestore backend" عند عدم توفر اتصال
const FORCE_OFFLINE = true;

const PERMANENT_CONFIG = {
  apiKey: "AIzaSyCN2U3fVbLAWV5zrpBnZxxu-XfjRtev3tA",
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
let initializationError: string | null = null;

const initFirebase = () => {
  if (FORCE_OFFLINE) {
    console.log("⚠️ Firebase Offline Mode Forced (Connection Errors Prevented)");
    return;
  }

  try {
    // تهيئة التطبيق
    app = initializeApp(PERMANENT_CONFIG);
    
    // محاولة تهيئة قاعدة البيانات باستخدام initializeFirestore للتحكم الأكبر
    try {
      // نستخدم initializeFirestore بدلاً من getFirestore لتجنب بعض الأخطاء التلقائية
      // ignoreUndefinedProperties: true يساعد في تجنب الأخطاء عند تمرير قيم undefined
      db = initializeFirestore(app, {
         ignoreUndefinedProperties: true
      });
      console.log("✅ Firestore Initialized");
    } catch (e: any) {
      initializationError = `Firestore Init Failed: ${e.message}`;
      console.error("❌ Firestore Init Failed:", e);
      // في حالة الفشل، نجعل db null ليتم استخدام الوضع المحلي
      db = null;
    }

    // محاولة تهيئة التخزين
    try {
      storage = getStorage(app);
      console.log("✅ Storage Initialized");
    } catch (e: any) {
      console.warn("⚠️ Storage Init Failed:", e);
      storage = null;
    }

  } catch (error: any) {
    initializationError = error.message || "Unknown Firebase Init Error";
    console.error("❌ Firebase Critical Init Error:", error);
  }
};

// تنفيذ التهيئة
initFirebase();

export { db, storage };

// دالة لاسترجاع الخطأ لعرضه في لوحة التحكم
export const getFirebaseInitError = () => {
    return initializationError;
};

// دالة للتحقق من حالة الاتصال
export const isOnlineMode = () => {
  return db !== null;
};

// هل نستخدم الإعدادات الافتراضية؟ نعم، إذا كان الوضع غير المتصل مفعلاً
export const isUsingDefaultConfig = () => {
  return FORCE_OFFLINE;
};
