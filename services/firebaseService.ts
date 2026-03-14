
import { db, storage, isOnlineMode } from '../firebaseConfig';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  getDocs
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

const setLocalData = (key: string, data: any[], onStorageError?: (msg: string) => void) => {
  try {
    localStorage.setItem(`mm_${key}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`local_update_${key}`, { detail: data }));
  } catch (e) {
    const msg = "تحذير: ذاكرة المتصفح ممتلئة. قد لا يتم حفظ التغييرات الأخيرة محلياً.";
    console.error("Local Storage Write Error (Quota might be exceeded)", e);
    // استخدام callback بدل alert() مباشرة
    if (onStorageError) {
      onStorageError(msg);
    } else {
      console.warn(msg);
    }
  }
};

// --- HYBRID SERVICES ---

export const subscribeToCollection = (
  collectionName: string, 
  callback: (data: any[]) => void, 
  filterOptions?: { field: string, value: any },
  onError?: (error: any) => void
) => {
  // 1. ONLINE MODE
  if (isOnlineMode() && db) {
    try {
      let q = query(collection(db, collectionName));
      if (filterOptions) {
         q = query(collection(db, collectionName), where(filterOptions.field, '==', filterOptions.value));
      }
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(data);
      }, (error) => {
        console.warn(`Firestore sync error for ${collectionName}, switching to local data.`);
        let localData = getLocalData(collectionName);
        if (filterOptions) localData = localData.filter((i: any) => i[filterOptions.field] === filterOptions.value);
        callback(localData);
      });
    } catch (e) {
      if (onError) onError(e);
      let localData = getLocalData(collectionName);
      if (filterOptions) localData = localData.filter((i: any) => i[filterOptions.field] === filterOptions.value);
      callback(localData);
      return () => { };
    }
  }

  // 2. OFFLINE / LOCAL MODE
  else {
    let localData = getLocalData(collectionName);
    if (filterOptions) localData = localData.filter((i: any) => i[filterOptions.field] === filterOptions.value);
    callback(localData);

    const handleLocalUpdate = (e: any) => {
       let updated = e.detail;
       if (filterOptions) updated = updated.filter((i: any) => i[filterOptions.field] === filterOptions.value);
       callback(updated);
    };
    window.addEventListener(`local_update_${collectionName}`, handleLocalUpdate);
    return () => {
      window.removeEventListener(`local_update_${collectionName}`, handleLocalUpdate);
    };
  }
};

export const queryByField = async (collectionName: string, field: string, value: any): Promise<any[]> => {
  if (isOnlineMode() && db) {
    try {
      const q = query(collection(db, collectionName), where(field, '==', value));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    } catch (error) {
      console.warn(`Query failed for ${collectionName}:`, error);
    }
  }
  // Fallback to local
  const current = getLocalData(collectionName);
  return current.filter((item: any) => item[field] === value);
};

export const saveData = async (collectionName: string, data: any) => {
  if (!data.id) data.id = 'gen_' + Date.now() + Math.random().toString(36).slice(2, 7);

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

export const getSecureFileUrl = async (path: string, protectionEnabled: boolean): Promise<string> => {
  if (!path) return '';
  if (!path.includes('firebasestorage')) {
     // Internal or Base64
     return path;
  }

  if (storage && isOnlineMode()) {
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      // If protection is enabled, we could append tokens or use a proxy
      // For now, we ensure the URL is fetched dynamically and not cached indefinitely
      return url;
    } catch (error) {
      console.warn("Error getting secure URL:", error);
      return path;
    }
  }
  return path;
};
