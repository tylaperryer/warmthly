/**
 * Application Initialization
 * Sets up error handling, service worker, and other global utilities
 */

import { setupErrorHandling } from '@utils/error-handler.js';
import { initServiceWorker } from '@utils/service-worker.js';
import { initRUM } from '@utils/rum.js';
import { initImageOptimization } from '@utils/image-optimization.js';
// Activate tracker blocker for privacy protection
import '@utils/tracker-blocker.js';

/**
 * Initialize the application
 */
export function initApp(): void {
  setupErrorHandling();
  initServiceWorker();
  initRUM();
  initImageOptimization();

  if (import.meta.env.DEV) {
    console.debug('Warmthly app initialized');
  }
}

if (typeof window !== 'undefined') {
  initApp();
}

