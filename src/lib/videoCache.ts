// Video caching utility using IndexedDB for larger storage capacity
import { debugCache } from './cacheDebugger';
import { generateVideoCacheKey } from './videoUtils';

const DB_NAME = 'VideoCacheDB';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

// Video cache entry structure
interface VideoCacheEntry {
  id: string;
  title: string;
  url: string;
  blob: Blob;
  cachedAt: number;
  size: number;
}

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  debugCache.log('Initializing IndexedDB');
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      debugCache.error('Failed to open IndexedDB', request.error);
      reject(request.error);
    };
    request.onsuccess = () => {
      debugCache.log('IndexedDB opened successfully');
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      debugCache.log('Creating IndexedDB structure');
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('cachedAt', 'cachedAt', { unique: false });
        debugCache.log('Created object store', STORE_NAME);
      }
    };
  });
};

// Check if IndexedDB is available
const isIndexedDBAvailable = (): boolean => {
  const available = debugCache.testIndexedDB();
  return available;
};

// Get cached video blob URL (returns blob URL if cached)
export const getCachedVideoUrl = async (videoId: string, originalUrl: string): Promise<string | null> => {
  // Generate a consistent cache key
  const cacheKey = generateVideoCacheKey(videoId, originalUrl);
  debugCache.log('getCachedVideoUrl called', { videoId, originalUrl, cacheKey });
  
  if (!isIndexedDBAvailable()) {
    debugCache.warn('IndexedDB not available, caching disabled');
    return null;
  }
  
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(cacheKey);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          // Video found in cache, return blob URL
          debugCache.log(`Video ${cacheKey} found in cache`, {
            size: request.result.size,
            cachedAt: new Date(request.result.cachedAt).toLocaleString()
          });
          console.log(`[VideoCache] Serving cached video: ${cacheKey} (${(request.result.size / (1024 * 1024)).toFixed(2)} MB)`);
          const blobUrl = URL.createObjectURL(request.result.blob);
          resolve(blobUrl);
        } else {
          // Video not in cache, download and cache it
          debugCache.log(`Video ${cacheKey} not in cache, downloading...`);
          console.log(`[VideoCache] Video ${cacheKey} not in cache, downloading from server`);
          cacheVideo(cacheKey, originalUrl).then(resolve).catch(reject);
        }
      };
      
      request.onerror = () => {
        debugCache.error('Error reading from cache', request.error);
        reject(request.error);
      };
    });
  } catch (e) {
    debugCache.error('Error accessing cache', e);
    return null;
  }
};

// Cache a video from URL
export const cacheVideo = async (videoId: string, url: string): Promise<string | null> => {
  debugCache.log('cacheVideo called', { videoId, url });
  
  if (!isIndexedDBAvailable()) {
    debugCache.warn('IndexedDB not available, returning direct URL');
    return null;
  }
  
  try {
    // Check available storage space
    const quota = await debugCache.getStorageInfo();
    
    if (quota && quota.quota && quota.usage) {
      const availableSpace = quota.quota - quota.usage;
      debugCache.log('Available storage space', availableSpace);
      // If less than 100MB available, don't cache
      if (availableSpace < 100 * 1024 * 1024) {
        debugCache.warn('Not enough storage space to cache video');
        console.log(`[VideoCache] Not enough storage space to cache video ${videoId}`);
        return null;
      }
    }
    
    debugCache.log('Fetching video from URL', url);
    console.log(`[VideoCache] Downloading video: ${videoId} from ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    debugCache.log('Video fetched', { size: blob.size, type: blob.type });
    console.log(`[VideoCache] Video ${videoId} downloaded (${(blob.size / (1024 * 1024)).toFixed(2)} MB)`);
    
    // Check if it's too large to cache (more than 500MB)
    if (blob.size > 500 * 1024 * 1024) {
      debugCache.warn('Video too large to cache (over 500MB)');
      console.log(`[VideoCache] Video ${videoId} too large to cache (${(blob.size / (1024 * 1024)).toFixed(2)} MB)`);
      return URL.createObjectURL(blob);
    }
    
    // Save to IndexedDB
    debugCache.log('Saving video to cache');
    console.log(`[VideoCache] Caching video ${videoId}`);
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const cacheEntry: VideoCacheEntry = {
      id: videoId,
      title: `Cached Video ${videoId}`,
      url,
      blob,
      cachedAt: Date.now(),
      size: blob.size
    };
    
    const request = store.put(cacheEntry);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        debugCache.log(`Video ${videoId} cached successfully`);
        console.log(`[VideoCache] Video ${videoId} cached successfully (${(blob.size / (1024 * 1024)).toFixed(2)} MB)`);
        // Return blob URL
        resolve(URL.createObjectURL(blob));
      };
      
      request.onerror = () => {
        debugCache.error('Error caching video', request.error);
        console.error(`[VideoCache] Error caching video ${videoId}:`, request.error);
        // Even if caching fails, we can still return the blob URL
        resolve(URL.createObjectURL(blob));
      };
    });
  } catch (e) {
    debugCache.error('Error caching video', e);
    console.error(`[VideoCache] Error downloading/caching video ${videoId}:`, e);
    return null;
  }
};

// Clear cache for a specific video
export const clearCachedVideo = async (videoId: string, originalUrl: string): Promise<void> => {
  // Generate a consistent cache key
  const cacheKey = generateVideoCacheKey(videoId, originalUrl);
  debugCache.log('clearCachedVideo called', { videoId, cacheKey });
  
  if (!isIndexedDBAvailable()) return;
  
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(cacheKey);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        debugCache.log(`Video ${cacheKey} cleared from cache`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (e) {
    debugCache.error('Error clearing cached video', e);
  }
};

// Clear all cached videos
export const clearAllCachedVideos = async (): Promise<void> => {
  debugCache.log('clearAllCachedVideos called');
  
  if (!isIndexedDBAvailable()) return;
  
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        debugCache.log('All videos cleared from cache');
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (e) {
    debugCache.error('Error clearing all cached videos', e);
  }
};

// Get cache statistics
export const getCacheStats = async (): Promise<{ count: number; totalSize: number; oldest: number | null }> => {
  debugCache.log('getCacheStats called');
  
  if (!isIndexedDBAvailable()) return { count: 0, totalSize: 0, oldest: null };
  
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const videos = request.result;
        const count = videos.length;
        let totalSize = 0;
        let oldest: number | null = null;
        
        videos.forEach((video: VideoCacheEntry) => {
          totalSize += video.size;
          if (oldest === null || video.cachedAt < oldest) {
            oldest = video.cachedAt;
          }
        });
        
        debugCache.log('Cache stats', { count, totalSize, oldest });
        resolve({ count, totalSize, oldest });
      };
      
      request.onerror = () => {
        debugCache.error('Error getting cache stats', request.error);
        reject(request.error);
      };
    });
  } catch (e) {
    debugCache.error('Error getting cache stats', e);
    return { count: 0, totalSize: 0, oldest: null };
  }
};