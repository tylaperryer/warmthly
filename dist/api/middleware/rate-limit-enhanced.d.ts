/**
 * Enhanced Rate Limiting with Exponential Backoff
 * Provides progressive delays for repeated violations
 * Security Enhancement 6: Enhanced Rate Limiting
 */
import { RateLimitOptions, RateLimitResult } from './rate-limit.js';
/**
 * Request object interface
 */
interface Request {
    readonly method: string;
    readonly url: string;
    readonly headers: {
        readonly 'x-forwarded-for'?: string;
        readonly 'x-real-ip'?: string;
        readonly [key: string]: string | undefined;
    };
    readonly connection?: {
        readonly remoteAddress?: string;
    };
    [key: string]: unknown;
}
/**
 * Enhanced rate limit result with backoff
 */
export interface EnhancedRateLimitResult extends RateLimitResult {
    readonly backoffSeconds?: number;
    readonly violationCount?: number;
}
/**
 * Check rate limit with exponential backoff
 *
 * @param req - Request object
 * @param options - Rate limit options
 * @param baseResult - Base rate limit result from standard check
 * @returns Enhanced rate limit result with backoff
 */
export declare function checkRateLimitWithBackoff(req: Request, options: RateLimitOptions, baseResult: RateLimitResult): Promise<EnhancedRateLimitResult>;
/**
 * Enhanced rate limit options with backoff configuration
 */
export interface EnhancedRateLimitOptions extends RateLimitOptions {
    readonly enableBackoff?: boolean;
    readonly baseBackoffSeconds?: number;
    readonly maxBackoffSeconds?: number;
}
/**
 * Wrap a request handler with enhanced rate limiting (with backoff)
 *
 * @param handler - Request handler function
 * @param options - Enhanced rate limit options
 * @returns Wrapped handler with enhanced rate limiting
 */
export declare function checkEnhancedRateLimit(req: Request, options: EnhancedRateLimitOptions, baseResult: RateLimitResult): Promise<EnhancedRateLimitResult>;
export {};
//# sourceMappingURL=rate-limit-enhanced.d.ts.map