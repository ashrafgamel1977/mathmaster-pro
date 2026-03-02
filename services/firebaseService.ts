
import { db, storage, isOnlineMode } from '../firebaseConfig';
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

// --- LOCAL STORAGE HELPERS (The Fallback Engine) ---
const getLocalData = (key: string): any[] => {
  try {
    const data = localStorage.getItem(`mm_${key}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Local Storage Read Error", e);
    return [];
  }
};

const setLocalData = (key: string, data: any[]) => {
  try {
    localStorage.setItem(`mm_${key}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`local_update_${key}`, { detail: data }));
  } catch (e) {
    console.error("Local Storage Write Error (Quota might be exceeded)", e);
    alert("تحذير: ذاكرة المتصفح ممتلئة. قد لا يتم حفظ التغييرات الأخيرة محلياً.");
  }
};

// --- HYBRID SERVICES ---

export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void, onError?: (error: any) => void) => {
  // 1. ONLINE MODE
  if (isOnlineMode() && db) {
    try {
      const q = query(collection(db, collectionName));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
      }, (error) => {
        console.warn(`Firestore sync error for ${collectionName}, switching to local data.`);
        callback(getLocalData(collectionName));
      });
    } catch (e) {
      if (onError) onError(e);
      callback(getLocalData(collectionName));
      return () => {};
    }
  } 
  
  // 2. OFFLINE / LOCAL MODE
  else {
    callback(getLocalData(collectionName));
    const handleLocalUpdate = (e: any) => callback(e.detail);
    window.addEventListener(`local_update_${collectionName}`, handleLocalUpdate);
    return () => {
      window.removeEventListener(`local_update_${collectionName}`, handleLocalUpdate);
    };
  }
};

export const saveData = async (collectionName: string, data: any) => {
  if (!data.id) data.id = 'gen_' + Date.now() + Math.random().toString(36).substr(2, 5);

  if (isOnlineMode() && db) {
    try {
      const docRef = doc(db, collectionName, data.id);
      await setDoc(docRef, data, { merge: true });
      return;
    } catch (error) {
      console.warn("Online save failed, saving locally.");
    }
  }

  const current = getLocalData(collectionName);
  const existingIndex = current.findIndex((i: any) => i.id === data.id);
  
  if (existingIndex >= 0) {
    current[existingIndex] = { ...current[existingIndex], ...data };
  } else {
    current.push(data);
  }
  setLocalData(collectionName, current);
};

export const removeData = async (collectionName: string, id: string) => {
  if (isOnlineMode() && db) {
    try {
      await deleteDoc(doc(db, collectionName, id));
      return;
    } catch (error) {
      console.warn("Online delete failed, deleting locally.");
    }
  }

  const current = getLocalData(collectionName);
  const filtered = current.filter((i: any) => i.id !== id);
  setLocalData(collectionName, filtered);
};

export const updatePartialData = async (collectionName: string, id: string, updates: any) => {
  if (isOnlineMode() && db) {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, updates);
      return;
    } catch (error) {
      console.warn("Online update failed, updating locally.");
    }
  }

  const current = getLocalData(collectionName);
  const index = current.findIndex((i: any) => i.id === id);
  if (index >= 0) {
    current[index] = { ...current[index], ...updates };
    setLocalData(collectionName, current);
  }
};

// --- SMART FILE UPLOAD & COMPRESSION ---
const compressImage = (file: File, maxWidth = 800, quality = 0.6): Promise<Blob> => {
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

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = "#FFFFFF"; 
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Compression failed"));
            }, 'image/jpeg', quality);
        } else {
            reject(new Error("Canvas context failed"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  let processedFile: Blob = file;

  // Smart Compression for Images
  if (file.type.startsWith('image/')) {
      try {
          processedFile = await compressImage(file);
          console.log(`Smart Compression: ${(file.size / 1024).toFixed(2)}KB -> ${(processedFile.size / 1024).toFixed(2)}KB`);
      } catch (e) {
          console.warn("Compression skipped due to error", e);
      }
  }

  // 1. Try Firebase Storage if available
  if (storage && isOnlineMode()) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, processedFile);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.warn("Storage upload failed. Switching to Local Base64.");
    }
  }

  // 2. Fallback: Base64
  return await blobToBase64(processedFile);
};
