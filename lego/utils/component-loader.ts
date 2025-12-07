/**
 * Component Loader
 * Automatically loads and initializes all lego components
 * Provides type-safe component initialization with error handling
 * 
 * Usage: <script type="module" src="/lego/utils/component-loader.js"></script>
 */

import { initFontLoader } from '@utils/font-loader-utils.js';

/**
 * Stoplight element ID
 */
const STOPLIGHT_ID = 'stoplight';

/**
 * Initialize font loader
 * This runs immediately when the module loads
 */
initFontLoader();

/**
 * Auto-initialize stoplight component if present
 * Uses dynamic import for code splitting and performance
 */
if (typeof document !== 'undefined') {
  const stoplightElement = document.getElementById(STOPLIGHT_ID);

  if (stoplightElement) {
    // Dynamically import stoplight utils only when needed
    import('@utils/stoplight-utils.js')
      .then((module) => {
        // Type-safe check for initStoplight function
        if (typeof module.initStoplight === 'function') {
          module.initStoplight();
        } else {
          throw new Error('initStoplight function not found in stoplight-utils module');
        }
      })
      .catch((error: unknown) => {
        // Log error in development, fail silently in production
        if (import.meta.env.DEV) {
          console.error('Failed to load stoplight component:', error);
        }
      });
  }
}

