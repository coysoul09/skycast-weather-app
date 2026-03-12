/**
 * ================================================================
 * AETHER WEATHER — api/cache.js
 *
 * Purpose: Thin localStorage cache layer sitting between script.js
 * and weather.api.js. Prevents redundant API calls when the user
 * revisits the same city within CONFIG.CACHE_TTL seconds.
 *
 * Dev Note: We use a timestamp-based TTL (time-to-live) pattern.
 * Each cache entry stores { data, timestamp }. On read, we check if
 * (now - timestamp) > TTL and treat stale entries as cache misses.
 * ================================================================
 */

import { CONFIG } from './config.js';

const CACHE_KEY = CONFIG.STORAGE_KEYS.CACHE;

/**
 * _loadStore — reads the full cache object from localStorage.
 * Returns empty object if nothing stored or JSON is corrupt.
 */
function _loadStore() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

/**
 * _saveStore — writes the full cache object back to localStorage.
 * Silently fails if storage quota is exceeded.
 */
function _saveStore(store) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch (e) {
    // QuotaExceededError — clear cache and move on
    console.warn('[Aether Cache] Storage full, clearing cache.', e);
    localStorage.removeItem(CACHE_KEY);
  }
}

/**
 * cacheSet
 * Stores a value under `key` with the current timestamp.
 * @param {string} key   - e.g. "current:london" or "forecast:51.5:-0.12"
 * @param {*}      value - any JSON-serializable value
 */
export function cacheSet(key, value) {
  const store = _loadStore();
  store[key] = { data: value, timestamp: Date.now() };
  _saveStore(store);
}

/**
 * cacheGet
 * Returns cached value if it exists and hasn't expired.
 * Returns null on miss or expiry.
 * @param {string} key
 * @returns {*|null}
 */
export function cacheGet(key) {
  const store = _loadStore();
  const entry = store[key];
  if (!entry) return null;

  const ageSeconds = (Date.now() - entry.timestamp) / 1000;
  if (ageSeconds > CONFIG.CACHE_TTL) {
    // Entry expired — clean it up
    delete store[key];
    _saveStore(store);
    return null;
  }

  return entry.data;
}

/**
 * cacheInvalidate
 * Removes a specific key from the cache.
 * @param {string} key
 */
export function cacheInvalidate(key) {
  const store = _loadStore();
  delete store[key];
  _saveStore(store);
}

/**
 * cacheClear
 * Wipes the entire weather cache. Does not affect other localStorage keys.
 */
export function cacheClear() {
  localStorage.removeItem(CACHE_KEY);
}

/**
 * cacheStats
 * Dev helper — returns count and size of cached entries.
 * @returns {{ count: number, entries: string[] }}
 */
export function cacheStats() {
  const store = _loadStore();
  const now = Date.now();
  const entries = Object.entries(store).map(([key, val]) => ({
    key,
    ageSeconds: Math.round((now - val.timestamp) / 1000),
    fresh: (now - val.timestamp) / 1000 < CONFIG.CACHE_TTL,
  }));
  return { count: entries.length, entries };
}
