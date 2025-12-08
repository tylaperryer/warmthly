/**
 * Airtable API Handler
 * Fetches data from Airtable with Redis caching
 * Provides rate limiting and timeout protection
 */

import { withRateLimit, apiRateLimitOptions, type Request, type Response } from '../middleware/rate-limit.js';
import logger from '../utils/logger.js';
import { getRedisClient } from '../utils/redis-client.js';

/**
 * Cache TTL in milliseconds
 */
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Maximum records to fetch
 */
const MAX_RECORDS = 1000;

/**
 * API timeout in milliseconds
 */
const API_TIMEOUT = 10000;


/**
 * Airtable API error response
 */
interface AirtableErrorResponse {
  readonly error?: {
    readonly message?: string;
    readonly type?: string;
  };
}

/**
 * Airtable handler function
 */
async function airtableHandler(req: Request, res: Response): Promise<unknown> {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    // Validate API key
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    if (!airtableApiKey) {
      logger.error('[airtable] AIRTABLE_API_KEY is not configured');
      return res.status(500).json({
        error: {
          message: 'Airtable API is not configured on the server.',
          code: 'NOT_CONFIGURED',
        },
      });
    }

    // Get query parameters
    const query = (req.query || {}) as { baseId?: string; tableName?: string; viewId?: string; page?: string; [key: string]: string | string[] | undefined };
    const { baseId, tableName, viewId, page } = query;

    // Validate required parameters
    if (!baseId || !tableName) {
      return res.status(400).json({
        error: { message: 'baseId and tableName are required query parameters.' },
      });
    }

    // Generate cache key
    const cacheKey = `airtable:${baseId}:${tableName}:${viewId || 'default'}:${page || '1'}`;

    // Try to get from cache
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (cacheError: unknown) {
      const errorMessage = cacheError instanceof Error ? cacheError.message : String(cacheError);
      logger.error('[airtable] Cache read error:', errorMessage);
    }

    // Build Airtable API URL
    let url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(
      tableName
    )}`;
    const params = new URLSearchParams();

    if (viewId) {
      params.append('view', viewId);
    }

    params.append('maxRecords', String(MAX_RECORDS));

    if (page) {
      params.append('pageSize', '100');
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // Fetch from Airtable with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, API_TIMEOUT);

    let response: globalThis.Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        logger.error('[airtable] Request timeout');
        return res.status(504).json({
          error: {
            message: 'Request to Airtable API timed out. Please try again.',
            code: 'TIMEOUT',
          },
        });
      }
      throw fetchError;
    }

    // Handle error responses
    if (!response.ok) {
      let errorData: AirtableErrorResponse = {};
      try {
        errorData = (await response.json()) as AirtableErrorResponse;
      } catch {
        // Ignore JSON parse errors
      }

      logger.error('[airtable] Airtable API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      // SECURITY: Don't leak Airtable API error details to client
      // Log detailed error server-side only
      logger.error('Airtable API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      // Return generic error message to client
      return res.status(500).json({
        error: {
          message: 'External service error. Please try again later.',
          code: 'EXTERNAL_API_ERROR',
        },
      });
    }

    // Parse response
    const data = await response.json();

    // Cache the response
    try {
      const redis = await getRedisClient();
      await redis.setEx(cacheKey, Math.floor(CACHE_TTL / 1000), JSON.stringify(data));
    } catch (cacheError: unknown) {
      const errorMessage = cacheError instanceof Error ? cacheError.message : String(cacheError);
      logger.error('[airtable] Cache write error:', errorMessage);
    }

    // Return response
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);
  } catch (error: unknown) {
    // Log unexpected errors
    if (error instanceof Error) {
      logger.error('[airtable] Unexpected error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }

    return res.status(500).json({
      error: {
        message: 'Internal server error while fetching Airtable data.',
        details:
          process.env.NODE_ENV === 'development' && error instanceof Error
            ? error.message
            : undefined,
      },
    });
  }
}

export default withRateLimit(airtableHandler, apiRateLimitOptions);
