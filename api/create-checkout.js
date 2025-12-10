import { withRateLimit, apiRateLimitOptions } from './rate-limit.js';
import logger from './logger.js';

const API_TIMEOUT = 15000;

async function createCheckoutHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'ZAR', customerReference, customerDescription } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Invalid amount. Minimum donation is R1 (100 cents).' });
    }

    const secretKey = process.env.YOCO_SECRET_KEY;
    if (!secretKey) {
      logger.error('[create-checkout] Yoco secret key not configured');
      return res.status(500).json({ error: 'Yoco secret key not configured' });
    }

    const requestBody = {
      amount: Math.round(amount),
      currency: currency.toUpperCase(),
    };
    
    logger.log('[create-checkout] Creating checkout with:', {
      amount: requestBody.amount,
      currency: requestBody.currency
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    let response;
    try {
      response = await fetch('https://payments.yoco.com/api/checkouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        logger.error('[create-checkout] Request timeout');
        return res.status(504).json({ 
          error: 'Request to payment service timed out. Please try again.'
        });
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText || 'Unknown error' };
      }
      
      logger.error('[create-checkout] Yoco API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      return res.status(response.status).json({ 
        error: errorData.detail || errorData.message || errorData.title || `Yoco API error: ${response.status} ${response.statusText}`,
        details: errorData
      });
    }

    const data = await response.json();
    
    logger.log('[create-checkout] Checkout created successfully:', data.id);
    
    return res.status(200).json({
      redirectUrl: data.redirectUrl,
      checkoutId: data.id,
    });

  } catch (error) {
    logger.error('[create-checkout] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withRateLimit(createCheckoutHandler, apiRateLimitOptions);

