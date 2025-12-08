/**
 * Real User Monitoring (RUM)
 * Privacy-first performance monitoring
 * All metrics stored locally only - no tracking, no analytics
 */

/**
 * LayoutShift interface for TypeScript
 */
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources: LayoutShiftAttribution[];
}

interface LayoutShiftAttribution {
  node?: Node;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}

/**
 * Core Web Vitals metrics
 */
interface CoreWebVitals {
  readonly lcp?: number; // Largest Contentful Paint
  readonly fid?: number; // First Input Delay
  readonly cls?: number; // Cumulative Layout Shift
  readonly fcp?: number; // First Contentful Paint
  readonly ttfb?: number; // Time to First Byte
}

/**
 * Performance metrics storage
 */
interface PerformanceMetrics {
  readonly timestamp: number;
  readonly url: string;
  readonly vitals: CoreWebVitals;
  readonly navigation?: PerformanceNavigationTiming;
}

/**
 * Storage key for metrics
 */
const METRICS_STORAGE_KEY = 'warmthly_rum_metrics';
const MAX_METRICS = 100; // Keep last 100 page loads

/**
 * Check if storage is available
 */
function isStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') {
      return false;
    }
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get stored metrics
 */
function getStoredMetrics(): PerformanceMetrics[] {
  if (!isStorageAvailable()) {
    return [];
  }

  try {
    const stored = localStorage.getItem(METRICS_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as PerformanceMetrics[];
  } catch {
    return [];
  }
}

/**
 * Store metrics
 */
function storeMetrics(metrics: PerformanceMetrics): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    const allMetrics = getStoredMetrics();
    allMetrics.push(metrics);

    // Keep only last MAX_METRICS
    const trimmed = allMetrics.slice(-MAX_METRICS);
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable - silently fail
  }
}

/**
 * Measure Largest Contentful Paint (LCP)
 */
function measureLCP(): Promise<number | undefined> {
  return new Promise(resolve => {
    if (typeof PerformanceObserver === 'undefined') {
      resolve(undefined);
      return;
    }

    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          loadTime?: number;
        };

        const lcp = lastEntry.renderTime || lastEntry.loadTime;
        if (lcp) {
          observer.disconnect();
          resolve(lcp);
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(undefined);
      }, 10000);
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * Measure First Input Delay (FID)
 */
function measureFID(): Promise<number | undefined> {
  return new Promise(resolve => {
    if (typeof PerformanceObserver === 'undefined') {
      resolve(undefined);
      return;
    }

    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as PerformanceEventTiming;

        if (firstEntry && firstEntry.processingStart && firstEntry.startTime) {
          const fid = firstEntry.processingStart - firstEntry.startTime;
          observer.disconnect();
          resolve(fid);
        }
      });

      observer.observe({ entryTypes: ['first-input'] });

      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(undefined);
      }, 10000);
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * Measure Cumulative Layout Shift (CLS)
 */
function measureCLS(): Promise<number | undefined> {
  return new Promise(resolve => {
    if (typeof PerformanceObserver === 'undefined') {
      resolve(undefined);
      return;
    }

    try {
      let clsValue = 0;
      const clsEntries: PerformanceEntry[] = [];

      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!(entry as LayoutShift).hadRecentInput) {
            clsEntries.push(entry);
            clsValue += (entry as LayoutShift).value;
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });

      // Measure for 5 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 5000);
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * Get navigation timing
 */
function getNavigationTiming(): PerformanceNavigationTiming | undefined {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) {
    return undefined;
  }

  try {
    const entries = performance.getEntriesByType('navigation');
    return entries[0] as PerformanceNavigationTiming | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Collect Core Web Vitals
 */
export async function collectCoreWebVitals(): Promise<CoreWebVitals> {
  const [lcp, fid, cls] = await Promise.all([measureLCP(), measureFID(), measureCLS()]);

  const navigation = getNavigationTiming();
  const fcp = navigation?.responseStart
    ? navigation.responseStart - navigation.fetchStart
    : undefined;
  const ttfb = navigation?.responseStart
    ? navigation.responseStart - navigation.requestStart
    : undefined;

  return {
    lcp,
    fid,
    cls,
    fcp,
    ttfb,
  };
}

/**
 * Record performance metrics
 */
export async function recordMetrics(): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  try {
    const vitals = await collectCoreWebVitals();
    const navigation = getNavigationTiming();

    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      url: window.location.href,
      vitals,
      navigation,
    };

    storeMetrics(metrics);

    if (import.meta.env.DEV) {
      console.debug('[RUM] Metrics recorded:', metrics);
    }
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.warn('[RUM] Failed to record metrics:', error);
    }
  }
}

/**
 * Get stored metrics (for user reporting)
 */
export function getStoredMetricsForReporting(): readonly PerformanceMetrics[] {
  return getStoredMetrics();
}

/**
 * Clear stored metrics
 */
export function clearMetrics(): void {
  if (isStorageAvailable()) {
    try {
      localStorage.removeItem(METRICS_STORAGE_KEY);
    } catch {
      // Silently fail
    }
  }
}

/**
 * Enhanced Core Web Vitals monitoring with real-time reporting
 */
