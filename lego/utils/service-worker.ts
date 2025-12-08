/**
 * Service Worker Registration
 * Registers and manages the service worker for offline support
 * Privacy-first: No tracking, no analytics
 */

/**
 * Service worker file path
 */
const SW_PATH = '/sw.js';

/**
 * Check if service workers are supported
 */
function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    if (import.meta.env.DEV) {
      console.debug('Service Workers not supported in this browser');
    }
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: '/',
    });

    if (import.meta.env.DEV) {
      console.debug('Service Worker registered:', registration);
    }

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) {
        return;
      }

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          if (import.meta.env.DEV) {
            console.debug('New service worker available');
          }

          // Optionally notify user or auto-update
          // For now, we'll auto-update in the background
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    return registration;
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.error('Service Worker registration failed:', error);
    }
    return null;
  }
}

/**
 * Unregister service worker (for testing/cleanup)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();

    if (import.meta.env.DEV) {
      console.debug('Service Worker unregistered:', result);
    }

    return result;
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.error('Service Worker unregistration failed:', error);
    }
    return false;
  }
}

/**
 * Check if service worker is active
 */
export function isServiceWorkerActive(): boolean {
  return isServiceWorkerSupported() && !!navigator.serviceWorker.controller;
}

/**
 * Initialize service worker (call on page load)
 */
export function initServiceWorker(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Register on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      registerServiceWorker();
    });
  } else {
    registerServiceWorker();
  }

  // Handle service worker updates
  if (isServiceWorkerSupported()) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Service worker updated - reload page to use new version
      if (import.meta.env.DEV) {
        console.debug('Service Worker updated, reloading page');
      }
      window.location.reload();
    });
  }
}
