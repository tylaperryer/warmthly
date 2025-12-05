import { withRateLimit, apiRateLimitOptions } from './rate-limit.js';
import logger from './logger.js';
import { getRedisClient } from './redis-client.js';

const CACHE_TTL = 30 * 1000;
const MAX_RECORDS = 1000;
const API_TIMEOUT = 10000;

async function airtableHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    const airtableApiKey = process.env.AIRTABLE_API_KEY;
    if (!airtableApiKey) {
      logger.error('[airtable] AIRTABLE_API_KEY is not configured');
      return res.status(500).json({ 
        error: { 
          message: 'Airtable API is not configured on the server.',
          code: 'NOT_CONFIGURED'
        } 
      });
    }

    const { baseId, tableName, viewId, page } = req.query;

    if (!baseId || !tableName) {
      return res.status(400).json({ 
        error: { message: 'baseId and tableName are required query parameters.' } 
      });
    }

    const cacheKey = `airtable:${baseId}:${tableName}:${viewId || 'default'}:${page || '1'}`;
    
    try {
      const redis = await getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (cacheError) {
      logger.error('[airtable] Cache read error:', cacheError.message);
    }

    let url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`;
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    let response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        logger.error('[airtable] Request timeout');
        return res.status(504).json({ 
          error: { 
            message: 'Request to Airtable API timed out. Please try again.',
            code: 'TIMEOUT'
          } 
        });
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('[airtable] Airtable API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      return res.status(response.status).json({ 
        error: { 
          message: errorData.error?.message || `Airtable API error: ${response.status} ${response.statusText}`,
          code: errorData.error?.type || 'AIRTABLE_API_ERROR'
        } 
      });
    }

    const data = await response.json();
    
    try {
      const redis = await getRedisClient();
      await redis.setex(cacheKey, Math.floor(CACHE_TTL / 1000), JSON.stringify(data));
    } catch (cacheError) {
      logger.error('[airtable] Cache write error:', cacheError.message);
    }
    
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);

  } catch (error) {
    logger.error('[airtable] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return res.status(500).json({ 
      error: { 
        message: 'Internal server error while fetching Airtable data.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      } 
    });
  }
}

export default withRateLimit(airtableHandler, apiRateLimitOptions);

