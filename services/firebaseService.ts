
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
    // Trigger a custom event so the app updates instantly without reload
    window.dispatchEvent(new CustomEvent(`local_update_${key}`, { detail: data }));
  } catch (e) {
    console.error("Local Storage Write Error (Quota might be exceeded)", e);
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
        // Fallback to local if sync fails mid-session
        callback(getLocalData(collectionName));
      });
    } catch (e) {
      if (onError) onError(e);
      // Fallback immediately on error
      callback(getLocalData(collectionName));
      return () => {};
    }
  } 
  
  // 2. OFFLINE / LOCAL MODE
  else {
    // Initial Load
    callback(getLocalData(collectionName));

    // Listen for local changes (to simulate realtime updates)
    const handleLocalUpdate = (e: any) => callback(e.detail);
    window.addEventListener(`local_update_${collectionName}`, handleLocalUpdate);

    return () => {
      window.removeEventListener(`local_update_${collectionName}`, handleLocalUpdate);
    };
  }
};

export const saveData = async (collectionName: string, data: any) => {
  // Ensure ID
  if (!data.id) data.id = 'gen_' + Date.now() + Math.random().toString(36).substr(2, 5);

  // Online
  if (isOnlineMode() && db) {
    try {
      const docRef = doc(db, collectionName, data.id);
      await setDoc(docRef, data, { merge: true });
      return;
    } catch (error) {
      console.warn("Online save failed, saving locally.");
    }
  }

  // Offline / Fallback
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
  // Online
  if (isOnlineMode() && db) {
    try {
      await deleteDoc(doc(db, collectionName, id));
      return;
    } catch (error) {
      console.warn("Online delete failed, deleting locally.");
    }
  }

  // Offline / Fallback
  const current = getLocalData(collectionName);
  const filtered = current.filter((i: any) => i.id !== id);
  setLocalData(collectionName, filtered);
};

export const updatePartialData = async (collectionName: string, id: string, updates: any) => {
  // Online
  if (isOnlineMode() && db) {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, updates);
      return;
    } catch (error) {
      console.warn("Online update failed, updating locally.");
    }
  }

  // Offline / Fallback
  const current = getLocalData(collectionName);
  const index = current.findIndex((i: any) => i.id === id);
  if (index >= 0) {
    current[index] = { ...current[index], ...updates };
    setLocalData(collectionName, current);
  }
};

// --- SMART FILE UPLOAD ---
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

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
            resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  // 1. Try Firebase Storage if available
  if (storage && isOnlineMode()) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.warn("Storage upload failed. Switching to Local Base64.");
    }
  }

  // 2. Fallback: Compress & Base64 (Works everywhere)
  try {
      if (file.type.startsWith('image/')) {
          return await compressImage(file);
      }
      // Non-image files
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
