// Cache debugging utility
export const debugCache = {
  log: (message: string, data?: any) => {
    console.log(`[CacheDebug] ${message}`, data || '');
  },
  
  error: (message: string, error?: any) => {
    console.error(`[CacheDebug] ${message}`, error || '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`[CacheDebug] ${message}`, data || '');
  },
  
  // Test IndexedDB availability
  testIndexedDB: (): boolean => {
    try {
      const available = 'indexedDB' in window;
      debugCache.log('IndexedDB availability', available);
      return available;
    } catch (e) {
      debugCache.error('Error testing IndexedDB', e);
      return false;
    }
  },
  
  // Test localStorage availability
  testLocalStorage: (): boolean => {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      debugCache.log('localStorage available');
      return true;
    } catch (e) {
      debugCache.error('localStorage not available', e);
      return false;
    }
  },
  
  // Get storage information
  getStorageInfo: async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        debugCache.log('Storage estimate', {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota && estimate.usage ? estimate.quota - estimate.usage : null
        });
        return estimate;
      }
    } catch (e) {
      debugCache.error('Error getting storage info', e);
    }
    return null;
  }
};