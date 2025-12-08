/**
 * Currency Conversion Handler
 * Converts currency amounts using exchange rate API
 * Includes security validation to prevent object injection attacks
 * Phase 3 Issue 3.9: Added request timeout
 * Phase 3 Issue 3.12: Added response caching headers
 */

import { withTimeout } from '../security/request-timeout.js';
import { setCacheHeaders, CacheConfigs } from '../utils/cache-headers.js';
import { createErrorResponse, ErrorCode } from '../utils/error-response.js';
import logger from '../utils/logger.js';

/**
 * API timeout in milliseconds
 */
const API_TIMEOUT = 10000;

/**
 * Allowed currency codes (whitelist for security)
 * Prevents object injection attacks
 */
const ALLOWED_CURRENCIES: readonly string[] = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'SEK',
  'NZD',
  'MXN',
  'SGD',
  'HKD',
  'NOK',
  'TRY',
  'RUB',
  'INR',
  'BRL',
  'ZAR',
  'DKK',
  'PLN',
  'TWD',
  'THB',
  'MYR',
  'IDR',
  'CZK',
  'HUF',
  'ILS',
  'CLP',
  'PHP',
  'AED',
  'SAR',
  'BGN',
  'RON',
  'HRK',
  'ISK',
  'KRW',
  'VND',
  'PKR',
  'BDT',
] as const;

/**
 * Request object interface
 */
interface Request {
  readonly method: string;
  readonly query: {
    readonly amount?: string;
    readonly from?: string;
    readonly to?: string;
    [key: string]: string | undefined;
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
 * Exchange rate API response
 */
interface ExchangeRateResponse {
  readonly rates?: Record<string, number>;
  [key: string]: unknown;
}

/**
 * Currency conversion response
 */
interface ConversionResponse {
  readonly originalAmount: number;
  readonly convertedAmount: number;
  readonly from: string;
  readonly to: string;
  readonly rate: number;
  readonly formattedOriginal: string;
  readonly formattedConverted: string;
}

/**
 * Currency conversion handler
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response with conversion result or error
 */
async function convertCurrencyHandler(req: Request, res: Response): Promise<Response> {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, from = 'USD', to = 'ZAR' } = req.query;

    // Validate currency codes against whitelist (security)
    if (!ALLOWED_CURRENCIES.includes(from)) {
      return res.status(400).json(
        createErrorResponse(ErrorCode.VALIDATION_ERROR, `Invalid source currency: ${from}`)
      );
    }
    if (!ALLOWED_CURRENCIES.includes(to)) {
      return res.status(400).json(
        createErrorResponse(ErrorCode.VALIDATION_ERROR, `Invalid target currency: ${to}`)
      );
    }

    // Validate amount
    if (!amount || isNaN(Number(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json(createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid amount'));
    }

    // Same currency - no conversion needed
    if (from === to) {
      const amountNum = parseFloat(amount);
      const responseData = {
        originalAmount: amountNum,
        convertedAmount: amountNum,
        from,
        to,
        rate: 1,
      };

      // Phase 3 Issue 3.12: Add cache headers for currency conversion
      setCacheHeaders(res, CacheConfigs.currencyRates());

      return res.status(200).json(responseData);
    }

    // Build API URL
    const apiKey = process.env.EXCHANGE_RATE_API_KEY || 'free';
    const apiUrl =
      apiKey === 'free'
        ? `https://api.exchangerate-api.com/v4/latest/${encodeURIComponent(from)}`
        : `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${encodeURIComponent(from)}`;

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, API_TIMEOUT);

    let response: globalThis.Response;
    try {
      response = await fetch(apiUrl, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        logger.error('[convert-currency] Request timeout');
        return res.status(504).json(
          createErrorResponse(ErrorCode.SERVICE_UNAVAILABLE, 'Exchange rate API request timed out. Please try again.')
        );
      }
      throw fetchError;
    }

    // Check response
    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    // Parse response
    const data = (await response.json()) as ExchangeRateResponse;

    // Validate response structure (security)
    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid response from exchange rate API');
    }

    // Validate target currency again (double-check security)
    if (!ALLOWED_CURRENCIES.includes(to)) {
      throw new Error(`Invalid target currency: ${to}`);
    }

    // Get conversion rate (safe - validated currency code)
    const rate = data.rates[to];
    if (!rate || typeof rate !== 'number') {
      throw new Error(`Conversion rate not found for ${to}`);
    }

    // Perform conversion
    const originalAmount = parseFloat(amount);
    let amountInZARCents: number;

    // Special handling for JPY (no decimal places)
    if (from === 'JPY') {
      amountInZARCents = Math.round(originalAmount * rate * 100);
    } else {
      amountInZARCents = Math.round(originalAmount * rate);
    }

    // Format amounts
    const formattedOriginal =
      from === 'JPY' ? originalAmount.toFixed(0) : (originalAmount / 100).toFixed(2);

    const responseData: ConversionResponse = {
      originalAmount,
      convertedAmount: amountInZARCents,
      from,
      to,
      rate,
      formattedOriginal,
      formattedConverted: (amountInZARCents / 100).toFixed(2),
    };

    // Phase 3 Issue 3.12: Add cache headers for currency conversion
    setCacheHeaders(res, CacheConfigs.currencyRates());

    return res.status(200).json(responseData);
  } catch (error: unknown) {
    // Log and return error
    logger.error('[convert-currency] Error converting currency:', error);

    return res.status(500).json(
      createErrorResponse(ErrorCode.EXTERNAL_API_ERROR, 'Failed to convert currency')
    );
  }
}

// Phase 3 Issue 3.9: Add request timeout (30 seconds for external API calls)
export default withTimeout(convertCurrencyHandler, 30000);
