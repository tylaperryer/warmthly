export const WARMTHLY_CONFIG = {
  urls: {
    main: 'https://www.warmthly.org',
    mint: 'https://mint.warmthly.org',
    post: 'https://post.warmthly.org',
    admin: 'https://admin.warmthly.org',
    transparency: 'https://transparency.warmthly.org'
  },
  paths: {
    lego: '/lego',
    styles: '/lego/styles',
    webComponents: '/lego/web-components',
    global: '/global',
    fonts: '/fonts'
  },
  fonts: {
    inter: '/fonts/Inter-VariableFont_opsz,wght.ttf',
    cormorant: '/fonts/CormorantGaramond-VariableFont_wght.ttf'
  },
  favicon: '/Oalien.svg',
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
      { label: 'Report', url: 'https://post.warmthly.org/report', class: 'dropdown-item-red' }
    ],
    admin: [
      { label: 'Home', url: 'https://www.warmthly.org' },
      { label: 'Mint', url: 'https://mint.warmthly.org' },
      { label: 'Post', url: 'https://post.warmthly.org' }
    ]
  },
  routes: {
    post: {
      report: '/report/',
      yourData: '/your-data/'
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

export function getAppUrl(app) {
  return WARMTHLY_CONFIG.urls[app] || WARMTHLY_CONFIG.urls.main;
}

export function getPath(key) {
  return WARMTHLY_CONFIG.paths[key] || '';
}

export function getNavigation(app) {
  return WARMTHLY_CONFIG.navigation[app] || WARMTHLY_CONFIG.navigation.main;
}

