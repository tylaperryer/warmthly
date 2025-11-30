// /api/airtable.js
// Backend proxy for Airtable API to keep API key secure
import { withRateLimit, apiRateLimitOptions } from './rate-limit.js';
import logger from './logger.js';

async function airtableHandler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Validate API key is configured
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

    // Get query parameters
    const { baseId, tableName, viewId } = req.query;

    // Validate required parameters
    if (!baseId || !tableName) {
      return res.status(400).json({ 
        error: { message: 'baseId and tableName are required query parameters.' } 
      });
    }

    // Build Airtable API URL
    let url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`;
    const params = new URLSearchParams();
    
    if (viewId) {
      params.append('view', viewId);
    }
    
    // Add max records limit to prevent large responses
    params.append('maxRecords', '1000');
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // Fetch data from Airtable
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json',
      },
    });

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
    
    // Return the records
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

// Export handler with rate limiting
export default withRateLimit(airtableHandler, apiRateLimitOptions);

