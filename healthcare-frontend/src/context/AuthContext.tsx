'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/firebaseClient';
import { FirebaseError } from 'firebase/app';
import { createLogger } from '@/lib/logger';

// Create a dedicated auth logger
const authLogger = createLogger('auth');

export type UserRole = 'patient' | 'doctor';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  photoURL?: string | null;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setError: (error: string | null) => void;
  isNewGoogleUser: boolean;
  pendingGoogleUserData: Partial<UserData> | null;
  completeGoogleSignIn: (role: UserRole) => Promise<void>;
}

interface GoogleSignInResult {
  isNewUser: boolean;
  userData: UserData;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewGoogleUser, setIsNewGoogleUser] = useState(false);
  const [pendingGoogleUserData, setPendingGoogleUserData] = useState<Partial<UserData> | null>(null);

  useEffect(() => {
    authLogger.info('Setting up Firebase auth state listener');
    
    // Flag to prevent unnecessary state updates during role selection
    let isHandlingRoleSelection = false;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      authLogger.debug('Auth state changed', { 
        userExists: !!firebaseUser, 
        userId: firebaseUser?.uid,
        isNewGoogleUser: isNewGoogleUser,
        hasPendingData: !!pendingGoogleUserData,
        isHandlingRoleSelection
      });
      
      // Skip state updates if we're in the middle of role selection
      if (isNewGoogleUser && pendingGoogleUserData) {
        authLogger.info('Ignoring auth state change during role selection', {
          pendingUid: pendingGoogleUserData.uid,
          currentUid: firebaseUser?.uid
        });
        // Do not update any state during role selection
        isHandlingRoleSelection = true;
        return;
      }
      
      if (firebaseUser) {
        // User is signed in
        setUser(firebaseUser);
        setLoading(false);

        try {
          // Check for existing user data in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            authLogger.debug('User data loaded from Firestore', { 
              userId: firebaseUser.uid, 
              hasRole: !!userData.role,
              role: userData.role || 'unknown' 
            });
            
            // Update userData state
            setUserData({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: userData.role || 'patient',
              photoURL: firebaseUser.photoURL
            });
          } else {
            authLogger.warn('User exists in Firebase Auth but not in Firestore', { 
              userId: firebaseUser.uid 
            });
            
            // Make sure we still clear old userData if we don't have a match
            setUserData(null);
          }
        } catch (err) {
          authLogger.error('Error loading user data from Firestore', err);
          // On error, still ensure userData is consistent with user state
          setUserData(null);
        }
      } else {
        // User is signed out
        authLogger.info('User signed out, clearing state');
        setUser(null);
        
        // Make sure to explicitly set userData to null when the user is signed out
        // This ensures no role or other user information persists after logout
        setUserData(null);
        
        setLoading(false);
        
        // Also reset Google sign-in state, but only if not in role selection
        if (!isHandlingRoleSelection) {
          setIsNewGoogleUser(false);
          setPendingGoogleUserData(null);
        }
      }
    });

    // Broadcast auth state changes to other tabs
    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    return () => {
      authLogger.debug('Cleaning up auth state listener');
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isNewGoogleUser, pendingGoogleUserData]);

  // Initialize state from localStorage if available (for handling page refreshes during sign-in)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to load saved Google sign-in state
      try {
        const savedIsNewGoogleUser = localStorage.getItem('isNewGoogleUser');
        const savedPendingData = localStorage.getItem('pendingGoogleUserData');
        
        if (savedIsNewGoogleUser === 'true' && savedPendingData) {
          authLogger.info('Restoring Google sign-in state from localStorage');
          const pendingData = JSON.parse(savedPendingData);
          
          // Validate the saved data
          if (pendingData?.uid && pendingData?.email) {
            authLogger.debug('Valid pending Google user data found', pendingData);
            setIsNewGoogleUser(true);
            setPendingGoogleUserData(pendingData);
          } else {
            authLogger.warn('Invalid pending Google user data, clearing', pendingData);
            localStorage.removeItem('pendingGoogleUserData');
            localStorage.removeItem('isNewGoogleUser');
          }
        }
      } catch (error) {
        authLogger.error('Error restoring Google sign-in state', error);
        // Clear potentially corrupted state
        localStorage.removeItem('pendingGoogleUserData');
        localStorage.removeItem('isNewGoogleUser');
      }
    }
  }, []);

  // Helper function to create/update user data in Firestore
  const saveUserToFirestore = async (user: User, role: UserRole): Promise<void> => {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }, { merge: true });
  };

  const handleAuthError = (err: unknown): string => {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          return 'This email is already registered. Please use a different email or try logging in.';
        case 'auth/invalid-email':
          return 'Invalid email address. Please check your email and try again.';
        case 'auth/user-not-found':
          return 'No account found with this email. Please check your email or sign up.';
        case 'auth/wrong-password':
          return 'Incorrect password. Please try again or reset your password.';
        case 'auth/weak-password':
          return 'Password is too weak. Please use a stronger password.';
        case 'auth/popup-closed-by-user':
          return 'Sign-in popup was closed before completing the sign in. Please try again.';
        case 'auth/popup-blocked':
          return 'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
        default:
          return `Authentication error: ${err.message}`;
      }
    }
    return 'An unexpected error occurred. Please try again later.';
  };

  // Handle auth state changes from other tabs via localStorage events
  const handleStorageChange = (event: StorageEvent) => {
    // Check for auth-related storage events
    if (event.key && (
      event.key.includes('firebase:auth') || 
      event.key === 'firebase-auth-state-changed'
    )) {
      authLogger.debug('Auth state changed in another tab', { key: event.key });
      
      // Force reload the current user
      auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser !== user) {
          authLogger.info('Synchronizing auth state from another tab', { 
            currentUserExists: !!user,
            newUserExists: !!firebaseUser
          });
          
          setUser(firebaseUser);
          
          if (firebaseUser) {
            try {
              // Get user data from Firestore
              const userRef = doc(db, 'users', firebaseUser.uid);
              const userDoc = await getDoc(userRef);
              
              if (userDoc.exists()) {
                const userDataFromFirestore = userDoc.data();
                setUserData({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  role: userDataFromFirestore.role || 'patient',
                  photoURL: firebaseUser.photoURL
                });
              }
            } catch (err) {
              authLogger.error('Error loading user data after storage event', err);
            }
          } else {
            // Clear user data if no firebase user
            setUserData(null);
          }
        }
      });
    }
  };

  // Token refresh handling
  useEffect(() => {
    let refreshTimer: NodeJS.Timeout | null = null;
    
    const setupTokenRefresh = async () => {
      if (!user) return;
      
      try {
        const token = await user.getIdTokenResult();
        const expirationTime = new Date(token.expirationTime).getTime();
        const refreshTime = expirationTime - (5 * 60 * 1000); // 5 minutes before expiry
        const timeUntilRefresh = refreshTime - Date.now();
        
        if (timeUntilRefresh > 0) {
          console.log(`Scheduling token refresh in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
          refreshTimer = setTimeout(async () => {
            try {
              // Force token refresh
              await user.getIdToken(true);
              // Setup next refresh
              setupTokenRefresh();
            } catch (error) {
              console.error('Error refreshing token:', error);
            }
          }, timeUntilRefresh);
        } else {
          // Token is expired or very close to expiry, refresh now
          await user.getIdToken(true);
          setupTokenRefresh();
        }
      } catch (error) {
        console.error('Error setting up token refresh:', error);
      }
    };
    
    if (user) {
      setupTokenRefresh();
    }
    
    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [user]);

  const signUp = async (email: string, password: string, displayName: string, role: UserRole): Promise<void> => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(userCredential.user, { displayName });
      
      // Save additional user data to Firestore
      await saveUserToFirestore(userCredential.user, role);
      
      // Update local userData state
      setUserData({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName,
        role: role,
        photoURL: userCredential.user.photoURL
      });
    } catch (err) {
      const errorMessage = handleAuthError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time in Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        lastLogin: new Date().toISOString()
      }, { merge: true });
      
      // Fetch user data including role
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userDataFromFirestore = userDoc.data();
        setUserData({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          role: userDataFromFirestore.role || 'patient',
          photoURL: userCredential.user.photoURL
        });
      }
    } catch (err) {
      const errorMessage = handleAuthError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async (): Promise<void> => {
    authLogger.info('Starting logout process');
    setError(null);
    const maxRetries = 3;
    let retryCount = 0;
    
    const attemptLogout = async (): Promise<void> => {
      try {
        // Clear local state first
        authLogger.debug('Clearing local auth state');
        setUser(null);
        setUserData(null);
        
        // Reset any Google sign-in state
        setIsNewGoogleUser(false);
        setPendingGoogleUserData(null);
        
        // Clear any persisted state in localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pendingGoogleUserData');
          localStorage.removeItem('isNewGoogleUser');
        }
        
        // Then use the clearAuthState function from our Firebase client
        // This ensures a thorough clearing of all auth-related data
        const { clearAuthState } = await import('@/lib/firebase/firebaseClient');
        await clearAuthState();
        
        // Additional cleanup - force the auth object to refresh
        // This helps ensure the auth state is truly reset
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await currentUser.reload();
          }
        } catch (reloadError) {
          authLogger.warn('Error reloading user during logout cleanup', reloadError);
        }
        
        // Signal to other tabs that auth state has changed
        if (typeof window !== 'undefined') {
          localStorage.setItem('firebase-auth-state-changed', Date.now().toString());
        }
        
        authLogger.info('Logout completed successfully');
      } catch (err) {
        authLogger.error('Error during logout attempt', err);
        
        if (retryCount < maxRetries) {
          retryCount++;
          authLogger.warn(`Retrying logout (attempt ${retryCount}/${maxRetries})`);
          await attemptLogout();
        } else {
          authLogger.error('Maximum logout retries reached', { maxRetries });
          throw err;
        }
      }
    };
    
    await attemptLogout();
  };

  const redirectAfterAuth = (role: string) => {
    if (typeof window !== 'undefined') {
      // Use the correct paths matching your Next.js app structure
      const dashboardPath = role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard';
      
      try {
        authLogger.info(`Redirecting to ${dashboardPath} based on role: ${role}`);
        window.location.href = dashboardPath;
      } catch (e) {
        authLogger.warn(`Failed to redirect to ${dashboardPath}, falling back to home page`, e);
        window.location.href = '/';
      }
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    authLogger.info('Starting Google sign-in process');
    setError(null);
    
    // Reset any previous state
    setIsNewGoogleUser(false);
    setPendingGoogleUserData(null);
    
    try {
      const provider = new GoogleAuthProvider();
      // Add scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      // Set custom parameters for better UX
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      authLogger.debug('Opening Google sign-in popup');
      const userCredential = await signInWithPopup(auth, provider);
      
      // Log successful Google sign-in
      authLogger.info('Google sign-in popup completed successfully', { 
        userId: userCredential.user.uid,
        isNewUser: userCredential.operationType === 'signIn' 
      });
      
      // Get the user details
      const { user } = userCredential;
      if (!user) {
        const error = 'Failed to get user from Google authentication';
        authLogger.error(error);
        throw new Error(error);
      }

      // Check if this is a new user (first sign-in)
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // This is a new user, set flags for role selection
        authLogger.info('New Google user detected, showing role selection', { 
          userId: user.uid, 
          email: user.email 
        });
        
        // Store the auth user for future use
        // This prevents Firebase from signing out during the role selection process
        const newUserData: Partial<UserData> = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        
        // Use a synchronous update to prevent race conditions
        setIsNewGoogleUser(true);
        setPendingGoogleUserData(newUserData);
        
        // Store the pending user data in localStorage to persist through refresh/redirects
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingGoogleUserData', JSON.stringify(newUserData));
          localStorage.setItem('isNewGoogleUser', 'true');
        }
        
        authLogger.debug('Waiting for user role selection');
        return;
      } else {
        // Existing user, update last login
        authLogger.info('Existing Google user, loading profile data', { 
          userId: user.uid 
        });
        
        try {
          await setDoc(userRef, {
            lastLogin: new Date().toISOString()
          }, { merge: true });
          
          // Set user data with role from Firestore
          const userDataFromFirestore = userDoc.data();
          
          // Make sure we have a valid role
          if (!userDataFromFirestore.role) {
            authLogger.warn('User exists but has no role, setting to default patient role', { 
              userId: user.uid 
            });
            
            await setDoc(userRef, { role: 'patient' }, { merge: true });
            userDataFromFirestore.role = 'patient';
          }
          
          authLogger.debug('Setting user data state', { 
            userId: user.uid, 
            role: userDataFromFirestore.role 
          });
          
          const role = userDataFromFirestore.role || 'patient';
          
          setUserData({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: role,
            photoURL: user.photoURL
          });
          
          // Clear any pending Google user state
          setIsNewGoogleUser(false);
          setPendingGoogleUserData(null);
          
          // Clear any stored pending data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('pendingGoogleUserData');
            localStorage.removeItem('isNewGoogleUser');
          }
          
          authLogger.info('Google sign-in completed for existing user, redirecting', { 
            userId: user.uid, 
            role: role
          });
          
          // Handle redirection to the appropriate dashboard
          redirectAfterAuth(role);
          
          return;
        } catch (firestoreError) {
          authLogger.error('Error updating Firestore data during Google sign-in', firestoreError);
          throw firestoreError;
        }
      }
    } catch (err) {
      authLogger.error('Google sign-in process error', err);
      
      // Reset the Google sign-in state to prevent UI issues
      setIsNewGoogleUser(false);
      setPendingGoogleUserData(null);
      
      // Clear any stored pending data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingGoogleUserData');
        localStorage.removeItem('isNewGoogleUser');
      }
      
      let errorMessage: string;
      
      // Special handling for popup closed error - don't show alarming errors to user
      if (err instanceof FirebaseError && err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google sign-in was cancelled. Please try again.';
        authLogger.warn('User closed the Google sign-in popup', { 
          errorCode: err.code 
        });
        
        setError(errorMessage);
        // Don't throw here, just return
        return;
      }
      
      // Special handling for unauthorized domain error
      if (err instanceof FirebaseError && err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        errorMessage = `This domain (${currentDomain}) is not authorized for Google sign-in. Please add it to your Firebase console under Authentication > Settings > Authorized domains.`;
        
        authLogger.error('Firebase unauthorized domain error', { 
          domain: currentDomain, 
          errorCode: err.code 
        });
        
        setError(errorMessage);
      } else {
        errorMessage = handleAuthError(err);
        setError(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
  };

  const completeGoogleSignIn = async (role: UserRole): Promise<void> => {
    authLogger.info('Completing Google sign-in with role', { role });
    
    if (!pendingGoogleUserData || !pendingGoogleUserData.uid) {
      const errorMsg = 'No pending Google sign-in data found.';
      authLogger.error(errorMsg, { 
        pendingDataExists: !!pendingGoogleUserData 
      });
      
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      // Create the complete user data object
      const completeUserData: UserData = {
        uid: pendingGoogleUserData.uid,
        email: pendingGoogleUserData.email || null,
        displayName: pendingGoogleUserData.displayName || null,
        role: role,
        photoURL: pendingGoogleUserData.photoURL || null
      };

      authLogger.debug('Saving user data to Firestore', { 
        userId: completeUserData.uid,
        role 
      });
      
      // Save to Firestore
      const userRef = doc(db, 'users', completeUserData.uid);
      await setDoc(userRef, {
        uid: completeUserData.uid,
        email: completeUserData.email,
        displayName: completeUserData.displayName,
        role: role,
        photoURL: completeUserData.photoURL,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }, { merge: true });

      authLogger.info('User data saved successfully', { 
        userId: completeUserData.uid 
      });
      
      // Update local state
      setUserData(completeUserData);
      
      // Clear localStorage state immediately
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingGoogleUserData');
        localStorage.removeItem('isNewGoogleUser');
      }
      
      // Wait a bit before clearing the flags to ensure the UI updates properly
      authLogger.debug('Setting timeout to clear Google sign-in flags');
      
      // Store currentUser reference outside the timeout to avoid async issues
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Refresh token immediately
        authLogger.debug('Refreshing Firebase ID token');
        await currentUser.getIdToken(true);
      }
      
      setTimeout(() => {
        setIsNewGoogleUser(false);
        setPendingGoogleUserData(null);
        authLogger.info('Google sign-in completed successfully, redirecting', { 
          userId: completeUserData.uid,
          role 
        });
        
        // Redirect the user to the appropriate dashboard
        redirectAfterAuth(role);
      }, 500);
      
    } catch (err) {
      authLogger.error('Error completing Google sign-in', err);
      
      // Clear localStorage state on error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingGoogleUserData');
        localStorage.removeItem('isNewGoogleUser');
      }
      
      // Reset the Google sign-in state on error
      setIsNewGoogleUser(false);
      setPendingGoogleUserData(null);
      
      const errorMessage = handleAuthError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const errorMessage = handleAuthError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value = {
    user,
    userData,
    loading,
    error,
    signUp,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    setError,
    isNewGoogleUser,
    pendingGoogleUserData,
    completeGoogleSignIn
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
