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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Fetch additional user data from Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userDataFromFirestore = userDoc.data();
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              role: userDataFromFirestore.role || 'patient', // Default to patient if role not specified
              photoURL: currentUser.photoURL
            });
          } else {
            // If user document doesn't exist yet, create it with default role
            setUserData({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              role: 'patient', // Default role
              photoURL: currentUser.photoURL
            });
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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
    setError(null);
    try {
      // First clear user state from context
      setUser(null);
      setUserData(null);
      
      // Then sign out from Firebase
      await signOut(auth);
      
      // Clear any cached data
      localStorage.removeItem('firebase:auth:user');
      sessionStorage.clear();
      
      // Return successfully
      console.log('User logged out successfully');
      return Promise.resolve();
    } catch (err) {
      const errorMessage = handleAuthError(err);
      setError(errorMessage);
      console.error('Logout error:', err);
      throw new Error(errorMessage);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Add scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      // Set custom parameters for better UX
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if this is a new user (first sign-in)
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // This is a new user, show role selection UI or default to patient
        // For now, we'll default to patient role
        await saveUserToFirestore(userCredential.user, 'patient');
        
        setUserData({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          role: 'patient',
          photoURL: userCredential.user.photoURL
        });
      } else {
        // Existing user, update last login
        await setDoc(userRef, {
          lastLogin: new Date().toISOString()
        }, { merge: true });
        
        // Set user data with role from Firestore
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
      let errorMessage: string;
      
      // Special handling for unauthorized domain error
      if (err instanceof FirebaseError && err.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        errorMessage = `This domain (${currentDomain}) is not authorized for Google sign-in. Please add it to your Firebase console under Authentication > Settings > Authorized domains.`;
        setError(errorMessage);
        console.error(`Firebase Google Auth Error: Domain ${currentDomain} not authorized. Add it to Firebase Console: Authentication > Settings > Authorized domains.`);
      } else {
        errorMessage = handleAuthError(err);
        setError(errorMessage);
      }
      
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
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
