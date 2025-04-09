import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence, inMemoryPersistence, browserLocalPersistence, Auth, Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};

// Initialize Firebase
// Check if apps are already initialized to avoid errors during hot-reloading
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firebase services
const auth = getAuth(app);

// Default to session persistence for better security (clears when browser tab is closed)
// Use environment variable to override if needed
let defaultPersistence: Persistence = browserSessionPersistence;
if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FIREBASE_AUTH_PERSISTENCE) {
  const persistenceType = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PERSISTENCE;
  if (persistenceType === 'local') {
    defaultPersistence = browserLocalPersistence;
  } else if (persistenceType === 'session') {
    defaultPersistence = browserSessionPersistence;
  } else if (persistenceType === 'none') {
    defaultPersistence = inMemoryPersistence;
  }
}

// Function to set auth persistence
export const setAuthPersistence = async (persistenceType: Persistence = defaultPersistence): Promise<boolean> => {
  try {
    await setPersistence(auth, persistenceType);
    console.log(`Auth persistence set to ${persistenceType.type}`);
    return true;
  } catch (error) {
    console.error('Error setting auth persistence:', error);
    return false;
  }
};

// Initialize persistence if in browser environment
if (typeof window !== 'undefined') {
  setAuthPersistence(defaultPersistence)
    .catch((error) => {
      console.error('Error setting auth persistence:', error);
    });
}

// Export function to specifically clear auth on logout
export const clearAuthState = async (): Promise<boolean> => {
  try {
    // First sign out from Firebase Auth
    await auth.signOut();
    
    // Then clear all storage mechanisms
    if (typeof window !== 'undefined') {
      // Clear Firebase-specific localStorage items
      const firebaseKeys = [
        'firebase:auth:user',
        'firebase:authUser',
        'firebase:persistence',
        'firebase:forceRefresh',
        'firebase:pendingRedirect',
        // Add any application-specific keys
        'healthcareApp:lastLogin',
        'healthcareApp:user'
      ];
      
      firebaseKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove localStorage item: ${key}`, e);
        }
      });
      
      // Clear sessionStorage Firebase items
      firebaseKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove sessionStorage item: ${key}`, e);
        }
      });
      
      // Attempt to clear IndexedDB for Firebase
      try {
        const dbs = await window.indexedDB.databases();
        dbs.forEach(db => {
          if (db.name && db.name.includes('firebase')) {
            window.indexedDB.deleteDatabase(db.name);
          }
        });
      } catch (e) {
        console.warn('Unable to clear IndexedDB databases:', e);
      }
      
      // Dispatch a custom event to notify other tabs
      try {
        localStorage.setItem('authStateChange', Date.now().toString());
        setTimeout(() => localStorage.removeItem('authStateChange'), 1000);
      } catch (e) {
        console.warn('Failed to dispatch auth state change event', e);
      }
    }
    
    // Add a delay to ensure everything is cleared before continuing
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return true;
  } catch (error) {
    console.error('Error clearing auth state:', error);
    return false;
  }
};

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
