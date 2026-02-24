import { useCallback, useRef, useEffect, useMemo } from 'react';

interface CacheItem<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
  lastAccessed: number;
}

interface CacheOptions {
  defaultTTL?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
  enableLogs?: boolean;
  cleanupInterval?: number; // Cleanup interval in milliseconds
}

interface CacheStats {
  size: number;
  hitRate: number;
  misses: number;
  hits: number;
  oldestItem: number | null;
  newestItem: number | null;
}

interface CacheOperations {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttl?: number) => void;
  remove: (key: string) => boolean;
  clear: () => void;
  has: (key: string) => boolean;
  getStats: () => CacheStats;
  keys: () => string[];
  values: () => unknown[];
}

export const useCache = (options: CacheOptions = {}): CacheOperations => {
  const {
    defaultTTL = 5 * 60 * 1000, // 5 minutes default
    maxSize = 100,
    enableLogs = false,
    cleanupInterval = 60 * 1000 // 1 minute default cleanup
  } = options;

  const cacheRef = useRef<Map<string, CacheItem<unknown>>>(new Map());
  const hitsRef = useRef<number>(0);
  const missesRef = useRef<number>(0);
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const log = useCallback((message: string, data?: unknown) => {
    if (enableLogs) {
      console.log(`[Cache] ${message}`, data || '');
    }
  }, [enableLogs]);

  const removeExpiredItems = useCallback(() => {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, value] of cacheRef.current.entries()) {
      if (now > value.expiresAt) {
        cacheRef.current.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      log(`Cleaned up ${expiredCount} expired items`);
    }
  }, [log]);

  const enforceMaxSize = useCallback(() => {
    if (cacheRef.current.size <= maxSize) return;

    // Sort by lastAccessed and remove oldest
    const items = Array.from(cacheRef.current.entries());
    items.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const itemsToRemove = items.slice(0, cacheRef.current.size - maxSize);
    itemsToRemove.forEach(([key]) => {
      cacheRef.current.delete(key);
    });

    log(`Enforced max size: removed ${itemsToRemove.length} items`);
  }, [maxSize, log]);

  // cleanup on interval
  useEffect(() => {
    if (cleanupInterval > 0) {
      cleanupTimerRef.current = setInterval(() => {
        removeExpiredItems();
        enforceMaxSize();
      }, cleanupInterval);
    }

    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [cleanupInterval, removeExpiredItems, enforceMaxSize]);

  const get = useCallback(<T>(key: string): T | null => {
    const item = cacheRef.current.get(key) as CacheItem<T> | undefined;

    if (!item) {
      missesRef.current++;
      log(`Miss: ${key}`);
      return null;
    }

    const now = Date.now();
    if (now > item.expiresAt) {
      cacheRef.current.delete(key);
      missesRef.current++;
      log(`Expired: ${key}`);
      return null;
    }

    // Update last accessed time
    item.lastAccessed = now;
    cacheRef.current.set(key, item);
    hitsRef.current++;
    log(`Hit: ${key}`);

    return item.data;
  }, [log]);

  const set = useCallback(<T>(key: string, data: T, ttl: number = defaultTTL): void => {
    const now = Date.now();
    
    const item: CacheItem<T> = {
      data,
      expiresAt: now + ttl,
      createdAt: now,
      lastAccessed: now
    };

    cacheRef.current.set(key, item);
    enforceMaxSize();
    log(`Set: ${key}`, { ttl });
  }, [defaultTTL, enforceMaxSize, log]);

  const remove = useCallback((key: string): boolean => {
    const deleted = cacheRef.current.delete(key);
    if (deleted) {
      log(`Removed: ${key}`);
    }
    return deleted;
  }, [log]);

  const clear = useCallback((): void => {
    cacheRef.current.clear();
    hitsRef.current = 0;
    missesRef.current = 0;
    log('Cache cleared');
  }, [log]);

  const has = useCallback((key: string): boolean => {
    const item = cacheRef.current.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now > item.expiresAt) {
      cacheRef.current.delete(key);
      return false;
    }

    return true;
  }, []);

  const getStats = useCallback((): CacheStats => {
    const items = Array.from(cacheRef.current.values());
    
    const oldestItem = items.length > 0 
      ? Math.min(...items.map(i => i.createdAt)) 
      : null;
    
    const newestItem = items.length > 0 
      ? Math.max(...items.map(i => i.createdAt)) 
      : null;

    return {
      size: cacheRef.current.size,
      hitRate: hitsRef.current + missesRef.current > 0 
        ? hitsRef.current / (hitsRef.current + missesRef.current) 
        : 0,
      hits: hitsRef.current,
      misses: missesRef.current,
      oldestItem,
      newestItem
    };
  }, []);

  const keys = useCallback((): string[] => {
    return Array.from(cacheRef.current.keys());
  }, []);

  const values = useCallback((): unknown[] => {
    return Array.from(cacheRef.current.values()).map(item => item.data);
  }, []);

  return useMemo(() => ({
    get,
    set,
    remove,
    clear,
    has,
    getStats,
    keys,
    values
  }), [get, set, remove, clear, has, getStats, keys, values]);
};