/**
 * Real-time Online i18n System
 * Fetches translations from API in small packets, caches for offline use
 * Works seamlessly online and offline
 *
 * Enhanced with:
 * - Cache version tracking
 * - Cache invalidation on version change
 * - Background refresh (stale-while-revalidate)
 * - Cache size limits (prevent storage bloat)
 * - Preload common languages
 */

import { API_CONFIG } from '@config/api-config.js';

type TranslationKey = string;
type TranslationValue = string | Record<string, string>;
type Translations = Record<TranslationKey, TranslationValue>;

/**
 * Current cache version - increment to invalidate all caches
 */
const CACHE_VERSION = '1.0.0';

/**
 * Maximum cache size (50MB)
 */
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

/**
 * Maximum number of cached languages
 */
const MAX_CACHED_LANGUAGES = 100;

/**
 * Cache entry TTL (30 days in milliseconds)
 */
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

interface I18nConfig {
  apiUrl: string;
  defaultLanguage: string;
  fallbackLanguage: string;
  cacheEnabled: boolean;
  chunkSize: number; // Number of keys per packet
}

interface CacheEntry {
  language: string;
  translations: Translations;
  timestamp: number;
  version?: string;
  size?: number; // Size in bytes (approximate)
}

interface CacheMetadata {
  version: string;
  lastUpdated: number;
  totalEntries: number;
  totalSize: number; // Total size in bytes
}

class I18nCache {
  private dbName = 'warmthly_i18n';
  private dbVersion = 2; // Incremented for new schema
  private db: IDBDatabase | null = null;
  private metadataStoreName = 'metadata';

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create translations store if it doesn't exist
        if (!db.objectStoreNames.contains('translations')) {
          db.createObjectStore('translations', { keyPath: 'language' });
        }

