/**
 * Request Timeout Middleware
 * Adds timeout handling to request handlers
 * Prevents requests from hanging indefinitely
 */

import logger from '../utils/logger.js';

/**
 * Default timeout in milliseconds
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Request object interface (Cloudflare Workers compatible)
 */
export interface Request {
  method: string;
  url: string;
  headers: Headers;
  [key: string]: unknown;
}

/**
 * Response object interface (Cloudflare Workers compatible)
 */
export interface Response {
  status: (code: number) => Response;
  json: (data: unknown) => Response;
  setHeader: (name: string, value: string | number) => void;
  headersSent: boolean;
  [key: string]: unknown;
}

/**
 * Request handler type
 */
type RequestHandler = (req: Request, res: Response) => Promise<Response | void> | Response | void;

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
export function withTimeout(
  handler: RequestHandler,
  timeoutMs: number = DEFAULT_TIMEOUT
): RequestHandler {
  return async (req: Request, res: Response): Promise<Response | void> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        if (!res.headersSent) {
          logger.error(
            `[request-timeout] Request timeout after ${timeoutMs}ms: ${req.method} ${req.url}`
          );
          res.status(504).json({
            error: { message: 'Request timeout. Please try again.' },
          });
        }
        reject(new Error('Request timeout'));
      }, timeoutMs);
    });

    try {
      // Race handler against timeout
      const result = await Promise.race([handler(req, res), timeoutPromise]);

      // Clear timeout if handler completed
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      return result;
    } catch (error: unknown) {
      // Clear timeout on error
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      // Re-throw if headers already sent (response already sent)
      if (res.headersSent) {
        throw error;
      }

      // Otherwise let error propagate
      throw error;
    }
  };
}
