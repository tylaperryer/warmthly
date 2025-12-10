/**
 * API Endpoints
 * Centralized exports for all API endpoints
 *
 * Usage:
 *   import { airtable } from '@api/endpoints/index.js';
 *   // or
 *   import airtable from '@api/endpoints/airtable.js'; // Still works!
 */

export { default as airtable } from './airtable.js';
export { default as convertCurrency } from './convert-currency.js';
export { default as createCheckout } from './create-checkout.js';
export { cspReportHandler as cspReport, getCSPReportUrl } from './csp-report.js';
export { default as getEmails } from './get-emails.js';
export { default as getYocoPublicKey } from './get-yoco-public-key.js';
export { default as inboundEmail } from './inbound-email.js';
export { default as reports } from './reports.js';
export { default as sendEmail } from './send-email.js';
