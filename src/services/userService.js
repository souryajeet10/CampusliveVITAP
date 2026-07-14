import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

/**
 * Fetches user profile from Firestore by Campus ID.
 */
export const getUserProfile = async (campusId) => {
  const docRef = doc(db, 'users', campusId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

/**
 * Updates profile fields for a user.
 */
export const updateUserProfile = async (campusId, updates) => {
  const docRef = doc(db, 'users', campusId);
  await updateDoc(docRef, updates);
};

/**
 * Updates a user's online status and lastSeen fields.
 */
export const updateUserOnlineStatus = async (campusId, online) => {
  if (!campusId) return;
  const docRef = doc(db, 'users', campusId);
  try {
    await updateDoc(docRef, {
      online: online,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error(`Failed to update online status to ${online} for ${campusId}:`, error);
  }
};
