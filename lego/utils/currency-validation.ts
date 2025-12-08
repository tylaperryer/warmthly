/**
 * Currency Validation Utilities
 * Client-side validation for currency codes before API calls
 */

/**
 * Allowed currency codes (matches server-side validation)
 * This whitelist prevents invalid API calls and potential security issues
 */
export const ALLOWED_CURRENCIES: readonly string[] = [
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
 * Validate currency code
 * @param currency - Currency code to validate
 * @returns True if currency is allowed
 */
export function isValidCurrency(currency: string): boolean {
  if (!currency || typeof currency !== 'string') {
    return false;
  }
  return ALLOWED_CURRENCIES.includes(currency.toUpperCase() as typeof ALLOWED_CURRENCIES[number]);
}

/**
 * Validate currency code and throw if invalid
 * @param currency - Currency code to validate
 * @throws Error if currency is invalid
 */
export function validateCurrency(currency: string): void {
  if (!isValidCurrency(currency)) {
    throw new Error(`Invalid currency code: ${currency}. Allowed currencies: ${ALLOWED_CURRENCIES.join(', ')}`);
  }
}

/**
 * Normalize currency code (uppercase, trim)
 * @param currency - Currency code to normalize
 * @returns Normalized currency code or null if invalid
 */
export function normalizeCurrency(currency: string): string | null {
  if (!currency || typeof currency !== 'string') {
    return null;
  }
  const normalized = currency.trim().toUpperCase();
  return isValidCurrency(normalized) ? normalized : null;
}

