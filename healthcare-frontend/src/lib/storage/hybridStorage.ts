/**
 * HybridStorage combines in-memory cache with persistent IndexedDB storage
 * for optimal caching performance in the healthcare application.
 */

import { openDB, IDBPDatabase } from 'idb';

// In-memory cache for fastest access
export class HybridStorage {
  private namespace: string;
  private dbName: string;
  private dbVersion: number;
  private db: IDBPDatabase | null = null;
  private memoryCache = new Map<string, { data: any; timestamp: number }>();

  constructor(namespace: string, dbName: string = 'healthcare-cache', dbVersion: number = 1) {
    this.namespace = namespace;
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    
    // Initialize IndexedDB only in browser environment
    if (typeof window !== 'undefined') {
      this.initializeDB();
    }
  }

  private async initializeDB() {
    this.db = await openDB(this.dbName, this.dbVersion, {
      upgrade(db) {
        // Create object stores for different data types if they don't exist
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('appointments')) {
          db.createObjectStore('appointments', { keyPath: 'id' });
        }
      },
    });
  }

  /**
   * Generate a namespaced key to avoid collisions
   */
  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Get data from cache (memory first, then IndexedDB)
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);
    
    // Check memory cache first (fastest)
    const memItem = this.memoryCache.get(fullKey);
    if (memItem) {
      // Check if cached data is still valid
      if (memItem.timestamp > Date.now()) {
        return memItem.data as T;
      }
      // Remove expired items
      this.memoryCache.delete(fullKey);
    }
    
    // If not in memory, check IndexedDB
    try {
      if (this.db) {
        const storedItem = await this.db.get('cache', fullKey);
        
        if (storedItem && storedItem.expiry > Date.now()) {
          // Cache in memory for faster subsequent access
          this.memoryCache.set(fullKey, storedItem);
          return storedItem.data as T;
        }
        
        // Remove expired items from IndexedDB
        if (storedItem) {
          await this.db.delete('cache', fullKey);
        }
      }
    } catch (err) {
      console.error('Error accessing IndexedDB cache:', err);
    }
    
    return null;
  }

  /**
   * Store data in both memory and IndexedDB caches
   */
  async set<T>(key: string, data: T, ttl: number = 300000): Promise<void> {
    const fullKey = this.getKey(key);
    const expiry = Date.now() + ttl;
    const item = { data, expiry, timestamp: Date.now() };
    
    // Store in memory cache
    this.memoryCache.set(fullKey, item);
    
    // Store in IndexedDB for persistence
    try {
      if (this.db) {
        await this.db.put('cache', item, fullKey);
      }
    } catch (err) {
      console.error('Error storing in IndexedDB cache:', err);
    }
  }

  /**
   * Remove item from both caches
   */
  async remove(key: string): Promise<void> {
    const fullKey = this.getKey(key);
    
    // Remove from memory
    this.memoryCache.delete(fullKey);
    
    // Remove from IndexedDB
    try {
      if (this.db) {
        await this.db.delete('cache', fullKey);
      }
    } catch (err) {
      console.error('Error removing from IndexedDB cache:', err);
    }
  }

  /**
   * Clear all cached data for this namespace
   */
  async clear(): Promise<void> {
    const prefix = `${this.namespace}:`;
    
    // Clear from memory
    this.memoryCache.forEach((value, key) => {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    });
    
    // Clear from IndexedDB
    try {
      if (this.db) {
        const allKeys = await this.db.getAllKeys('cache');
        const namespacedKeys = allKeys.filter(key => 
          typeof key === 'string' && key.startsWith(prefix)
        );
        
        await Promise.all(
          namespacedKeys.map(key => this.db.delete('cache', key))
        );
      }
    } catch (err) {
      console.error('Error clearing IndexedDB cache:', err);
    }
  }
}
