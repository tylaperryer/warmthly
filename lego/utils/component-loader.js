/**
 * Component Loader
 * Automatically loads and initializes all lego components
 * Usage: <script type="module" src="/lego/utils/component-loader.js"></script>
 */

// Load font loader
import { initFontLoader } from '../components/fonts/font-loader.js';

// Initialize font loader
initFontLoader();

// Auto-initialize stoplight if present
if (document.getElementById('stoplight')) {
  import('../components/stoplight/stoplight.js').then(module => {
    module.initStoplight();
  });
}

