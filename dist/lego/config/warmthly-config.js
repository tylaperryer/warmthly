/**
 * Warmthly Configuration
 * Centralized configuration for all Warmthly applications
 * Type-safe configuration with proper TypeScript types
 */
/**
 * Global Warmthly configuration
 * Immutable configuration object for all applications
 */
export const WARMTHLY_CONFIG = {
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
    favicon: '/favicon.svg',
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
};
/**
 * Get application URL by app name
 * @param app - Application name
 * @returns Application URL, falls back to main URL if invalid
 */
export function getAppUrl(app) {
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
export function getPath(key) {
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
export function getNavigation(app) {
    if (app in WARMTHLY_CONFIG.navigation) {
        return WARMTHLY_CONFIG.navigation[app];
    }
    return WARMTHLY_CONFIG.navigation.main;
}
//# sourceMappingURL=warmthly-config.js.map