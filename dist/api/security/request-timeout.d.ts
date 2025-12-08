/**
 * Request Timeout Middleware
 * Adds timeout handling to request handlers
 * Prevents requests from hanging indefinitely
 */
/**
 * Request handler type
 */
type RequestHandler = (req: Request, res: Response) => Promise<unknown> | unknown;
/**
 * Request object interface (Cloudflare Workers compatible)
 */
interface Request {
    method: string;
    url: string;
    headers: Headers;
    [key: string]: unknown;
}
/**
 * Response object interface (Cloudflare Workers compatible)
 */
interface Response {
    status: (code: number) => Response;
    json: (data: unknown) => Response;
    setHeader: (name: string, value: string | number) => void;
    headersSent: boolean;
    [key: string]: unknown;
}
/**
 * Wrap a request handler with timeout protection
 *
 * @param handler - Request handler function
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Wrapped handler with timeout protection
 *
 * @example
 * ```typescript
 * export default withTimeout(async (req, res) => {
 *   // Your handler code
 * });
 * ```
 */
export declare function withTimeout(handler: RequestHandler, timeoutMs?: number): RequestHandler;
export {};
//# sourceMappingURL=request-timeout.d.ts.map