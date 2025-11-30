export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, from = 'USD', to = 'ZAR' } = req.query;

    // Validate amount
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // If converting to same currency, return as-is
    if (from === to) {
      return res.status(200).json({
        originalAmount: parseFloat(amount),
        convertedAmount: parseFloat(amount),
        from,
        to,
        rate: 1
      });
    }

    // Use a free currency API (exchangerate-api.com or similar)
    // For production, you might want to use a paid service for better reliability
    // This uses exchangerate-api.com which has a free tier
    const apiKey = process.env.EXCHANGE_RATE_API_KEY || 'free';
    const apiUrl = apiKey === 'free' 
      ? `https://api.exchangerate-api.com/v4/latest/${from}`
      : `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${from}`;

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Get the conversion rate
    const rate = data.rates && data.rates[to];
    if (!rate) {
      throw new Error(`Conversion rate not found for ${to}`);
    }

    // Convert amount
    // Note: For JPY, amount is in whole units (not cents). For ZAR, we need cents.
    // So if from=JPY, we multiply by 100 to convert to cents, then apply rate
    // For other currencies, amount is already in cents
    const originalAmount = parseFloat(amount);
    let amountInZARCents;
    
    if (from === 'JPY') {
      // JPY amount is in whole units, convert to ZAR cents
      // First convert JPY to ZAR (whole units), then multiply by 100 for cents
      amountInZARCents = Math.round(originalAmount * rate * 100);
    } else {
      // Other currencies: amount is in cents, convert directly
      amountInZARCents = Math.round(originalAmount * rate);
    }

    // Format original amount (handle JPY differently)
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
    console.error('Error converting currency:', error);
    return res.status(500).json({ 
      error: 'Failed to convert currency',
      message: error.message 
    });
  }
}

