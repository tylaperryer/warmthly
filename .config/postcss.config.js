/**
 * PostCSS Configuration
 * Adds modern CSS features with automatic fallbacks
 * Safe and non-breaking - only enhances CSS
 */

export default {
  plugins: {
    // CSS Nesting - allows nested selectors (CSS Nesting spec)
    'postcss-nesting': {},

    // Container Queries - responsive design based on container size
    '@csstools/postcss-container-queries': {},

    // Autoprefixer - automatically add vendor prefixes
    autoprefixer: {
      // Automatically add vendor prefixes for better browser compatibility
      // Uses browserslist from package.json or defaults to modern browsers
      overrideBrowserslist: ['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead'],
    },
  },
};
