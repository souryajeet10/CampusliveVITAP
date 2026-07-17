import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

const PINS_COLLECTION = 'lost_found_pins';
const MESSAGES_SUB = 'messages';

/**
 * Subscribes to the discussion thread (subcollection) for a given pin.
 * Messages are returned oldest-first so the thread reads top-to-bottom.
 *
 * @param {string} pinId - The parent pin document ID
 * @param {function} onUpdate - Callback receiving an array of message objects
 * @param {function} [onError] - Optional error callback
 * @returns {function} Unsubscribe function
 */
export const subscribeDiscussion = (pinId, onUpdate, onError) => {
  const messagesCol = collection(db, PINS_COLLECTION, pinId, MESSAGES_SUB);
  const q = query(messagesCol, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      onUpdate(messages);
    },
    (error) => {
      console.error(`Discussion subscription error for pin ${pinId}:`, error);
      if (onError) onError(error);
    }
  );
};

/**
 * Sends a message to a pin's discussion thread.
 *
 * @param {string} pinId - The parent pin document ID
 * @param {object} params
 * @param {string} params.senderId - The current user's campus ID
 * @param {string} params.senderName - The current user's display name
 * @param {string} params.text - The message body (max 500 chars)
 * @returns {Promise<string>} The created message document ID
 */
export const sendDiscussionMessage = async (pinId, { senderId, senderName, text }) => {
  if (!senderId) {
    throw new Error('You must be logged in to send a message.');
  }

  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw new Error('Message cannot be empty.');
  }

  const capped = trimmed.slice(0, 500);

  const messagesCol = collection(db, PINS_COLLECTION, pinId, MESSAGES_SUB);
  const docRef = await addDoc(messagesCol, {
    senderId,
    senderName: senderName || 'CampusLive User',
    text: capped,
    createdAt: serverTimestamp()
  });

  return docRef.id;
};

/**
 * Subscribes to the message count of a pin's discussion thread in real-time.
 *
 * @param {string} pinId - The parent pin document ID
 * @param {function} onUpdate - Callback receiving the message count size
 * @returns {function} Unsubscribe function
 */
export const subscribeDiscussionCount = (pinId, onUpdate) => {
  const messagesCol = collection(db, PINS_COLLECTION, pinId, MESSAGES_SUB);
  return onSnapshot(messagesCol, (snapshot) => {
    onUpdate(snapshot.size);
  }, (err) => {
    console.error(`Discussion count listener error for pin ${pinId}:`, err);
  });
};

/**
 * Deletes a specific message in a pin's discussion thread.
 *
 * @param {string} pinId - The parent pin document ID
 * @param {string} messageId - The message document ID to delete
 */
export const deleteDiscussionMessage = async (pinId, messageId) => {
  try {
    const docRef = doc(db, PINS_COLLECTION, pinId, MESSAGES_SUB, messageId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting message ${messageId} in pin ${pinId}:`, error);
    throw error;
  }
};
