import axios from 'axios';

export const Config = {
  API_BASE_URL: import.meta.env.PROD 
    ? 'https://e-store-control-center-backend.vercel.app' 
    : '',
};

const api = axios.create({
  baseURL: Config.API_BASE_URL,
});

// In-Flight Request Deduplication & Memory SWR Store
const _IN_FLIGHT_PROMISES = new Map();
const _MEMORY_CACHE = new Map();
const DEFAULT_TTL_MS = 60 * 1000; // 60s memory TTL to eliminate redundant DB reads

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('estore_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Invalidate memory cache on any mutating request
    const method = response.config.method?.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      api.clearCache();
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('estore_admin_token');
      localStorage.removeItem('estore_admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Deduplicated & Cached GET fetcher
 * Reuses existing in-flight promises and shared memory cache across all components
 */
api.getCached = async (url, config = {}, ttlMs = DEFAULT_TTL_MS) => {
  const cacheKey = `${url}_${JSON.stringify(config.params || {})}`;
  const now = Date.now();

  // 1. Return fresh memory cache if available
  const cached = _MEMORY_CACHE.get(cacheKey);
  if (cached && now < cached.expiry) {
    return cached.data;
  }

  // 2. Return existing in-flight promise if currently loading
  if (_IN_FLIGHT_PROMISES.has(cacheKey)) {
    return _IN_FLIGHT_PROMISES.get(cacheKey);
  }

  // 3. Dispatch single request and store promise
  const promise = api.get(url, config)
    .then((res) => {
      _MEMORY_CACHE.set(cacheKey, {
        data: res.data,
        expiry: Date.now() + ttlMs,
      });
      return res.data;
    })
    .finally(() => {
      _IN_FLIGHT_PROMISES.delete(cacheKey);
    });

  _IN_FLIGHT_PROMISES.set(cacheKey, promise);
  return promise;
};

/**
 * Clear or invalidate memory cache
 */
api.clearCache = (pattern = null) => {
  if (!pattern) {
    _MEMORY_CACHE.clear();
  } else {
    for (const key of _MEMORY_CACHE.keys()) {
      if (key.includes(pattern)) {
        _MEMORY_CACHE.delete(key);
      }
    }
  }
};

export default api;