let clsObserver: PerformanceObserver | null = null;
let fidObserver: PerformanceObserver | null = null;
let lcpObserver: PerformanceObserver | null = null;

/**
 * Report Core Web Vitals to console (dev mode) or store for analysis
 */
function reportVital(name: string, value: number, id: string): void {
  // In dev mode, log to console
  if (import.meta.env?.DEV) {
    const rating = getVitalRating(name, value);
    console.log(`[Core Web Vitals] ${name}: ${value.toFixed(2)}ms (${rating})`);
  }

  // Store for later analysis
  const vitals = {
    name,
    value,
    id,
    timestamp: Date.now(),
    url: window.location.href,
  };

  // Store in sessionStorage for page-level analysis
  try {
    const stored = sessionStorage.getItem('warmthly_cwv');
    const allVitals = stored ? JSON.parse(stored) : [];
    allVitals.push(vitals);
    // Keep last 10 entries
    sessionStorage.setItem('warmthly_cwv', JSON.stringify(allVitals.slice(-10)));
  } catch {
    // Silently fail if storage unavailable
  }
}

/**
 * Get rating for Core Web Vital
 */
function getVitalRating(name: string, value: number): string {
  const thresholds: Record<string, { good: number; needsImprovement: number }> = {
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'unknown';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Enhanced LCP monitoring
 */
function monitorLCP(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    lcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number;
        loadTime?: number;
      };

      const lcp = lastEntry.renderTime || lastEntry.loadTime;
      if (lcp) {
        reportVital('LCP', lcp, lastEntry.name || 'unknown');
      }
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Disconnect after 10 seconds
    setTimeout(() => {
      if (lcpObserver) {
        lcpObserver.disconnect();
      }
    }, 10000);
  } catch {
    // Silently fail
  }
}

/**
 * Enhanced FID monitoring
 */
function monitorFID(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    fidObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as PerformanceEventTiming;

      if (firstEntry && firstEntry.processingStart && firstEntry.startTime) {
        const fid = firstEntry.processingStart - firstEntry.startTime;
        reportVital('FID', fid, firstEntry.name || 'unknown');
        if (fidObserver) {
          fidObserver.disconnect();
        }
      }
    });

    fidObserver.observe({ entryTypes: ['first-input'] });

    // Disconnect after 10 seconds
    setTimeout(() => {
      if (fidObserver) {
        fidObserver.disconnect();
      }
    }, 10000);
  } catch {
    // Silently fail
  }
}

/**
 * Enhanced CLS monitoring
 */
function monitorCLS(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    let clsValue = 0;

    clsObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!(entry as LayoutShift).hadRecentInput) {
          clsValue += (entry as LayoutShift).value;
        }
      }
    });

    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Report final CLS after page is stable
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (clsValue > 0) {
          reportVital('CLS', clsValue, 'page');
        }
        if (clsObserver) {
          clsObserver.disconnect();
        }
      }, 5000);
    });
  } catch {
    // Silently fail
  }
}

/**
 * Monitor FCP and TTFB
 */
function monitorOtherMetrics(): void {
  if (typeof performance === 'undefined') return;

  try {
    const navigation = getNavigationTiming();
    if (navigation) {
      // FCP (First Contentful Paint)
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(
        (entry: PerformanceEntry) => entry.name === 'first-contentful-paint'
      );
      if (fcpEntry) {
        reportVital('FCP', fcpEntry.startTime, 'paint');
      }

      // TTFB (Time to First Byte)
      if (navigation.responseStart && navigation.requestStart) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        reportVital('TTFB', ttfb, 'navigation');
      }
    }
  } catch {
    // Silently fail
  }
}

/**
 * Initialize RUM with enhanced Core Web Vitals monitoring
 */
export function initRUM(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Start monitoring Core Web Vitals
  monitorLCP();
  monitorFID();
  monitorCLS();

  // Monitor other metrics after page load
  if (document.readyState === 'complete') {
    monitorOtherMetrics();
    recordMetrics();
  } else {
    window.addEventListener('load', () => {
      monitorOtherMetrics();
      // Wait a bit for all metrics to be available
      setTimeout(recordMetrics, 2000);
    });
  }

  // Record metrics on navigation (for SPAs)
  window.addEventListener('beforeunload', () => {
    recordMetrics();
  });
}

/**
 * Get current Core Web Vitals (for debugging)
 */
export function getCurrentVitals(): CoreWebVitals | null {
  try {
    const stored = sessionStorage.getItem('warmthly_cwv');
    if (!stored) return null;

    const allVitals = JSON.parse(stored);
    const vitals: {
      lcp?: number;
      fid?: number;
      cls?: number;
      fcp?: number;
      ttfb?: number;
    } = {};

    allVitals.forEach((vital: { name: string; value: number }) => {
      if (vital.name === 'LCP') vitals.lcp = vital.value;
      if (vital.name === 'FID') vitals.fid = vital.value;
      if (vital.name === 'CLS') vitals.cls = vital.value;
      if (vital.name === 'FCP') vitals.fcp = vital.value;
      if (vital.name === 'TTFB') vitals.ttfb = vital.value;
    });

    return vitals as CoreWebVitals;
  } catch {
    return null;
  }
}
