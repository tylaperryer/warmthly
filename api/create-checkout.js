import { withRateLimit, apiRateLimitOptions } from './rate-limit.js';
import logger from './logger.js';

async function createCheckoutHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'ZAR', customerReference, customerDescription } = req.body;

    // Validate amount
    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Invalid amount. Minimum donation is R1 (100 cents).' });
    }

    // Using test key for CodeSandbox testing
    // TODO: Move to environment variable for production
    const secretKey = 'sk_test_9f74e0b3AW5EBNv1bfb48c8860dd';

    // Create checkout with Yoco API
    // According to Yoco docs, Checkout API only requires amount and currency
    const requestBody = {
      amount: Math.round(amount), // Yoco expects amount in cents (integer)
      currency: currency.toUpperCase(),
    };
    
    logger.log('[create-checkout] Creating checkout with:', {
      amount: requestBody.amount,
      currency: requestBody.currency
    });
    
    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

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
    
    // Return the redirect URL to the frontend
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

