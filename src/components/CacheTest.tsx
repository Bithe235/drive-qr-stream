import { useEffect, useState } from 'react';
import { getCacheStats, clearAllCachedVideos } from '../lib/videoCache';

export const CacheTest = () => {
  const [stats, setStats] = useState<{ count: number; totalSize: number; oldest: number | null }>({ 
    count: 0, 
    totalSize: 0, 
    oldest: null 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const cacheStats = await getCacheStats();
        setStats(cacheStats);
      } catch (error) {
        console.error('Error fetching cache stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleClearCache = async () => {
    try {
      await clearAllCachedVideos();
      const cacheStats = await getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  // Hide the component from users in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (loading) {
    return <div style={{ display: 'none' }}>Loading cache stats...</div>;
  }

  return (
    <div style={{ display: 'none' }}>
      {/* Hidden from users but still functional for debugging */}
      <div>
        <p>Cached Videos: {stats.count}</p>
        <p>Total Size: {(stats.totalSize / (1024 * 1024)).toFixed(2)} MB</p>
        <p>Oldest Cache: {stats.oldest ? new Date(stats.oldest).toLocaleString() : 'N/A'}</p>
      </div>
      <button onClick={handleClearCache}>
        Clear Cache
      </button>
    </div>
  );
};