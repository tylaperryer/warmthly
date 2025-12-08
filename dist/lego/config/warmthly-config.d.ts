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
    };
}
/**
 * Main configuration object
 */
export interface WarmthlyConfig {
    readonly urls: Record<AppName, string> & {
        readonly transparency: string;
    };
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
export declare const WARMTHLY_CONFIG: WarmthlyConfig;
/**
 * Get application URL by app name
 * @param app - Application name
 * @returns Application URL, falls back to main URL if invalid
 */
export declare function getAppUrl(app: AppName | string): string;
/**
 * Get path by key
 * @param key - Path configuration key
 * @returns Path string, empty string if key not found
 */
export declare function getPath(key: PathKey | string): string;
/**
 * Get navigation items for an app
 * @param app - Application name
 * @returns Array of navigation items, falls back to main navigation if invalid
 */
export declare function getNavigation(app: AppName | string): readonly NavigationItem[];
//# sourceMappingURL=warmthly-config.d.ts.map