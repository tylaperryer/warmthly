/**
 * Application Initialization
 * Sets up error handling, service worker, and other global utilities
 */
import { setupErrorHandling } from '/lego/utils/error-handler.js';
import { initImageOptimization } from '/lego/utils/image-optimization.js';
import { initRUM } from '/lego/utils/rum.js';
import { initServiceWorker } from '/lego/utils/service-worker.js';
// Activate tracker blocker for privacy protection
import '/lego/utils/tracker-blocker.js';
/**
 * Initialize the application
 */
export function initApp() {
    setupErrorHandling();
    initServiceWorker();
    initRUM();
    initImageOptimization();
    if (import.meta.env?.DEV) {
        console.debug('Warmthly app initialized');
    }
}
if (typeof window !== 'undefined') {
    initApp();
}
