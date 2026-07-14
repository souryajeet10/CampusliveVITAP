import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const COLLECTION_NAME = 'lost_found_pins';

/**
 * Adds a new Lost & Found pin to Firestore.
 * @param {object} pinData - { type, title, description, latitude, longitude, createdBy }
 * @returns {Promise<string>} Created document ID
 */
export const addLostFoundPin = async (pinData) => {
  try {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000); // 48 hours expiration

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      type: pinData.type, // 'lost' | 'found'
      title: pinData.title,
      description: pinData.description,
      latitude: Number(pinData.latitude),
      longitude: Number(pinData.longitude),
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      createdBy: pinData.createdBy || 'aarav_sharma_uid',
      resolved: false
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding Lost & Found pin:', error);
    throw error;
  }
};

/**
 * Subscribes to active (unresolved and not expired) Lost & Found pins in real-time.
 * @param {function} onUpdate - Callback for snapshot updates
 * @param {function} onError - Optional error callback
 * @returns {function} Unsubscribe function
 */
export const subscribeActivePins = (onUpdate, onError) => {
  const pinsCol = collection(db, COLLECTION_NAME);
  // We query all unresolved pins. Client-side sorting and filtering is done
  // to prevent requiring Firestore composite indexes.
  const q = query(pinsCol, where('resolved', '==', false));
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      const pins = [];
      const now = Date.now();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const expiresAtMs = data.expiresAt ? data.expiresAt.seconds * 1000 : 0;
        
        // Filter out expired pins on the client side
        if (expiresAtMs > now) {
          pins.push({
            id: doc.id,
            ...data,
            expiresAtMs
          });
        }
      });
      
      // Sort client-side by createdAt descending
      pins.sort((a, b) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
        return bTime - aTime;
      });

      onUpdate(pins);
    },
    (error) => {
      console.error('Error in Lost & Found subscription:', error);
      if (onError) onError(error);
    }
  );
};

/**
 * Marks a pin as resolved.
 * @param {string} id - The pin document ID
 */
export const resolvePin = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      resolved: true,
      resolvedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error resolving pin ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a pin from Firestore.
 * @param {string} id - The pin document ID
 */
export const deletePin = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting pin ${id}:`, error);
    throw error;
  }
};
