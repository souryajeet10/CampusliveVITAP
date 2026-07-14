import { 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COLLECTION_NAME = 'activities';

/**
 * Adds a new activity to Firestore.
 * @param {object} activityData 
 * @returns {Promise<string>} Created document ID
 */
export const addActivity = async (activityData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...activityData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding activity to Firestore:', error);
    throw error;
  }
};

/**
 * Fetches all activities from Firestore.
 * @returns {Promise<Array>} List of activities
 */
export const getActivities = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const activities = [];
    querySnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() });
    });
    return activities;
  } catch (error) {
    console.error('Error fetching activities from Firestore:', error);
    throw error;
  }
};

/**
 * Subscribes to real-time updates for activities in Firestore.
 * @param {function} onUpdate Callback when snapshot updates
 * @returns {function} Unsubscribe function
 */
export const subscribeActivities = (onUpdate, onError) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q, 
    (querySnapshot) => {
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      onUpdate(activities);
    },
    (error) => {
      console.error('Error in real-time activities subscription:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Updates an activity in Firestore.
 * @param {string} id 
 * @param {object} activityData 
 */
export const updateActivity = async (id, activityData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...activityData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating activity ${id} in Firestore:`, error);
    throw error;
  }
};

/**
 * Deletes an activity from Firestore.
 * @param {string} id 
 */
export const deleteActivity = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting activity ${id} from Firestore:`, error);
    throw error;
  }
};

/**
 * Adds a user ID to the participants array of an activity.
 * Prevents duplicates natively via arrayUnion.
 * @param {string} activityId 
 * @param {string} userId 
 */
export const joinActivity = async (activityId, userId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, activityId);
    await updateDoc(docRef, {
      participants: arrayUnion(userId)
    });
  } catch (error) {
    console.error(`Error joining activity ${activityId}:`, error);
    throw error;
  }
};
