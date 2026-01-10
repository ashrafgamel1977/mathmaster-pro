
import { db } from '../firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  query
} from 'firebase/firestore';

// Helper to check if we should skip Firestore operations
const shouldSkipOperation = () => {
  if (!db) return true;
  const projectId = db.app.options.projectId;
  // Check for default/placeholder project IDs
  return !projectId || 
         projectId === 'your-project-id' || 
         projectId.includes('YOUR_PROJECT_ID') ||
         projectId.includes('your-project-id');
};

// دالة عامة للاستماع لأي مجموعة بيانات (Real-time)
export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void, onError?: (error: any) => void) => {
  try {
    if (!db) throw new Error("Database not initialized");
    
    // Safety check: if using default config, don't try to connect effectively
    if (shouldSkipOperation()) {
       console.warn(`Skipping subscription to ${collectionName} due to default/invalid config.`);
       return () => {}; // Return empty unsubscribe
    }

    const q = query(collection(db, collectionName));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data() }));
      callback(data);
    }, (error) => {
      console.error(`Error listening to ${collectionName}:`, error);
      if (onError) onError(error);
    });
  } catch (e) {
    console.warn("Firebase subscribe skipped (Config might be missing)");
    if (onError) onError(e);
    return () => {};
  }
};

// إضافة أو تحديث مستند
export const saveData = async (collectionName: string, data: any) => {
  try {
    if (!db) throw new Error("Database not initialized");
    if (shouldSkipOperation()) throw new Error("Cannot save data with default configuration.");
    
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error(`Error saving to ${collectionName}:`, error);
    throw error;
  }
};

// حذف مستند
export const removeData = async (collectionName: string, id: string) => {
  try {
    if (!db) throw new Error("Database not initialized");
    if (shouldSkipOperation()) throw new Error("Cannot delete data with default configuration.");

    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error(`Error deleting from ${collectionName}:`, error);
    throw error;
  }
};

// تحديث جزئي لمستند
export const updatePartialData = async (collectionName: string, id: string, updates: any) => {
  try {
    if (!db) throw new Error("Database not initialized");
    if (shouldSkipOperation()) throw new Error("Cannot update data with default configuration.");

    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error(`Error updating ${collectionName}:`, error);
    throw error;
  }
};
