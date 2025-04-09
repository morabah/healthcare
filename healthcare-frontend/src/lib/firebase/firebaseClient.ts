import { initializeApp, getApps, FirebaseOptions, FirebaseApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserSessionPersistence, browserLocalPersistence, inMemoryPersistence, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Get persistence mode from environment variable (session by default for security)
const PERSISTENCE_MODE = process.env.NEXT_PUBLIC_FIREBASE_AUTH_PERSISTENCE || 'session';

// Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase immediately to avoid "used before assignment" errors
const firebaseApp: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db: Firestore = getFirestore(firebaseApp);
const auth: Auth = getAuth(firebaseApp);
const storage: FirebaseStorage = getStorage(firebaseApp);

// Configure Firebase services if this is the first initialization
if (getApps().length === 1) {
  // Configure auth persistence based on environment variable
  const persistenceMode = {
    'local': browserLocalPersistence,
    'session': browserSessionPersistence,
    'none': inMemoryPersistence
  }[PERSISTENCE_MODE] || browserSessionPersistence;
  
  // Set persistence - this improves performance by caching auth state appropriately
  setPersistence(auth, persistenceMode)
    .catch((error) => {
      console.error('Firebase persistence error:', error);
    });
  
  // Enable Firestore offline persistence for better performance in production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence unavailable: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported in this browser');
      } else {
        console.error('Firestore persistence error:', err);
      }
    });
  }
}

// Clear auth state (improved for thorough cleanup)
export const clearAuthState = async (): Promise<boolean> => {
  try {
    await auth.signOut();
    
    // Clear any cached data in IndexedDB to prevent stale data issues
    // This is handled in a safe way to prevent errors
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        // Get all database names
        const databases = await window.indexedDB.databases();
        
        // Delete Firebase-related databases
        for (const dbInstance of databases) {
          if (dbInstance.name && (
            dbInstance.name.includes('firebase') || 
            dbInstance.name.includes('firestore')
          )) {
            window.indexedDB.deleteDatabase(dbInstance.name);
          }
        }
      } catch (e) {
        // Some browsers may not support this API
        console.warn('IndexedDB cleanup failed:', e);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing auth state:', error);
    return false;
  }
};

export { firebaseApp, db, auth, storage };
