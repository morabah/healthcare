/**
 * Firebase performance optimization utilities
 * Provides strategies for efficient Firestore access and caching
 */
import {
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  DocumentData,
  QueryConstraint,
  QueryDocumentSnapshot,
  QuerySnapshot,
  DocumentSnapshot,
  Firestore,
  limit,
  startAfter,
  orderBy,
  where
} from 'firebase/firestore';
import { ref, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { HybridStorage } from '@/lib/storage/hybridStorage';

// Cache for storing Firestore documents
const hybridStorage = new HybridStorage('firebase');

// TTL constants
const SHORT_TTL = 60 * 1000; // 1 minute 
const MEDIUM_TTL = 5 * 60 * 1000; // 5 minutes
const LONG_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get document with optimized caching
 * @param db Firestore instance
 * @param path Document path
 * @param forceFresh Force a fresh fetch, bypassing cache
 */
export async function getCachedDoc<T = DocumentData>(
  db: Firestore,
  path: string,
  forceFresh = false
): Promise<T | null> {
  // Generate a cache key
  const cacheKey = `doc_${path}`;
  
  // Try to get from cache first
  if (!forceFresh) {
    const cached = await hybridStorage.get<T>(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  // Fetch from Firestore
  try {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as T;
      
      // Cache the document
      await hybridStorage.set<T>(cacheKey, data, MEDIUM_TTL);
      
      return data;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching document at ${path}:`, error);
    throw error;
  }
}

/**
 * Get collection with pagination and cursor-based navigation
 * Much more efficient than offset-based pagination
 */
export async function getPaginatedCollection<T = DocumentData>(
  db: Firestore,
  collectionPath: string,
  options: {
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot<DocumentData>;
    orderByField?: string;
    orderDirection?: 'asc' | 'desc';
    constraints?: QueryConstraint[];
    cacheKey?: string;
    ttl?: number;
  } = {}
): Promise<{
  docs: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> {
  const {
    pageSize = 10,
    lastDoc,
    orderByField = 'createdAt',
    orderDirection = 'desc',
    constraints = [],
    cacheKey,
    ttl = MEDIUM_TTL
  } = options;
  
  // Try to get from cache first
  if (cacheKey) {
    const cachedResult = await hybridStorage.get<{
      docs: T[];
      lastDoc: QueryDocumentSnapshot<DocumentData> | null;
      hasMore: boolean;
    }>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
  }
  
  // Build query
  let queryConstraints: QueryConstraint[] = [
    orderBy(orderByField, orderDirection),
    limit(pageSize + 1) // +1 to check if there are more docs
  ];
  
  // Add lastDoc for pagination if provided
  if (lastDoc) {
    queryConstraints.push(startAfter(lastDoc));
  }
  
  // Add custom constraints
  queryConstraints = [...queryConstraints, ...constraints];
  
  // Execute query
  const collectionRef = collection(db, collectionPath);
  const q = query(collectionRef, ...queryConstraints);
  
  try {
    const querySnapshot = await getDocs(q);
    const docs: T[] = [];
    let lastDocSnapshot: QueryDocumentSnapshot<DocumentData> | null = null;
    
    // Process documents with performance optimization
    querySnapshot.forEach((doc) => {
      // Only add pageSize docs to the result
      if (docs.length < pageSize) {
        // Store document data with ID for easier reference
        const data = doc.data();
        docs.push({
          id: doc.id,
          ...data
        } as T);
      }
      
      // Update last doc
      lastDocSnapshot = doc;
    });
    
    const result = {
      docs,
      lastDoc: lastDocSnapshot,
      // Check if there are more documents by comparing the number of returned docs
      hasMore: querySnapshot.size > pageSize
    };
    
    // Cache the result
    if (cacheKey) {
      await hybridStorage.set(cacheKey, result, ttl);
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching collection at ${collectionPath}:`, error);
    throw error;
  }
}

/**
 * Prefetch documents that the user is likely to need
 * Based on user behaviors and patterns
 */
export async function prefetchLikelyDocuments(
  db: Firestore,
  paths: string[],
  ttl = SHORT_TTL
): Promise<void> {
  if (typeof window === 'undefined' || paths.length === 0) {
    return;
  }
  
  // Use low priority, non-blocking fetch
  setTimeout(async () => {
    try {
      const promises = paths.map(path => {
        const docRef = doc(db, path);
        return getDoc(docRef).then(docSnap => {
          if (docSnap.exists()) {
            const cacheKey = `doc_${path}`;
            return hybridStorage.set(cacheKey, docSnap.data(), ttl);
          }
        });
      });
      
      await Promise.all(promises);
    } catch (error) {
      // Silent catch - prefetching should not disrupt the application
      console.debug('Error prefetching documents:', error);
    }
  }, 0);
}

/**
 * Get optimized download URL for Firebase Storage
 * Implements caching and retry logic
 */
export async function getOptimizedStorageUrl(
  storage: FirebaseStorage, 
  path: string,
  options: {
    cacheTime?: number;
    retries?: number;
    retryDelay?: number;
  } = {}
): Promise<string> {
  const {
    cacheTime = LONG_TTL,
    retries = 2,
    retryDelay = 1000
  } = options;
  
  // Check cache first
  const cacheKey = `storage_${path}`;
  const cachedUrl = await hybridStorage.get<string>(cacheKey);
  
  if (cachedUrl) {
    return cachedUrl;
  }
  
  // If not in cache, fetch with retry logic
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      // Cache the URL
      await hybridStorage.set(cacheKey, url, cacheTime);
      
      return url;
    } catch (error) {
      lastError = error as Error;
      if (i < retries) {
        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * Math.pow(2, i))
        );
      }
    }
  }
  
  throw lastError;
}

/**
 * Build an optimized query with proper indexes
 * Helps avoid full collection scans in Firestore
 */
export function optimizedQuery(
  db: Firestore,
  collectionPath: string,
  filters: Array<{
    field: string;
    operator: '==' | '!=' | '>' | '>=' | '<' | '<=';
    value: any;
  }>,
  sortOptions?: {
    field: string;
    direction?: 'asc' | 'desc';
  },
  limitCount?: number
) {
  const collectionRef = collection(db, collectionPath);
  
  const constraints: QueryConstraint[] = filters.map(filter => 
    where(filter.field, filter.operator, filter.value)
  );
  
  if (sortOptions) {
    constraints.push(orderBy(sortOptions.field, sortOptions.direction || 'asc'));
  }
  
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  
  return query(collectionRef, ...constraints);
}
