/**
 * Login Handler
 * Authenticates admin users and issues JWT tokens
 * Uses constant-time comparison to prevent timing attacks
 * Includes rate limiting for security
 */
import { type Request, type Response } from '../middleware/rate-limit.js';
declare const _default: (req: Request, res: Response) => Promise<unknown> | unknown;
export default _default;
//# sourceMappingURL=login.d.ts.map