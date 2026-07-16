import { createContext, useState, useEffect, useCallback } from 'react';
import { 
  loginWithCampusId, 
  registerUserProfile, 
  validateCampusIdFormat 
} from '../services/authService';
import { 
  getUserProfile
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



  // Login handler
  const login = useCallback(async (idToLogin) => {
    const formattedId = idToLogin.trim().toUpperCase();
    if (!validateCampusIdFormat(formattedId)) {
      throw new Error('Invalid Campus ID format. Use VITAP-XXXXXX (or old CL-XXXX-XXXX)');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const profileData = await loginWithCampusId(formattedId);
      localStorage.setItem(STORAGE_KEY, formattedId);
      setCampusId(formattedId);
      setCurrentUser({ id: formattedId, ...profileData });
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
    localStorage.removeItem(STORAGE_KEY);
    setCampusId(null);
    setCurrentUser(null);
    setError(null);
  }, []);

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
