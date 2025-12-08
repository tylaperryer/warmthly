/**
 * PostCSS Configuration
 * Adds modern CSS features with automatic fallbacks
 * Safe and non-breaking - only enhances CSS
 */

export default {
  plugins: {
    // CSS Nesting - allows nested selectors (CSS Nesting spec)
    'postcss-nesting': {},

    // PostCSS Preset Env - includes container queries and other modern CSS features
    // Replaces deprecated @csstools/postcss-container-queries
    'postcss-preset-env': {
      stage: 3, // Use stage 3 features (stable proposals)
      features: {
        'container-queries': true, // Enable container queries support
      },
    },

    // Autoprefixer - automatically add vendor prefixes
    autoprefixer: {
      // Automatically add vendor prefixes for better browser compatibility
      // Uses browserslist from package.json or defaults to modern browsers
      overrideBrowserslist: ['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead'],
    },
  },
};
