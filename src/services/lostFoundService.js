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
  Timestamp,
  getDocs
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
      createdBy: pinData.createdBy || '',
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
 * Subscribes to the count of resolved pins.
 * @param {function} onUpdate - Callback with the count
 * @returns {function} Unsubscribe function
 */
export const subscribeResolvedCount = (onUpdate) => {
  const pinsCol = collection(db, COLLECTION_NAME);
  const q = query(pinsCol, where('resolved', '==', true));
  
  return onSnapshot(
    q,
    (querySnapshot) => {
      onUpdate(querySnapshot.size);
    },
    (error) => {
      console.error('Error fetching resolved pins count:', error);
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

/**
 * Deletes all pins from Firestore to reset the database.
 */
export const resetLostFoundDatabase = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const promises = [];
    querySnapshot.forEach((document) => {
      promises.push(deleteDoc(doc(db, COLLECTION_NAME, document.id)));
    });
    await Promise.all(promises);
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};
