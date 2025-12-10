/**
 * Reports Handler
 * Handles user reports and sends email notifications
 * Includes input validation, rate limiting, and email notifications
 */

import { Resend } from 'resend';

import {
  validateString,
  validateEmail,
  validateInputWithAttackDetection,
} from '../middleware/input-validation.js';
import {
  withRateLimit,
  apiRateLimitOptions,
  type Request,
  type Response,
} from '../middleware/rate-limit.js';
import { createErrorResponse, ErrorCode } from '../utils/error-response.js';
import logger from '../utils/logger.js';
import { getRedisClient } from '../utils/redis-client.js';

/**
 * Resend client instance
 */
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Maximum message length
 */
const MAX_MESSAGE_LENGTH = 5000;

/**
 * Maximum name length
 */
const MAX_NAME_LENGTH = 200;

/**
 * Report types
 */
const VALID_REPORT_TYPES = ['media', 'concern', 'admin', 'other'] as const;

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
 * Get client identifier for logging
 */
function getClientIdentifier(req: Request): string {
  return (
    (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers?.['x-real-ip'] as string) ||
    (req.connection as { remoteAddress?: string })?.remoteAddress ||
    'unknown'
  );
}

/**
 * Get report type label
 */
function getReportTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    media: 'Media Inquiry',
    concern: 'Concern or Complaint',
    admin: 'Administrative Issue',
    other: 'Other',
  };
  return labels[type] || type;
}

/**
 * Reports handler
 * Validates input and sends email notification
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response with success or error
 */
