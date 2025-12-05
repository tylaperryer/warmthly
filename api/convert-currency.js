import logger from './logger.js';

const API_TIMEOUT = 10000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, from = 'USD', to = 'ZAR' } = req.query;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (from === to) {
      return res.status(200).json({
        originalAmount: parseFloat(amount),
        convertedAmount: parseFloat(amount),
        from,
        to,
        rate: 1
      });
    }

    const apiKey = process.env.EXCHANGE_RATE_API_KEY || 'free';
    const apiUrl = apiKey === 'free' 
      ? `https://api.exchangerate-api.com/v4/latest/${from}`
      : `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${from}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    let response;
    try {
      response = await fetch(apiUrl, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        logger.error('[convert-currency] Request timeout');
        return res.status(504).json({ 
          error: 'Exchange rate API request timed out. Please try again.'
        });
      }
      throw fetchError;
    }
    
    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = await response.json();
    
    const rate = data.rates && data.rates[to];
    if (!rate) {
      throw new Error(`Conversion rate not found for ${to}`);
    }

    const originalAmount = parseFloat(amount);
    let amountInZARCents;
    
    if (from === 'JPY') {
      amountInZARCents = Math.round(originalAmount * rate * 100);
    } else {
      amountInZARCents = Math.round(originalAmount * rate);
    }

    const formattedOriginal = from === 'JPY' 
      ? originalAmount.toFixed(0)
      : (originalAmount / 100).toFixed(2);
    
    return res.status(200).json({
      originalAmount,
      convertedAmount: amountInZARCents,
      from,
      to,
      rate,
      formattedOriginal,
      formattedConverted: (amountInZARCents / 100).toFixed(2)
    });
  } catch (error) {
    logger.error('Error converting currency:', error);
    return res.status(500).json({ 
      error: 'Failed to convert currency',
      message: error.message 
    });
  }
}

