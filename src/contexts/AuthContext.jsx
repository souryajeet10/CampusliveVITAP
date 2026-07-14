import { createContext, useState, useEffect, useCallback } from 'react';
import { 
  loginWithCampusId, 
  registerUserProfile, 
  validateCampusIdFormat 
} from '../services/authService';
import { 
  getUserProfile, 
  updateUserOnlineStatus 
} from '../services/userService';

export const AuthContext = createContext(null);

const STORAGE_KEY = 'campuslive_campus_id';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [campusId, setCampusId] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-login routine on mount or campusId state change
  useEffect(() => {
    let active = true;
    
    const autoLogin = async () => {
      if (!campusId) {
        if (active) {
          setIsLoading(false);
          setCurrentUser(null);
        }
        return;
      }
      
      try {
        if (active) setIsLoading(true);
        setError(null);
        
        // Fetch user document from Firestore
        const profile = await getUserProfile(campusId);
        
        if (profile) {
          if (active) {
            setCurrentUser({ id: campusId, ...profile });
            // Set online to true in firestore
            await updateUserOnlineStatus(campusId, true);
          }
        } else {
          // Document not found in Firestore (possibly deleted or corrupted)
          console.warn('Campus ID not found in Firestore. Clearing localStorage.');
          localStorage.removeItem(STORAGE_KEY);
          if (active) {
            setCampusId(null);
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error('Failed to auto-login:', err);
        if (active) {
          setError('Network or system error occurred. Offline mode active.');
          // Attempt to load from cached memory if possible (just set a fallback offline user if wanted, or let it load)
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    autoLogin();

    return () => {
      active = false;
    };
  }, [campusId]);

  // Handle online/offline tab events
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;
    const currentId = currentUser.id;

    // Set online on load / visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateUserOnlineStatus(currentId, true);
      } else {
        updateUserOnlineStatus(currentId, false);
      }
    };

    const handleBeforeUnload = () => {
      // Synchronous style firestore check or quick background status change
      updateUserOnlineStatus(currentId, false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Set online status to false on clean unmount
      updateUserOnlineStatus(currentId, false);
    };
  }, [currentUser]);

  // Login handler
  const login = useCallback(async (idToLogin) => {
    const formattedId = idToLogin.trim().toUpperCase();
    if (!validateCampusIdFormat(formattedId)) {
      throw new Error('Invalid Campus ID format. Use CL-XXXX-XXXX');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const profileData = await loginWithCampusId(formattedId);
      localStorage.setItem(STORAGE_KEY, formattedId);
      setCampusId(formattedId);
      setCurrentUser({ id: formattedId, ...profileData });
      await updateUserOnlineStatus(formattedId, true);
      return { id: formattedId, ...profileData };
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Register handler
  const register = useCallback(async (generatedId, profileFields) => {
    setIsLoading(true);
    setError(null);
    try {
      const newProfile = await registerUserProfile(generatedId, profileFields);
      localStorage.setItem(STORAGE_KEY, generatedId);
      setCampusId(generatedId);
      setCurrentUser({ id: generatedId, ...newProfile });
      return { id: generatedId, ...newProfile };
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    if (currentUser && currentUser.id) {
      // Set online to false before clearing
      await updateUserOnlineStatus(currentUser.id, false);
    }
    localStorage.removeItem(STORAGE_KEY);
    setCampusId(null);
    setCurrentUser(null);
    setError(null);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoading,
      error,
      login,
      register,
      logout,
      isAuthenticated: !!currentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