async function reportsHandler(req: Request, res: Response): Promise<unknown> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    // Get request body and validate type
    const body = (req.body || {}) as {
      name?: string;
      email?: string;
      type?: string;
      message?: string;
      [key: string]: unknown;
    };
    const { name, email, type, message } = body;

    // Phase 3 Issue 3.10: Comprehensive input validation with attack detection
    // Validate name with attack detection
    const nameValidation = validateString(name, {
      required: true,
      minLength: 1,
      maxLength: MAX_NAME_LENGTH,
      trim: true,
    });

    if (!nameValidation.valid) {
      return res
        .status(400)
        .json(createErrorResponse(ErrorCode.VALIDATION_ERROR, nameValidation.error));
    }

    const nameAttackCheck = validateInputWithAttackDetection(nameValidation.sanitized || '', {
      fieldName: 'name',
      logAttack: true,
      rejectOnAttack: true,
    });

    if (nameAttackCheck.attackDetected) {
      logger.warn('[reports] Attack pattern detected in name field', {
        attackType: nameAttackCheck.attackType,
        identifier: getClientIdentifier(req),
      });
      return res
        .status(400)
        .json(
          createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid input detected in name field')
        );
    }

    const sanitizedName = String(nameValidation.sanitized || '');

    // Validate email
    const emailValidation = validateEmail(email, {
      required: true,
      maxLength: 254, // RFC 5321 limit
    });

    if (!emailValidation.valid) {
      return res
        .status(400)
        .json(createErrorResponse(ErrorCode.VALIDATION_ERROR, emailValidation.error));
    }

    const emailAttackCheck = validateInputWithAttackDetection(emailValidation.sanitized || '', {
      fieldName: 'email',
      logAttack: true,
      rejectOnAttack: true,
    });

    if (emailAttackCheck.attackDetected) {
      logger.warn('[reports] Attack pattern detected in email field', {
        attackType: emailAttackCheck.attackType,
        identifier: getClientIdentifier(req),
      });
      return res
        .status(400)
        .json(
          createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid input detected in email field')
        );
    }

    const sanitizedEmail = emailValidation.sanitized || '';

    // Validate report type
    if (
      !type ||
      typeof type !== 'string' ||
      !VALID_REPORT_TYPES.includes(type as (typeof VALID_REPORT_TYPES)[number])
    ) {
      return res
        .status(400)
        .json(
          createErrorResponse(
            ErrorCode.VALIDATION_ERROR,
            `Invalid report type. Must be one of: ${VALID_REPORT_TYPES.join(', ')}.`
          )
        );
    }

    // Validate message with attack detection
    const messageValidation = validateString(message, {
      required: true,
      minLength: 1,
      maxLength: MAX_MESSAGE_LENGTH,
      trim: true,
    });

    if (!messageValidation.valid) {
      return res
        .status(400)
        .json(createErrorResponse(ErrorCode.VALIDATION_ERROR, messageValidation.error));
    }

    const messageAttackCheck = validateInputWithAttackDetection(messageValidation.sanitized || '', {
      fieldName: 'message',
      logAttack: true,
      rejectOnAttack: true,
    });

    if (messageAttackCheck.attackDetected) {
      logger.warn('[reports] Attack pattern detected in message field', {
        attackType: messageAttackCheck.attackType,
        identifier: getClientIdentifier(req),
      });
      return res
        .status(400)
        .json(
          createErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid input detected in message field')
        );
    }

    // Ensure sanitizedMessage is always a string
    const sanitizedMessage: string =
      typeof messageValidation.sanitized === 'string'
        ? messageValidation.sanitized
        : String(messageValidation.sanitized || '');

    // Get client identifier for logging
    const identifier = getClientIdentifier(req);

    // Log report submission
    logger.log('[reports] Report submitted', {
      identifier,
      type,
      email: sanitizedEmail,
      nameLength: sanitizedName.length,
      messageLength: sanitizedMessage.length,
    });

    // Store report in Redis for tracking (optional, non-blocking)
    try {
      const redis = await getRedisClient();
      const reportData = {
        name: sanitizedName,
        email: sanitizedEmail,
        type,
        message: sanitizedMessage,
        timestamp: new Date().toISOString(),
        identifier,
      };
      await redis.lPush('reports', JSON.stringify(reportData));
      // Keep only last 1000 reports
      await redis.lTrim('reports', 0, 999);
    } catch (redisError) {
      // Non-critical: log but don't fail
      logger.warn('[reports] Failed to store report in Redis:', redisError);
    }

    // Send email notification if Resend is configured
    const adminEmail = process.env.ADMIN_EMAIL || 'desk@warmthly.org';
    if (process.env.RESEND_API_KEY) {
      try {
        const reportTypeLabel = getReportTypeLabel(type);
        const emailSubject = `[Warmthly Report] ${reportTypeLabel} from ${sanitizedName}`;
        // SECURITY: Sanitize HTML to prevent XSS in email
        // sanitizedMessage is already guaranteed to be a string
        const sanitizedMessageHtml = sanitizedMessage
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\n/g, '<br>');

        const emailHtml = `
          <h2>New Report Submitted</h2>
          <p><strong>Type:</strong> ${reportTypeLabel}</p>
          <p><strong>From:</strong> ${sanitizedName} (${sanitizedEmail})</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <h3>Message:</h3>
          <p style="white-space: pre-wrap;">${sanitizedMessageHtml}</p>
          <hr>
          <p><small>Report ID: ${identifier} - ${new Date().toISOString()}</small></p>
        `;

        const result = (await resend.emails.send({
          from: 'The Warmthly Desk <desk@warmthly.org>',
          to: [adminEmail],
          subject: emailSubject,
          html: emailHtml,
          replyTo: String(sanitizedEmail),
        })) as ResendResponse;

        if (result.error) {
          logger.error('[reports] Failed to send email notification:', result.error);
          // Don't fail the request if email fails - report is still stored
        } else {
          logger.log('[reports] Email notification sent successfully');
        }
      } catch (emailError) {
        logger.error('[reports] Error sending email notification:', emailError);
        // Don't fail the request if email fails
      }
    } else {
      logger.warn('[reports] RESEND_API_KEY not configured - email notification skipped');
    }

    // Success response
    return res.status(200).json({
      message: 'Report submitted successfully. We will review it promptly.',
    });
  } catch (error: unknown) {
    // Log and return error
    if (error instanceof Error) {
      logger.error('[reports] Unexpected error in reports handler:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    } else {
      logger.error('[reports] Unexpected error in reports handler:', error);
    }

    return res
      .status(500)
      .json(
        createErrorResponse(
          ErrorCode.INTERNAL_ERROR,
          'Internal Server Error. Please try again later.'
        )
      );
  }
}

export default withRateLimit(reportsHandler, apiRateLimitOptions);
