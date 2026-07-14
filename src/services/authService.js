import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude confusing chars like 0, 1, O, I

/**
 * Generates a random 4-character segment.
 */
const generateSegment = () => {
  return Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
};

/**
 * Generates a unique Campus ID format CL-XXXX-XXXX and checks Firestore for collision.
 */
export const generateUniqueCampusId = async () => {
  let unique = false;
  let campusId = '';
  
  while (!unique) {
    campusId = `CL-${generateSegment()}-${generateSegment()}`;
    const userDocRef = doc(db, 'users', campusId);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      unique = true;
    }
  }
  
  return campusId;
};

/**
 * Validates format of a Campus ID.
 */
export const validateCampusIdFormat = (campusId) => {
  const regex = /^CL-[2-9A-HJK-NP-Z]{4}-[2-9A-HJK-NP-Z]{4}$/;
  return regex.test(campusId);
};

/**
 * Login function: checks if user exists in Firestore.
 */
export const loginWithCampusId = async (campusId) => {
  if (!validateCampusIdFormat(campusId)) {
    throw new Error('Invalid Campus ID format. Example: CL-7X9A-2KQ8');
  }
  
  const userDocRef = doc(db, 'users', campusId);
  const userDocSnap = await getDoc(userDocRef);
  
  if (!userDocSnap.exists()) {
    throw new Error('Campus ID not found. Please check your spelling or register a new profile.');
  }
  
  return userDocSnap.data();
};

/**
 * Creates a new user profile in Firestore.
 */
export const registerUserProfile = async (campusId, profileData) => {
  const userDocRef = doc(db, 'users', campusId);
  
  const defaultUser = {
    name: profileData.name || '',
    department: profileData.department || '',
    year: profileData.year || '1st Year',
    interests: profileData.interests || [],
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(campusId)}`,
    level: 1,
    xp: 0,
    badges: [],
    createdActivities: [],
    joinedActivities: [],
    settings: {
      notifications: true,
      theme: 'dark'
    },
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    online: true,
    favoriteCategories: []
  };
  
  await setDoc(userDocRef, defaultUser);
  return defaultUser;
};
