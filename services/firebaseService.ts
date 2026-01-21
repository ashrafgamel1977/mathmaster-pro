
import { db, storage } from '../firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  query
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// دالة التحقق من جاهزية قاعدة البيانات
const isDbReady = () => {
  if (!db) return false;
  return true;
};

export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void, onError?: (error: any) => void) => {
  try {
    if (!isDbReady()) {
       console.warn(`Database not ready. Skipping sync for: ${collectionName}`);
       return () => {}; 
    }

    const q = query(collection(db, collectionName));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      callback(data);
    }, (error) => {
      console.error(`Sync Error [${collectionName}]:`, error);
      if (onError) onError(error);
    });
  } catch (e) {
    if (onError) onError(e);
    return () => {};
  }
};

export const saveData = async (collectionName: string, data: any) => {
  if (!isDbReady()) throw new Error("Firebase not configured");
  try {
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error(`Save Error [${collectionName}]:`, error);
    throw error;
  }
};

export const removeData = async (collectionName: string, id: string) => {
  if (!isDbReady()) throw new Error("Firebase not configured");
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error(`Delete Error [${collectionName}]:`, error);
    throw error;
  }
};

export const updatePartialData = async (collectionName: string, id: string, updates: any) => {
  if (!isDbReady()) throw new Error("Firebase not configured");
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error(`Update Error [${collectionName}]:`, error);
    throw error;
  }
};

// --- دالة ضغط الصور (لتقليل الحجم عند عدم وجود Storage) ---
const compressImage = (file: File, maxWidth = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // الحفاظ على الأبعاد ضمن الحد المسموح
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // التحويل إلى JPEG مضغوط لتقليل الحجم
            resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
            resolve(event.target?.result as string); // Fallback
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- دالة رفع الملفات الذكية (New Smart Upload) ---
export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  // 1. المحاولة الأولى: الرفع عبر Firebase Storage (الأفضل إذا كان مفعلاً)
  if (storage) {
    try {
      // محاولة سريعة للرفع
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error: any) {
      console.warn("Storage upload failed or not enabled. Switching to Compressed Base64 fallback.");
      // إذا فشل (بسبب عدم الترقية مثلاً)، ننتقل للخطة البديلة بصمت
    }
  }

  // 2. المحاولة الثانية: الضغط والتحويل إلى Base64 (الحل المجاني البديل)
  try {
      // إذا كان الملف صورة، نقوم بضغطه لتوفير المساحة في قاعدة البيانات
      if (file.type.startsWith('image/')) {
          const compressed = await compressImage(file);
          console.log("Image compressed successfully for Firestore storage.");
          return compressed;
      }
      
      // للملفات الأخرى (PDF وغيرها)، تحويل عادي
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
  } catch (e) {
      console.error("Compression failed", e);
      throw e;
  }
};
