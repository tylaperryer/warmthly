/**
 * Create Checkout Handler
 * Creates payment checkout sessions via Yoco payment gateway
 * Includes rate limiting and timeout protection
 */

import { withRateLimit, apiRateLimitOptions } from '../middleware/rate-limit.js';
import { verifyRequest, extractSignature } from '../security/request-signing.js';
import logger from '../utils/logger.js';

/**
 * API timeout in milliseconds
 */
const API_TIMEOUT = 15000;

/**
 * Minimum donation amount in cents
 */
const MIN_AMOUNT = 100; // R1.00

/**
 * Request object interface
 */
interface Request {
  readonly method: string;
  readonly body: {
    readonly amount?: number;
    readonly currency?: string;
    readonly customerReference?: string;
    readonly customerDescription?: string;
    [key: string]: unknown;
  };
  readonly headers?: {
    readonly 'x-request-signature'?: string;
    readonly [key: string]: string | undefined;
  };
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
 * Yoco checkout request body
 */
interface YocoCheckoutRequest {
  readonly amount: number;
  readonly currency: string;
}

/**
 * Yoco checkout response
 */
interface YocoCheckoutResponse {
  readonly id: string;
  readonly redirectUrl: string;
  [key: string]: unknown;
}

/**
 * Yoco error response
 */
interface YocoErrorResponse {
  readonly detail?: string;
  readonly message?: string;
  readonly title?: string;
  [key: string]: unknown;
}

/**
 * Create checkout handler
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response with checkout URL or error
 */
async function createCheckoutHandler(req: Request, res: Response): Promise<Response> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Security Enhancement 5: Request Signing for sensitive operations
    // Verify request signature if enabled (optional, can be enabled via REQUEST_SIGNING_SECRET env var)
    const requestSigningSecret = process.env.REQUEST_SIGNING_SECRET;
    if (requestSigningSecret) {
      const signature = extractSignature(req.headers || {});
      const payload = req.body;

      if (!verifyRequest(payload, signature, requestSigningSecret)) {
        logger.error('[create-checkout] Invalid request signature');
        return res.status(403).json({
          error: 'Invalid request signature',
        });
      }
    }

    const { amount, currency = 'ZAR', customerReference, customerDescription } = req.body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount < MIN_AMOUNT) {
      return res.status(400).json({
        error: `Invalid amount. Minimum donation is R1 (${MIN_AMOUNT} cents).`,
      });
    }

    // Validate secret key
    const secretKey = process.env.YOCO_SECRET_KEY;
    if (!secretKey) {
      logger.error('[create-checkout] Yoco secret key not configured');
      return res.status(500).json({ error: 'Yoco secret key not configured' });
    }

    // Prepare request body
    const requestBody: YocoCheckoutRequest = {
      amount: Math.round(amount),
      currency: currency.toUpperCase(),
    };

    logger.log('[create-checkout] Creating checkout with:', {
      amount: requestBody.amount,
      currency: requestBody.currency,
    });

    // Create checkout with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, API_TIMEOUT);

    let response: globalThis.Response;
    try {
      response = await fetch('https://payments.yoco.com/api/checkouts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        logger.error('[create-checkout] Request timeout');
        return res.status(504).json({
          error: 'Request to payment service timed out. Please try again.',
        });
      }
      throw fetchError;
    }

    // Handle error responses
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch {
        // Ignore text read errors
      }

      let errorData: YocoErrorResponse = {};
      try {
        errorData = JSON.parse(errorText) as YocoErrorResponse;
      } catch {
        errorData = { message: errorText || 'Unknown error' };
      }

      logger.error('[create-checkout] Yoco API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      return res.status(response.status).json({
        error:
          errorData.detail ||
          errorData.message ||
          errorData.title ||
          `Yoco API error: ${response.status} ${response.statusText}`,
        details: errorData,
      });
    }

    // Parse success response
    const data = (await response.json()) as YocoCheckoutResponse;

    logger.log('[create-checkout] Checkout created successfully:', data.id);

    return res.status(200).json({
      redirectUrl: data.redirectUrl,
      checkoutId: data.id,
    });
  } catch (error: unknown) {
    // Log unexpected errors
    if (error instanceof Error) {
      logger.error('[create-checkout] Unexpected error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details:
        process.env.NODE_ENV === 'development' && error instanceof Error
          ? error.message
          : undefined,
    });
  }
}

export default withRateLimit(createCheckoutHandler, apiRateLimitOptions);
