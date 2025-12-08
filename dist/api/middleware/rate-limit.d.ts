/**
 * Rate Limiting Middleware
 * Provides Redis-based rate limiting for API endpoints
 * Implements sliding window rate limiting algorithm
 */
/**
 * Rate limit failure mode
 */
export declare enum RateLimitFailureMode {
    /** Fail open: Allow requests if Redis fails (default for non-critical endpoints) */
    FAIL_OPEN = "fail_open",
    /** Fail closed: Reject requests if Redis fails (for critical endpoints) */
    FAIL_CLOSED = "fail_closed",
    /** Degraded: Use in-memory fallback with stricter limits if Redis fails */
    DEGRADED = "degraded"
}
/**
 * Rate limit options
 */
export interface RateLimitOptions {
    readonly windowMs?: number;
    readonly max?: number;
    readonly message?: string;
    /** Failure mode when Redis is unavailable (default: FAIL_OPEN) */
    readonly failureMode?: RateLimitFailureMode;
    /** In-memory fallback limits for degraded mode (stricter than Redis limits) */
    readonly degradedMax?: number;
}
/**
 * Rate limit result
 */
export interface RateLimitResult {
    readonly allowed: boolean;
    readonly remaining: number;
    readonly resetTime: number;
    readonly retryAfter?: number;
}
/**
 * Request object interface
 */
export interface Request {
    readonly method: string;
    readonly url: string;
    readonly headers: {
        readonly 'x-forwarded-for'?: string;
        readonly 'x-real-ip'?: string;
        [key: string]: string | undefined;
    };
    readonly connection?: {
        readonly remoteAddress?: string;
    };
    [key: string]: unknown;
}
/**
 * Response object interface
 */
export interface Response {
    status: (code: number) => Response;
    json: (data: unknown) => Response;
    setHeader: (name: string, value: string | number) => void;
    [key: string]: unknown;
}
/**
 * Request handler type
 */
type RequestHandler = (req: Request, res: Response) => Promise<unknown> | unknown;
/**
 * Wrap a request handler with rate limiting
 *
 * @param handler - Request handler function
 * @param options - Rate limit options
 * @returns Wrapped handler with rate limiting
 *
 * @example
 * ```typescript
 * export default withRateLimit(async (req, res) => {
 *   // Your handler code
 * }, { max: 10, windowMs: 60000 });
 * ```
 */
export declare function withRateLimit(handler: RequestHandler, options?: RateLimitOptions): RequestHandler;
/**
 * Pre-configured rate limit options for login
 * Uses fail-closed mode for security (critical endpoint)
 */
export declare const loginRateLimitOptions: RateLimitOptions;
/**
 * Pre-configured rate limit options for email
 */
export declare const emailRateLimitOptions: RateLimitOptions;
/**
 * Pre-configured rate limit options for general API
 */
export declare const apiRateLimitOptions: RateLimitOptions;
/**
 * Pre-configured rate limit options for voting
 */
export declare const voteRateLimitOptions: RateLimitOptions;
export {};
//# sourceMappingURL=rate-limit.d.ts.map