/**
 * Yoco Public Key Handler
 * Returns Yoco payment gateway public key for client-side use
 * Public key is safe to expose to clients
 */

import logger from '../utils/logger.js';

/**
 * Request object interface
 */
interface Request {
  readonly method: string;
  [key: string]: unknown;
}

/**
 * Response object interface
 */
interface Response {
  status: (code: number) => Response;
  json: (data: unknown) => Response;
  [key: string]: unknown;
}

/**
 * Handler function type
 */
type Handler = (req: Request, res: Response) => Response | Promise<Response>;

/**
 * Get Yoco public key handler
 * Returns the Yoco public key for client-side payment integration
 * 
 * @param req - Request object
 * @param res - Response object
 * @returns Response with public key or error
 * 
 * @example
 * ```typescript
 * export default handler;
 * ```
 */
const handler: Handler = (req: Request, res: Response): Response => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const publicKey = process.env.YOCO_PUBLIC_KEY;

    // Validate public key is configured
    if (!publicKey || typeof publicKey !== 'string') {
      logger.error('[get-yoco-public-key] Yoco public key not configured');
      return res.status(500).json({ error: 'Yoco public key not configured' });
    }

    // Return public key (safe to expose to clients)
    return res.status(200).json({ publicKey });
  } catch (error: unknown) {
    // Log error
    logger.error('[get-yoco-public-key] Error getting Yoco public key:', error);

    // Return generic error (don't expose internal details)
    return res.status(500).json({ error: 'Failed to get public key' });
  }
};

export default handler;

