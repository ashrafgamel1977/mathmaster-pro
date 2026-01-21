
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// ============================================================================
// ✅ تم ربط التطبيق بقاعدة البيانات الخاصة بك بنجاح
// ============================================================================

const PERMANENT_CONFIG = {
  apiKey: "AIzaSyCN2U3fVbLAWV5zrpBnZxxu-XfjRtev3tA",
  authDomain: "mathmaster-pri.firebaseapp.com",
  projectId: "mathmaster-pri",
  storageBucket: "mathmaster-pri.firebasestorage.app",
  messagingSenderId: "784442354442",
  appId: "1:784442354442:web:3760b6b9062420651228f3",
  measurementId: "G-JK1YWQ8ZY7"
};

// ============================================================================
// لا تقم بتعديل أي شيء أسفل هذا الخط ⛔
// ============================================================================

const getConfig = () => {
  return PERMANENT_CONFIG;
};

const config = getConfig();
let app;
let db: Firestore;
let storage: FirebaseStorage;

const isConfigValid = config.apiKey && !config.apiKey.includes('YOUR_API_KEY');

if (isConfigValid) {
  try {
    app = initializeApp(config);
    
    // Using standard getFirestore to avoid bundle mismatch issues
    try {
        db = getFirestore(app);
    } catch (err) {
        console.error("Firestore Init Error:", err);
    }

    try {
      storage = getStorage(app);
    } catch (storageError) {
      console.warn("Storage service not available (Running with Database only).");
    }
    console.log("Firebase Initialized Successfully ✅");
  } catch (error) {
    console.error("Firebase Init Error ❌", error);
  }
} else {
  console.log("⚠️ التطبيق يعمل في وضع المحاكاة (Demo Mode) لعدم وجود مفاتيح Firebase.");
}

export { db, storage };

export const isUsingDefaultConfig = () => {
  if (PERMANENT_CONFIG.apiKey && !PERMANENT_CONFIG.apiKey.includes('YOUR_API_KEY')) {
    return false; // التطبيق يعمل أونلاين
  }
  return true; 
};

export const saveConfig = (newConfig: any) => {
  try {
    localStorage.setItem('math_firebase_config', JSON.stringify(newConfig));
    window.location.reload();
  } catch (e) {
    console.error("Failed to save config", e);
  }
};

export const resetConfig = () => {
  localStorage.removeItem('math_firebase_config');
  window.location.reload();
};