        // Create metadata store for cache management
        if (!db.objectStoreNames.contains(this.metadataStoreName)) {
          db.createObjectStore(this.metadataStoreName, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Get cache metadata
   */
  private async getMetadata(): Promise<CacheMetadata | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.metadataStoreName], 'readonly');
      const store = transaction.objectStore(this.metadataStoreName);
      const request = store.get('cache_metadata');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
    });
  }

  /**
   * Update cache metadata
   */
  private async updateMetadata(updates: Partial<CacheMetadata>): Promise<void> {
    if (!this.db) await this.init();

    const current = await this.getMetadata();
    const metadata: CacheMetadata = {
      version: CACHE_VERSION,
      lastUpdated: Date.now(),
      totalEntries: 0,
      totalSize: 0,
      ...current,
      ...updates,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.metadataStoreName], 'readwrite');
      const store = transaction.objectStore(this.metadataStoreName);
      const request = store.put({ key: 'cache_metadata', value: metadata });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Calculate approximate size of translations object
   */
  private calculateSize(translations: Translations): number {
    return JSON.stringify(translations).length;
  }

  /**
   * Check if cache entry is valid (not expired, correct version)
   */
  private isValidEntry(entry: CacheEntry | undefined): boolean {
    if (!entry || !entry.translations) {
      return false;
    }

    // Check version
    if (entry.version !== CACHE_VERSION) {
      return false;
    }

    // Check TTL
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL) {
      return false;
    }

    return true;
  }

  /**
   * Enforce cache size limits
   */
  private async enforceSizeLimits(): Promise<void> {
    if (!this.db) await this.init();

    // Get all entries
    const entries: CacheEntry[] = await new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['translations'], 'readonly');
      const store = transaction.objectStore('translations');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate total size
    let totalSize = 0;
    for (const entry of entries) {
      totalSize += entry.size || this.calculateSize(entry.translations);
    }

    // Remove oldest entries if over size limit
    if (totalSize > MAX_CACHE_SIZE || entries.length > MAX_CACHED_LANGUAGES) {
      const toRemove: string[] = [];

      for (const entry of entries) {
        if (
          totalSize <= MAX_CACHE_SIZE &&
          entries.length - toRemove.length <= MAX_CACHED_LANGUAGES
        ) {
          break;
        }

        toRemove.push(entry.language);
        totalSize -= entry.size || this.calculateSize(entry.translations);
      }

      // Remove entries
      for (const lang of toRemove) {
        await this.delete(lang);
      }
    }
  }

  async get(language: string): Promise<Translations | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['translations'], 'readonly');
      const store = transaction.objectStore('translations');
      const request = store.get(language);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;

        if (this.isValidEntry(entry)) {
          resolve(entry!.translations);
        } else {
          // Entry is invalid, delete it
          if (entry) {
            this.delete(language).catch(() => {});
          }
          resolve(null);
        }
      };
    });
  }

  async set(language: string, translations: Translations, version?: string): Promise<void> {
    if (!this.db) await this.init();

    const size = this.calculateSize(translations);

    // Check if adding this would exceed limits
    const metadata = await this.getMetadata();
    const currentSize = metadata?.totalSize || 0;
    const currentEntries = metadata?.totalEntries || 0;

    // Enforce size limits before adding
    if (currentSize + size > MAX_CACHE_SIZE || currentEntries >= MAX_CACHED_LANGUAGES) {
      await this.enforceSizeLimits();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['translations'], 'readwrite');
      const store = transaction.objectStore('translations');
      const entry: CacheEntry = {
        language,
        translations,
        timestamp: Date.now(),
        version: version || CACHE_VERSION,
        size,
      };
      const request = store.put(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        // Update metadata
        const newMetadata = await this.getMetadata();
        await this.updateMetadata({
          totalEntries: (newMetadata?.totalEntries || 0) + ((await this.has(language)) ? 0 : 1),
          totalSize: (newMetadata?.totalSize || 0) - (newMetadata?.totalSize || 0) + size,
        });
        resolve();
      };
    });
  }

  async has(language: string): Promise<boolean> {
    const entry = await this.get(language);
    return entry !== null;
  }

  async delete(language: string): Promise<void> {
    if (!this.db) await this.init();

    // Get entry to calculate size reduction
    const entry = await new Promise<CacheEntry | null>((resolve, reject) => {
      const transaction = this.db!.transaction(['translations'], 'readonly');
      const store = transaction.objectStore('translations');
      const request = store.get(language);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['translations'], 'readwrite');
      const store = transaction.objectStore('translations');
      const request = store.delete(language);

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        // Update metadata
        if (entry) {
          const metadata = await this.getMetadata();
          await this.updateMetadata({
            totalEntries: Math.max(0, (metadata?.totalEntries || 1) - 1),
            totalSize: Math.max(0, (metadata?.totalSize || 0) - (entry.size || 0)),
          });
        }
        resolve();
      };
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['translations', this.metadataStoreName],
        'readwrite'
      );
      const translationsStore = transaction.objectStore('translations');
      const metadataStore = transaction.objectStore(this.metadataStoreName);

      const clearTranslations = translationsStore.clear();
      const clearMetadata = metadataStore.clear();

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve();
        }
      };

      clearTranslations.onsuccess = checkComplete;
      clearTranslations.onerror = () => reject(clearTranslations.error);
      clearMetadata.onsuccess = checkComplete;
      clearMetadata.onerror = () => reject(clearMetadata.error);
    });
  }

  /**
   * Invalidate cache for a specific language
   */
  async invalidateLanguage(language: string): Promise<void> {
    await this.delete(language);
  }

  /**
   * Invalidate all cache (version change)
   */
  async invalidateAll(): Promise<void> {
    await this.clear();
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    version: string;
    lastUpdated: number;
  }> {
    const metadata = await this.getMetadata();
    return {
      totalEntries: metadata?.totalEntries || 0,
      totalSize: metadata?.totalSize || 0,
      version: metadata?.version || CACHE_VERSION,
      lastUpdated: metadata?.lastUpdated || 0,
    };
  }
}

class I18n {
  private currentLanguage: string;
  private translations: Map<string, Translations> = new Map();
  private loadingPromises: Map<string, Promise<Translations>> = new Map();
  private config: I18nConfig;
  private cache: I18nCache;
  private online: boolean;

