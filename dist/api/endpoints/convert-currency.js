/**
 * Currency Conversion Handler
 * Converts currency amounts using exchange rate API
 * Includes security validation to prevent object injection attacks
 */
import logger from '../utils/logger.js';
/**
 * API timeout in milliseconds
 */
const API_TIMEOUT = 10000;
/**
 * Allowed currency codes (whitelist for security)
 * Prevents object injection attacks
 */
const ALLOWED_CURRENCIES = [
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
];
/**
 * Currency conversion handler
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response with conversion result or error
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { amount, from = 'USD', to = 'ZAR' } = req.query;
        // Validate currency codes against whitelist (security)
        if (!ALLOWED_CURRENCIES.includes(from)) {
            return res.status(400).json({ error: `Invalid source currency: ${from}` });
        }
        if (!ALLOWED_CURRENCIES.includes(to)) {
            return res.status(400).json({ error: `Invalid target currency: ${to}` });
        }
        // Validate amount
        if (!amount || isNaN(Number(amount)) || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        // Same currency - no conversion needed
        if (from === to) {
            const amountNum = parseFloat(amount);
            return res.status(200).json({
                originalAmount: amountNum,
                convertedAmount: amountNum,
                from,
                to,
                rate: 1,
            });
        }
        // Build API URL
        const apiKey = process.env.EXCHANGE_RATE_API_KEY || 'free';
        const apiUrl = apiKey === 'free'
            ? `https://api.exchangerate-api.com/v4/latest/${encodeURIComponent(from)}`
            : `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${encodeURIComponent(from)}`;
        // Fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, API_TIMEOUT);
        let response;
        try {
            response = await fetch(apiUrl, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
        }
        catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                logger.error('[convert-currency] Request timeout');
                return res.status(504).json({
                    error: 'Exchange rate API request timed out. Please try again.',
                });
            }
            throw fetchError;
        }
        // Check response
        if (!response.ok) {
            throw new Error(`Exchange rate API returned ${response.status}`);
        }
        // Parse response
        const data = (await response.json());
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
        let amountInZARCents;
        // Special handling for JPY (no decimal places)
        if (from === 'JPY') {
            amountInZARCents = Math.round(originalAmount * rate * 100);
        }
        else {
            amountInZARCents = Math.round(originalAmount * rate);
        }
        // Format amounts
        const formattedOriginal = from === 'JPY' ? originalAmount.toFixed(0) : (originalAmount / 100).toFixed(2);
        const responseData = {
            originalAmount,
            convertedAmount: amountInZARCents,
            from,
            to,
            rate,
            formattedOriginal,
            formattedConverted: (amountInZARCents / 100).toFixed(2),
        };
        return res.status(200).json(responseData);
    }
    catch (error) {
        // Log and return error
        logger.error('[convert-currency] Error converting currency:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            error: 'Failed to convert currency',
            message: errorMessage,
        });
    }
}
//# sourceMappingURL=convert-currency.js.map