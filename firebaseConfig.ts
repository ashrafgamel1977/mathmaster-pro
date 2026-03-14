
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// ============================================================================
// إعدادات Firebase - يتم تحميلها من ملف .env (لا تُضاف للكود مباشرة!)
// ============================================================================

// تغيير هذا المتغير إلى true لإجبار التطبيق على العمل في الوضع غير المتصل
const FORCE_OFFLINE = false;

const PERMANENT_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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

  // التحقق من وجود متغيرات البيئة قبل المتابعة
  if (!PERMANENT_CONFIG.apiKey || !PERMANENT_CONFIG.projectId) {
    initializationError = "Firebase config missing. Check your .env file.";
    console.error("❌ Firebase config missing. Make sure .env file exists with VITE_FIREBASE_* variables.");
    return;
  }

  try {
    app = initializeApp(PERMANENT_CONFIG);
    
    try {
      db = initializeFirestore(app, {
         ignoreUndefinedProperties: true
      });
      console.log("✅ Firestore Initialized");
    } catch (e: any) {
      initializationError = `Firestore Init Failed: ${e.message}`;
      console.error("❌ Firestore Init Failed:", e);
      db = null;
    }

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

initFirebase();

export { db, storage };

export const getFirebaseInitError = () => {
    return initializationError;
};

export const isOnlineMode = () => {
  return db !== null;
};

export const isUsingDefaultConfig = () => {
  return FORCE_OFFLINE;
};
