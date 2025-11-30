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

    // Convert amount (amount is in cents, so we convert and round)
    const originalAmount = parseFloat(amount);
    const convertedAmount = Math.round(originalAmount * rate);

    return res.status(200).json({
      originalAmount,
      convertedAmount,
      from,
      to,
      rate,
      formattedOriginal: (originalAmount / 100).toFixed(2),
      formattedConverted: (convertedAmount / 100).toFixed(2)
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    return res.status(500).json({ 
      error: 'Failed to convert currency',
      message: error.message 
    });
  }
}

