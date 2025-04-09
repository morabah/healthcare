/**
 * Hybrid storage implementation for improved data persistence and performance
 * Combines in-memory cache with IndexedDB for offline capability
 */

// Type definitions for stored data
export interface StorageItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Default expiration time (1 hour)
const DEFAULT_TTL = 3600000;

/**
 * Hybrid storage class that provides multiple layers of caching
 * - Memory cache for fastest access
 * - IndexedDB for persistence across page refreshes
 */
export class HybridStorage {
  private memoryCache: Map<string, StorageItem<any>>;
  private dbName: string;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor(dbName: string = 'healthcare_app_cache') {
    this.memoryCache = new Map();
    this.dbName = dbName;
    // Initialize IndexedDB connection
    this.initPromise = this.initIndexedDB();
  }

  /**
   * Initialize the IndexedDB store
   */
  private async initIndexedDB(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.initialized = true;
      return;
    }

    try {
      return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(this.dbName, 1);

        request.onerror = (event) => {
          console.error('IndexedDB error:', event);
          this.initialized = true;
          resolve();
        };

        request.onsuccess = () => {
          this.initialized = true;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache', { keyPath: 'key' });
          }
        };
      });
    } catch (error) {
      console.error('Error initializing IndexedDB:', error);
      this.initialized = true;
    }
  }

  /**
   * Wait for initialization to complete
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized && this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * Get data from the hybrid cache
   * Tries memory cache first, then IndexedDB
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (fastest)
    const memoryItem = this.memoryCache.get(key);
    
    if (memoryItem) {
      // Check if the item is expired
      if (memoryItem.expiresAt > Date.now()) {
        return memoryItem.data as T;
      } else {
        // Remove expired item
        this.memoryCache.delete(key);
      }
    }

    // If not in memory or expired, try IndexedDB
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        await this.ensureInitialized();
        
        return new Promise((resolve) => {
          const request = window.indexedDB.open(this.dbName);
          
          request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction('cache', 'readonly');
            const store = transaction.objectStore('cache');
            const getRequest = store.get(key);
            
            getRequest.onsuccess = () => {
              const item = getRequest.result;
              
              if (item && item.value && item.value.expiresAt > Date.now()) {
                // Refresh memory cache with found item
                this.memoryCache.set(key, item.value);
                resolve(item.value.data as T);
              } else if (item) {
                // Item exists but is expired - delete it
                const deleteTransaction = db.transaction('cache', 'readwrite');
                const deleteStore = deleteTransaction.objectStore('cache');
                deleteStore.delete(key);
                resolve(null);
              } else {
                resolve(null);
              }
            };
            
            getRequest.onerror = () => {
              console.warn('Error reading from IndexedDB');
              resolve(null);
            };
          };
          
          request.onerror = () => {
            console.warn('Error opening IndexedDB');
            resolve(null);
          };
        });
      } catch (error) {
        console.warn('IndexedDB access failed:', error);
      }
    }
    
    return null;
  }

  /**
   * Store data in the hybrid cache
   * @param key Cache key
   * @param data Data to store
   * @param ttl Time to live in milliseconds (default: 1 hour)
   */
  async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    const timestamp = Date.now();
    const expiresAt = timestamp + ttl;
    
    // Set in memory cache (fastest access)
    const item: StorageItem<T> = { data, timestamp, expiresAt };
    this.memoryCache.set(key, item);
    
    // Store in IndexedDB for persistence (background)
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        await this.ensureInitialized();
        
        const request = window.indexedDB.open(this.dbName);
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction('cache', 'readwrite');
          const store = transaction.objectStore('cache');
          
          store.put({ key, value: item });
        };
      } catch (error) {
        console.warn('IndexedDB write failed:', error);
      }
    }
  }

  /**
   * Remove an item from the cache
   */
  async remove(key: string): Promise<void> {
    // Remove from memory cache
    this.memoryCache.delete(key);
    
    // Remove from IndexedDB
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        await this.ensureInitialized();
        
        const request = window.indexedDB.open(this.dbName);
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction('cache', 'readwrite');
          const store = transaction.objectStore('cache');
          
          store.delete(key);
        };
      } catch (error) {
        console.warn('IndexedDB delete failed:', error);
      }
    }
  }

  /**
   * Clear all cache data
   */
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear IndexedDB
    if (typeof window !== 'undefined' && window.indexedDB) {
      try {
        await this.ensureInitialized();
        
        const request = window.indexedDB.open(this.dbName);
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction('cache', 'readwrite');
          const store = transaction.objectStore('cache');
          
          store.clear();
        };
      } catch (error) {
        console.warn('IndexedDB clear failed:', error);
      }
    }
  }
}

// Export singleton instance
export const hybridStorage = new HybridStorage();
