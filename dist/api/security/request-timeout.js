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
export function withTimeout(handler, timeoutMs = DEFAULT_TIMEOUT) {
    return async (req, res) => {
        let timeoutId = null;
        // Set up timeout
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                if (!res.headersSent) {
                    logger.error(`[request-timeout] Request timeout after ${timeoutMs}ms: ${req.method} ${req.url}`);
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
        }
        catch (error) {
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
//# sourceMappingURL=request-timeout.js.map