
import { db, storage, isOnlineMode } from '../firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { Question } from '../types';

const COLLECTION_NAME = 'question_bank';

export const subscribeToQuestionBank = (
  tenantId: string,
  callback: (questions: Question[]) => void,
  filters?: { subject?: string; branch?: string }
) => {
  if (isOnlineMode() && db) {
    let q = query(collection(db, COLLECTION_NAME), where('tenantId', '==', tenantId));
    
    if (filters?.subject) {
      q = query(q, where('subject', '==', filters.subject));
    }
    
    return onSnapshot(q, (snapshot) => {
      const questions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Question[];
      callback(questions);
    });
  } else {
    // Fallback to local storage
    const data = localStorage.getItem(`mm_${COLLECTION_NAME}_${tenantId}`);
    const questions = data ? JSON.parse(data) : [];
    callback(questions);
    return () => {};
  }
};

export const saveQuestionToBank = async (tenantId: string, question: Question) => {
  const data = { ...question, tenantId, updatedAt: new Date().toISOString() };
  if (!data.id) data.id = 'q_' + Date.now();

  if (isOnlineMode() && db) {
    await setDoc(doc(db, COLLECTION_NAME, data.id), data, { merge: true });
  } else {
    const current = JSON.parse(localStorage.getItem(`mm_${COLLECTION_NAME}_${tenantId}`) || '[]');
    const index = current.findIndex((q: any) => q.id === data.id);
    if (index >= 0) current[index] = data;
    else current.push(data);
    localStorage.setItem(`mm_${COLLECTION_NAME}_${tenantId}`, JSON.stringify(current));
  }
};

export const deleteQuestionFromBank = async (tenantId: string, questionId: string) => {
  if (isOnlineMode() && db) {
    await deleteDoc(doc(db, COLLECTION_NAME, questionId));
  } else {
    const current = JSON.parse(localStorage.getItem(`mm_${COLLECTION_NAME}_${tenantId}`) || '[]');
    const filtered = current.filter((q: any) => q.id !== questionId);
    localStorage.setItem(`mm_${COLLECTION_NAME}_${tenantId}`, JSON.stringify(filtered));
  }
};
