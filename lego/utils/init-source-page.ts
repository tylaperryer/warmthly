/**
 * Source Page Initialization
 * Sets up page-specific functionality for the source/development page
 */

import { initIntersectionObserver } from './intersection-observer.js';
import { initLinkPrefetch } from './prefetch.js';

/**
 * Initialize the source page
 * Sets up intersection observer for animations and other page-specific features
 */
export function initSourcePage(): void {
  // Initialize intersection observer for method section animation
  initIntersectionObserver('.method-section', 'visible');

  // Initialize link prefetching
  initLinkPrefetch();

  // Set up brand logo link from config
  import('../config/warmthly-config.js')
    .then(module => {
      const brandLogo = document.getElementById('main-brand-logo');
      if (brandLogo && module.WARMTHLY_CONFIG) {
        brandLogo.setAttribute('href', module.WARMTHLY_CONFIG.urls.main);
      }
    })
    .catch(error => {
      if (import.meta.env?.DEV) {
        console.warn('Failed to load warmthly config:', error);
      }
    });
}
