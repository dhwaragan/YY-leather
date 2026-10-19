/**
 * Lightweight cache utility with localStorage persistence and TTL support.
 * Reduces Supabase bandwidth by caching data client-side.
 */
const CACHE_PREFIX = 'yy_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

export function getCache<T>(key: string, ttl = DEFAULT_TTL): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, value: T, ttl = DEFAULT_TTL): void {
  try {
    const entry: CacheEntry<T> = { value, timestamp: Date.now(), ttl };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage full - ignore
  }
}

export function removeCache(key: string): void {
  localStorage.removeItem(CACHE_PREFIX + key);
}

export function clearCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// Public data cache (no admin data)
export const PUBLIC_DATA_KEY = 'public_data';
export const ORDERS_KEY = 'orders';
export const PREORDERS_KEY = 'preorders';
export const PRODUCTS_KEY = 'products';
export const OFFERS_KEY = 'offers';
export const CONTENT_BLOCKS_KEY = 'content_blocks';
export const CATEGORIES_KEY = 'categories';
export const HERO_SLIDES_KEY = 'hero_slides';

// Storefront cache TTL (5 min) — keeps Supabase bandwidth usage strictly limited
export const PUBLIC_TTL = 5 * 60 * 1000;

// Festival settings - cache for 24 hours (STEP 16)
export const FESTIVAL_TTL = 24 * 60 * 60 * 1000;

// Admin data - short TTL (2 min) to show updates
export const ADMIN_TTL = 2 * 60 * 1000;

// Keys that are NEVER needed for public visitors - only admins
export const ADMIN_ONLY_KEYS = ['orders', 'preorders', 'profiles', 'buybacks'];