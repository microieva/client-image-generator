import { useCallback } from 'react';
import { useCache } from './useCache';
import { apiClient } from '../config/api';

interface CachedApiOptions {
  ttl?: number;
  invalidateOnMutate?: boolean;
}

interface ApiResponse<T> {
  data: T;
  fromCache: boolean;
}

export const useCachedApi = (options: CachedApiOptions = {}) => {
  const {
    ttl = 5 * 60 * 1000,
    invalidateOnMutate = true
  } = options;

  const cache = useCache({
    defaultTTL: ttl,
    enableLogs: process.env.NODE_ENV === 'development',
    maxSize: 200
  });

  const getCached = useCallback(async <T>(url: string): Promise<ApiResponse<T>> => {
    const cacheKey = `get:${url}`;
    
    // Try to get from cache first
    const cachedData = cache.get<T>(cacheKey);
    if (cachedData) {
      return {
        data: cachedData,
        fromCache: true
      };
    }

    // Fetch from API if not in cache
    const response = await apiClient.get<T>(url);
    cache.set(cacheKey, response.data);
    
    return {
      data: response.data,
      fromCache: false
    };
  }, [cache]);

  const postWithCache = useCallback(async <T, D = unknown>(url: string, data: D): Promise<T> => {
    const response = await apiClient.post<T>(url, data);
    
    if (invalidateOnMutate) {
      // Invalidate related cache entries
      const cacheKeys = cache.keys();
      const relatedKeys = cacheKeys.filter(key => 
        key.startsWith(`get:${url.split('/')[0]}`)
      );
      relatedKeys.forEach(key => cache.remove(key));
    }
    
    return response.data;
  }, [cache, invalidateOnMutate]);

  const putWithCache = useCallback(async <T, D = unknown>(url: string, data: D): Promise<T> => {
    const response = await apiClient.put<T>(url, data);
    
    if (invalidateOnMutate) {
      // Invalidate specific URL and potentially related endpoints
      cache.remove(`get:${url}`);
      
      // Also invalidate list views
      const basePath = url.split('/').slice(0, -1).join('/');
      const listKey = `get:${basePath}`;
      cache.remove(listKey);
    }
    
    return response.data;
  }, [cache, invalidateOnMutate]);

  const deleteWithCache = useCallback(async (url: string): Promise<void> => {
    await apiClient.delete(url);
    
    if (invalidateOnMutate) {
      // Invalidate related cache entries
      const basePath = url.split('/').slice(0, -1).join('/');
      cache.keys().forEach(key => {
        if (key.includes(basePath)) {
          cache.remove(key);
        }
      });
    }
  }, [cache, invalidateOnMutate]);

  const invalidateCache = useCallback((pattern?: string) => {
    if (pattern) {
      cache.keys().forEach(key => {
        if (key.includes(pattern)) {
          cache.remove(key);
        }
      });
    } else {
      cache.clear();
    }
  }, [cache]);

  const getCacheStats = useCallback(() => {
    return cache.getStats();
  }, [cache]);

  return {
    get: getCached,
    post: postWithCache,
    put: putWithCache,
    delete: deleteWithCache,
    invalidate: invalidateCache,
    stats: getCacheStats,
    cache // Direct access to cache operations if needed
  };
};