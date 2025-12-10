/**
 * Send Email Handler
 * Sends emails via Resend email service
 * Includes input validation and rate limiting
 */

import { Resend } from 'resend';

import {
  withRateLimit,
  emailRateLimitOptions,
  type Request as RateLimitRequest,
  type Response as RateLimitResponse,
} from '../middleware/rate-limit.js';
import logger from '../utils/logger.js';

/**
 * Resend client instance
 */
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Maximum subject length
 */
const MAX_SUBJECT_LENGTH = 200;

/**
 * Resend API response
 */
interface ResendResponse {
  readonly data?: unknown;
  readonly error?: {
    readonly message?: string;
    [key: string]: unknown;
  };
}

/**
 * Check if HTML content is empty
 * Validates against common empty HTML patterns
 *
 * @param html - HTML string to check
 * @returns True if HTML is empty, false otherwise
 */
function isEmptyHTML(html: string | null | undefined): boolean {
  if (!html || typeof html !== 'string') {
    return true;
  }

  const trimmed = html.trim();

  if (!trimmed) {
    return true;
  }

  // Common empty HTML patterns
  const emptyPatterns = [
    /^<p>\s*<\/p>$/i,
    /^<p><br\s*\/?><\/p>$/i,
    /^<p>\s*<br\s*\/?>\s*<\/p>$/i,
    /^<p>&nbsp;<\/p>$/i,
    /^<p>\s*&nbsp;\s*<\/p>$/i,
  ];

  return emptyPatterns.some(pattern => pattern.test(trimmed));
}

/**
 * Validate email address format
 *
 * @param email - Email address to validate
 * @returns True if email is valid, false otherwise
 */
function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Send email handler
 * Validates input and sends email via Resend
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response with success or error
 */
async function sendEmailHandler(req: RateLimitRequest, res: RateLimitResponse): Promise<unknown> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    // Validate API key
    if (!process.env.RESEND_API_KEY) {
      logger.error('[send-email] RESEND_API_KEY is not configured');
      return res.status(500).json({
        error: { message: 'Email service is not configured. Please contact the administrator.' },
      });
    }

    // Get request body
    const body = (req.body || {}) as {
      to?: string;
      subject?: string;
      html?: string;
      [key: string]: unknown;
    };
    const { to, subject, html } = body;

    // Validate recipient email
    if (!to || typeof to !== 'string') {
      return res.status(400).json({ error: { message: 'Recipient email address is required.' } });
    }

    if (!isValidEmail(to)) {
      return res.status(400).json({ error: { message: 'Invalid email address format.' } });
    }

    // Validate subject
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ error: { message: 'Email subject is required.' } });
    }

    // Validate HTML body
    if (isEmptyHTML(html)) {
      return res.status(400).json({ error: { message: 'Email body cannot be empty.' } });
    }

    // Sanitize subject (limit length)
    const sanitizedSubject = subject.trim().substring(0, MAX_SUBJECT_LENGTH);

    // Send email via Resend
    const result = (await resend.emails.send({
      from: 'The Warmthly Desk <desk@warmthly.org>',
      to: [to.trim()],
      subject: sanitizedSubject,
      html: html as string,
    })) as ResendResponse;

    // Check for errors
    if (result.error) {
      logger.error('[send-email] Resend API error:', result.error);
      return res.status(400).json({
        error: {
          message: result.error.message || 'Failed to send email. Please try again.',
        },
      });
    }

    // Success
    return res.status(200).json({ message: 'Email sent successfully!', data: result.data });
  } catch (error: unknown) {
    // Log and return error
    logger.error('[send-email] Unexpected error in send-email handler:', error);
    return res.status(500).json({
      error: { message: 'Internal Server Error. Please try again later.' },
    });
  }
}

export default withRateLimit(sendEmailHandler, emailRateLimitOptions);
