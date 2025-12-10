/**
 * Warmthly Configuration
 * Centralized configuration for all Warmthly applications
 * Type-safe configuration with proper TypeScript types
 */

/**
 * Application names
 */
export type AppName = 'main' | 'mint' | 'post' | 'admin';

/**
 * Path configuration keys
 */
export type PathKey = 'lego' | 'styles' | 'components' | 'global' | 'fonts' | 'i18n';

/**
 * Navigation item structure
 */
export interface NavigationItem {
  readonly label: string;
  readonly url: string;
  readonly class?: string;
  readonly ariaLabel?: string;
}

/**
 * Routes configuration structure
 */
export interface RoutesConfig {
  readonly post?: {
    readonly report: string;
    readonly yourData: string;
    readonly vote: string;
  };
  readonly admin?: {
    readonly emails: string;
    readonly dashboard: string;
  };
  readonly main?: {
    readonly home: string;
    readonly notFound: string;
    readonly help?: string;
  };
}

/**
 * Main configuration object
 */
export interface WarmthlyConfig {
  readonly urls: Record<AppName, string> & { readonly transparency: string };
  readonly paths: Record<PathKey, string>;
  readonly fonts: {
    readonly inter: string;
    readonly cormorant: string;
  };
  readonly favicon: string;
  readonly constants: {
    readonly yocoStyleCheckInterval: number;
    readonly yocoStyleCheckTimeout: number;
    readonly scrollUnlockDelay: number;
    readonly scrollUnlockTimeout: number;
    readonly errorPopupTimeout: number;
    readonly successPopupTimeout: number;
    readonly prefetchDelay: number;
    readonly prefetchFallbackDelay: number;
    readonly modalFocusDelay: number;
    readonly paymentStatusDelay: number;
  };
  readonly navigation: Record<AppName, readonly NavigationItem[]>;
  readonly routes: RoutesConfig;
}

/**
 * Global Warmthly configuration
 * Immutable configuration object for all applications
 */
export const WARMTHLY_CONFIG: WarmthlyConfig = {
  urls: {
    main: 'https://www.warmthly.org',
    mint: 'https://mint.warmthly.org',
    post: 'https://post.warmthly.org',
    admin: 'https://admin.warmthly.org',
    transparency: 'https://transparency.warmthly.org',
  },
  paths: {
    lego: '/lego',
    styles: '/lego/styles',
    components: '/lego/components',
    global: '/assets/images',
    fonts: '/assets/fonts',
    i18n: '/lego/i18n',
  },
  fonts: {
    inter: '/fonts/Inter-VariableFont_opsz,wght.ttf',
    cormorant: '/fonts/CormorantGaramond-VariableFont_wght.ttf',
  },
  favicon: '/Oalien.svg',
  constants: {
    yocoStyleCheckInterval: 500,
    yocoStyleCheckTimeout: 30000,
    scrollUnlockDelay: 100,
    scrollUnlockTimeout: 300,
    errorPopupTimeout: 8000,
    successPopupTimeout: 5000,
    prefetchDelay: 1000,
    prefetchFallbackDelay: 2000,
    modalFocusDelay: 100,
    paymentStatusDelay: 500,
  },
  navigation: {
    main: [
      { label: 'Post', url: 'https://post.warmthly.org' },
      {
        label: 'Mint',
        url: 'https://mint.warmthly.org',
        ariaLabel: 'View our live transaction mint',
      },
      {
        label: 'Help',
        url: 'https://www.warmthly.org/help.html',
        ariaLabel: 'Get help and view frequently asked questions',
      },
    ],
    mint: [
      { label: 'Home', url: 'https://www.warmthly.org' },
      { label: 'Post', url: 'https://post.warmthly.org' },
      {
        label: 'Research',
        url: 'https://mint.warmthly.org/research',
        class: 'dropdown-item-green',
        ariaLabel: 'View our research and methods',
      },
      {
        label: 'Help',
        url: 'https://www.warmthly.org/help.html',
        ariaLabel: 'Get help and view frequently asked questions',
      },
    ],
    post: [
      { label: 'Home', url: 'https://www.warmthly.org' },
      { label: 'Mint', url: 'https://mint.warmthly.org' },
      { label: 'Dissolution', url: 'https://post.warmthly.org/vote' },
      { label: 'Report', url: 'https://post.warmthly.org/report', class: 'dropdown-item-red' },
      {
        label: 'Help',
        url: 'https://www.warmthly.org/help.html',
        ariaLabel: 'Get help and view frequently asked questions',
      },
    ],
    admin: [
      { label: 'Home', url: 'https://www.warmthly.org' },
      { label: 'Mint', url: 'https://mint.warmthly.org' },
      { label: 'Post', url: 'https://post.warmthly.org' },
      {
        label: 'Help',
        url: 'https://www.warmthly.org/help.html',
        ariaLabel: 'Get help and view frequently asked questions',
      },
    ],
  },
  routes: {
    post: {
      report: '/report/',
      yourData: '/your-data/',
      vote: '/vote/',
    },
    admin: {
      emails: '/emails/',
      dashboard: '/',
    },
    main: {
      home: '/',
      notFound: '/404.html',
      help: '/help.html',
    },
  },
} as const;

/**
 * Get application URL by app name
 * @param app - Application name
 * @returns Application URL, falls back to main URL if invalid
 */
export function getAppUrl(app: AppName): string {
  if (app in WARMTHLY_CONFIG.urls) {
    return WARMTHLY_CONFIG.urls[app];
  }
  return WARMTHLY_CONFIG.urls.main;
}

/**
 * Get path by key
 * @param key - Path configuration key
 * @returns Path string, empty string if key not found
 */
export function getPath(key: PathKey): string {
  if (key in WARMTHLY_CONFIG.paths) {
    return WARMTHLY_CONFIG.paths[key];
  }
  return '';
}

/**
 * Get navigation items for an app
 * @param app - Application name
 * @returns Array of navigation items, falls back to main navigation if invalid
 */
export function getNavigation(app: AppName): readonly NavigationItem[] {
  if (app in WARMTHLY_CONFIG.navigation) {
    return WARMTHLY_CONFIG.navigation[app];
  }
  return WARMTHLY_CONFIG.navigation.main;
}