  constructor(config: Partial<I18nConfig> = {}) {
    this.config = {
      apiUrl: API_CONFIG.i18nUrl,
      defaultLanguage: 'en',
      fallbackLanguage: 'en',
      cacheEnabled: true,
      chunkSize: 50, // Load 50 keys per packet
      ...config,
    };

    this.cache = new I18nCache();

    // Detect online status (only in browser)
    if (typeof navigator !== 'undefined') {
      this.online = navigator.onLine;
    } else {
      this.online = true; // Assume online in SSR
    }

    // Detect language from browser or use default
    this.currentLanguage = this.detectLanguage();

    // Listen for online/offline events (only in browser)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.online = true;
        // Try to refresh translations when coming back online
        this.loadLanguage(this.currentLanguage, true).catch(() => {});
      });

      window.addEventListener('offline', () => {
        this.online = false;
      });
    }

    // Preload default language from cache
    if (this.config.cacheEnabled) {
      this.loadLanguage(this.config.defaultLanguage, false).catch(() => {
        // Silently fail if cache is empty
      });
    }
  }

  /**
   * Detect user's preferred language from browser
   */
  private detectLanguage(): string {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return this.config.defaultLanguage;
    }

    // Check localStorage first
    try {
      const stored = localStorage.getItem('warmthly_language');
      if (stored) {
        return stored;
      }
    } catch {
      // localStorage not available (SSR or private browsing)
    }

    // Check browser language
    const browserLang =
      navigator.language || (navigator.languages && navigator.languages[0]) || 'en';
    const langCode = browserLang.split('-')[0]?.toLowerCase();

    return langCode || 'en';
  }

  /**
   * Set the current language
   */
  async setLanguage(language: string, forceRefresh: boolean = false): Promise<void> {
    this.currentLanguage = language;

    // Store in localStorage (only in browser)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('warmthly_language', language);
      } catch {
        // localStorage not available (private browsing)
      }
    }

    await this.loadLanguage(language, forceRefresh);

    // Update document language attribute
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = language;
    }
  }

  /**
   * Get the current language
   */
  getLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Load translations for a language
   * @param language - Language code
   * @param forceRefresh - Force refresh from API even if cached
   */
  async loadLanguage(language: string, forceRefresh: boolean = false): Promise<Translations> {
    // Return cached translations if available and not forcing refresh
    if (!forceRefresh && this.translations.has(language)) {
      return this.translations.get(language)!;
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(language)) {
      return this.loadingPromises.get(language)!;
    }

    // Start loading
    const loadPromise = this.fetchTranslations(language, forceRefresh)
      .then(translations => {
        this.translations.set(language, translations);
        this.loadingPromises.delete(language);
        return translations;
      })
      .catch(error => {
        this.loadingPromises.delete(language);

        // Try fallback language if current language fails
        if (language !== this.config.fallbackLanguage) {
          return this.loadLanguage(this.config.fallbackLanguage, false);
        }

        // If fallback also fails, return empty object
        if (import.meta.env.DEV) {
          // Phase 7 Issue 7.6: Environment-aware logging
          if (import.meta.env?.DEV) {
            console.error(`[i18n] Failed to load translations for ${language}:`, error);
          }
        }
        return {} as Translations;
      });

    this.loadingPromises.set(language, loadPromise);
    return loadPromise;
  }

  /**
   * Fetch translations from API or cache
   * Enhanced with version checking and background refresh
   */
  private async fetchTranslations(
    language: string,
    forceRefresh: boolean = false
  ): Promise<Translations> {
    // Try cache first if not forcing refresh
    if (!forceRefresh && this.config.cacheEnabled) {
      try {
        const cached = await this.cache.get(language);
        if (cached && Object.keys(cached).length > 0) {
          // Use cached version immediately
          this.translations.set(language, cached);

          // Background refresh: Update cache when online (stale-while-revalidate pattern)
          if (this.online) {
            // Don't await - refresh in background
            this.fetchFromAPI(language)
              .then(freshTranslations => {
                // Update cache with fresh translations
                if (this.config.cacheEnabled) {
                  this.cache.set(language, freshTranslations, CACHE_VERSION).catch(() => {});
                }
                // Update in-memory cache
                this.translations.set(language, freshTranslations);
              })
              .catch(() => {
                // Silently fail - we have cached version
              });
          }

          return cached;
        }
      } catch (error) {
        // Cache read failed, continue to API
        if (import.meta.env.DEV) {
          // Phase 7 Issue 7.6: Environment-aware logging
          if (import.meta.env?.DEV) {
            console.warn('[i18n] Cache read failed, fetching from API:', error);
          }
        }
      }
    }

    // Fetch from API if online
    if (this.online) {
      const translations = await this.fetchFromAPI(language);

      // Cache the fresh translations
      if (this.config.cacheEnabled) {
        this.cache.set(language, translations, CACHE_VERSION).catch(() => {});
      }

      return translations;
    }

    // Offline and no cache - return empty
    return {} as Translations;
  }

  /**
   * Fetch translations from API in small packets
   */
  private async fetchFromAPI(language: string): Promise<Translations> {
    try {
      // First, get the list of translation keys (or all at once if API supports it)
      const response = await fetch(`${this.config.apiUrl}/${language}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store', // Always fetch fresh
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // API can return either:
      // 1. Full translations object: { "key": "value", ... }
      // 2. Chunked response: { "chunks": [...], "total": 100 }
      // 3. Keys list + fetch chunks: { "keys": [...], "chunkSize": 50 }

      let translations: Translations = {};

      if (data.translations) {
        // Full translations
        translations = data.translations;
      } else if (data.chunks) {
        // Already chunked - merge chunks
        translations = Object.assign({}, ...data.chunks);
      } else if (data.keys && Array.isArray(data.keys)) {
        // Need to fetch chunks
        const keys = data.keys;
        const chunkSize = data.chunkSize || this.config.chunkSize;
        const chunks: Promise<Translations>[] = [];

        // Fetch in parallel chunks
        for (let i = 0; i < keys.length; i += chunkSize) {
          const chunk = keys.slice(i, i + chunkSize);
          chunks.push(
            fetch(`${this.config.apiUrl}/${language}/chunk`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({ keys: chunk }),
            })
              .then(res => res.json())
              .then(data => data.translations || {})
          );
        }

        // Wait for all chunks and merge
        const chunkResults = await Promise.all(chunks);
        translations = Object.assign({}, ...chunkResults);
      } else {
        // Assume it's a flat translations object
        translations = data;
      }

      // Cache the translations
      if (this.config.cacheEnabled) {
        await this.cache.set(language, translations, data.version);
      }

      return translations;
    } catch (error) {
      // If online fetch fails, try cache as fallback
      if (this.config.cacheEnabled) {
        const cached = await this.cache.get(language);
        if (cached) {
          return cached;
        }
      }
      throw error;
    }
  }

  /**
   * Get a translation by key
   * Supports nested keys with dot notation (e.g., "common.button.submit")
   */
  t(key: string, params?: Record<string, string | number>): string {
    const translations = this.translations.get(this.currentLanguage);

    if (!translations) {
      // Phase 7 Issue 7.8: Improved fallback - try English instead of returning key
      return this.getFallbackTranslation(key, params) || `[${key}]`;
    }

    // Support nested keys with dot notation
    const keys = key.split('.');
    let value: TranslationValue | undefined = translations as TranslationValue;

    for (const k of keys) {
      if (value && typeof value === 'object' && !Array.isArray(value) && k in value) {
        value = (value as Record<string, TranslationValue>)[k];
      } else {
        // Try fallback language
        const fallbackValue = this.getFallbackTranslation(key, params);
        if (fallbackValue) {
          return fallbackValue;
        }
        // Phase 7 Issue 7.8: Return user-friendly message instead of key
        if (import.meta.env?.DEV) {
          console.warn(`[i18n] Missing translation key: ${key} (language: ${this.currentLanguage})`);
        }
        return `[${key}]`; // User-friendly fallback instead of raw key
      }
    }

    if (typeof value !== 'string') {
      const fallbackValue = this.getFallbackTranslation(key, params);
      return fallbackValue || `[${key}]`;
    }

    // Replace parameters in translation
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  }

  /**
   * Get fallback translation from English or fallback language
   * Phase 7 Issue 7.8: Improved fallback strategy
   */
  private getFallbackTranslation(key: string, params?: Record<string, string | number>): string | null {
    // Try fallback language first
    const fallbackTranslations = this.translations.get(this.config.fallbackLanguage);
    if (fallbackTranslations) {
      const keys = key.split('.');
      let fallbackValue: TranslationValue | undefined = fallbackTranslations as TranslationValue;
      for (const fk of keys) {
        if (
          fallbackValue &&
          typeof fallbackValue === 'object' &&
          !Array.isArray(fallbackValue) &&
          fk in fallbackValue
        ) {
          fallbackValue = (fallbackValue as Record<string, TranslationValue>)[fk];
        } else {
          break;
        }
      }
      if (typeof fallbackValue === 'string') {
        // Replace parameters
        if (params) {
          return fallbackValue.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
            return params[paramKey]?.toString() || match;
          });
        }
        return fallbackValue;
      }
    }

    // Try English as last resort
    if (this.config.fallbackLanguage !== 'en') {
      const englishTranslations = this.translations.get('en');
      if (englishTranslations) {
        const keys = key.split('.');
        let englishValue: TranslationValue | undefined = englishTranslations as TranslationValue;
        for (const ek of keys) {
          if (
            englishValue &&
            typeof englishValue === 'object' &&
            !Array.isArray(englishValue) &&
            ek in englishValue
          ) {
            englishValue = (englishValue as Record<string, TranslationValue>)[ek];
          } else {
            return null;
          }
        }
        if (typeof englishValue === 'string') {
          // Replace parameters
          if (params) {
            return englishValue.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
              return params[paramKey]?.toString() || match;
            });
          }
          return englishValue;
        }
      }
    }

    return null;
  }

  /**
   * Get all available languages (from API)
   */
  async getAvailableLanguages(): Promise<string[]> {
    try {
      if (!this.online) {
        // Return cached languages or default
        return [this.config.defaultLanguage, this.config.fallbackLanguage];
      }

      const response = await fetch(`${this.config.apiUrl}/languages`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.languages || [this.config.defaultLanguage];
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        // Phase 7 Issue 7.6: Environment-aware logging
        if (import.meta.env?.DEV) {
          console.warn('[i18n] Failed to fetch available languages:', error);
        }
      }
    }

    return [this.config.defaultLanguage];
  }

  /**
   * Preload a language (useful for prefetching)
   */
  async preloadLanguage(language: string, forceRefresh: boolean = false): Promise<void> {
    await this.loadLanguage(language, forceRefresh);
  }

  /**
   * Preload common languages on page load
   * Loads top languages in background for better UX
   */
  async preloadCommonLanguages(): Promise<void> {
    if (!this.online) {
      return;
    }

    // Common languages to preload (based on global usage)
    const commonLanguages = [
      'es',
      'fr',
      'de',
      'it',
      'pt',
      'ru',
      'ja',
      'zh',
      'ar',
      'hi',
      'bn',
      'ta',
      'te',
      'th',
      'vi',
      'id',
      'tr',
      'pl',
      'nl',
      'sv',
    ];

    // Preload in background (don't block)
    Promise.all(
      commonLanguages
        .filter(lang => lang !== this.currentLanguage)
        .map(lang => this.preloadLanguage(lang, false))
    ).catch(() => {
      // Silently fail - preloading is optional
    });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    version: string;
    lastUpdated: number;
  }> {
    if (!this.config.cacheEnabled) {
      return {
        totalEntries: 0,
        totalSize: 0,
        version: CACHE_VERSION,
        lastUpdated: 0,
      };
    }

    return await this.cache.getStats();
  }

  /**
   * Clear cache for a specific language
   */
  async clearLanguageCache(language: string): Promise<void> {
    if (this.config.cacheEnabled) {
      await this.cache.invalidateLanguage(language);
    }
    this.translations.delete(language);
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    if (this.config.cacheEnabled) {
      await this.cache.invalidateAll();
    }
    this.translations.clear();
  }

  /**
   * Clear all cached translations
   */
  async clearCache(): Promise<void> {
    await this.cache.clear();
    this.translations.clear();
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.online;
  }
}

// Create singleton instance
let i18nInstance: I18n | null = null;

/**
 * Get or create the i18n instance
 */
export function getI18n(config?: Partial<I18nConfig>): I18n {
  if (!i18nInstance) {
    i18nInstance = new I18n(config);
  }
  return i18nInstance;
}

/**
 * Initialize i18n (call this early in your app)
 */
export async function initI18n(config?: Partial<I18nConfig>): Promise<I18n> {
  const instance = getI18n(config);
  await instance.loadLanguage(instance.getLanguage(), false);
  return instance;
}

/**
 * Translation function (shorthand)
 */
export function t(key: string, params?: Record<string, string | number>): string {
  return getI18n().t(key, params);
}

/**
 * Set language (shorthand)
 */
export async function setLanguage(language: string, forceRefresh?: boolean): Promise<void> {
  return getI18n().setLanguage(language, forceRefresh);
}

/**
 * Get current language (shorthand)
 */
export function getLanguage(): string {
  return getI18n().getLanguage();
}
