/**
 * Warmthly Global Configuration
 * Centralized configuration for all URLs, paths, and references
 * 
 * Edit this file to update URLs/paths across the entire site
 */

export const WARMTHLY_CONFIG = {
  // Domain URLs - Update these if domains change
  urls: {
    main: 'https://www.warmthly.org',
    mint: 'https://mint.warmthly.org',
    post: 'https://post.warmthly.org',
    admin: 'https://admin.warmthly.org',
    transparency: 'https://transparency.warmthly.org'
  },
  
  // Asset paths - Update these if directory structure changes
  paths: {
    lego: '/lego',
    styles: '/lego/styles',
    webComponents: '/lego/web-components',
    global: '/global',
    fonts: '/fonts'
  },
  
  // Font files
  fonts: {
    inter: '/fonts/Inter-VariableFont_opsz,wght.ttf',
    cormorant: '/fonts/CormorantGaramond-VariableFont_wght.ttf'
  },
  
  // Favicon (SVG emoji - renders in platform-specific style)
  favicon: '/favicon.svg',
  
  // Navigation menu items (used by stoplight component)
  navigation: {
    main: [
      { label: 'Post', url: 'https://post.warmthly.org' },
      { label: 'Mint', url: 'https://mint.warmthly.org', ariaLabel: 'View our live transaction mint' }
    ],
    mint: [
      { label: 'Home', url: 'https://www.warmthly.org' },
      { label: 'Post', url: 'https://post.warmthly.org' },
      { label: 'Research', url: 'https://mint.warmthly.org/research', class: 'dropdown-item-green', ariaLabel: 'View our research and methods' }
    ],
    post: [
      { label: 'Home', url: 'https://www.warmthly.org' },
      { label: 'Mint', url: 'https://mint.warmthly.org' },
      { label: 'Dissolution', url: 'https://post.warmthly.org/vote' },
      { label: 'Report', url: 'https://post.warmthly.org/report', class: 'dropdown-item-red' }
    ],
    admin: [
      { label: 'Home', url: 'https://www.warmthly.org' },
      { label: 'Mint', url: 'https://mint.warmthly.org' },
      { label: 'Post', url: 'https://post.warmthly.org' }
    ]
  },
  
  // App-specific routes (relative paths within each app)
  routes: {
    post: {
      report: '/report/',
      yourData: '/your-data/',
      vote: '/vote/'
    },
    admin: {
      emails: '/emails/',
      dashboard: '/'
    },
    main: {
      home: '/',
      notFound: '/404.html'
    }
  }
};

// Helper function to get URL for a specific app
export function getAppUrl(app) {
  return WARMTHLY_CONFIG.urls[app] || WARMTHLY_CONFIG.urls.main;
}

// Helper function to get path
export function getPath(key) {
  return WARMTHLY_CONFIG.paths[key] || '';
}

// Helper function to get navigation items for an app
export function getNavigation(app) {
  return WARMTHLY_CONFIG.navigation[app] || WARMTHLY_CONFIG.navigation.main;
}

