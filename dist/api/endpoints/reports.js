/**
 * Reports Handler
 * Handles user reports and sends email notifications
 * Includes input validation, rate limiting, and email notifications
 */
import { Resend } from 'resend';
import { withRateLimit, apiRateLimitOptions } from '../middleware/rate-limit.js';
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
const VALID_REPORT_TYPES = ['media', 'concern', 'admin', 'other'];
/**
 * Validate email address format
 *
 * @param email - Email address to validate
 * @returns True if email is valid, false otherwise
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    // Email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}
/**
 * Get client identifier for logging
 */
function getClientIdentifier(req) {
    return (req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers?.['x-real-ip'] ||
        req.connection?.remoteAddress ||
        'unknown');
}
/**
 * Get report type label
 */
function getReportTypeLabel(type) {
    const labels = {
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
async function reportsHandler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: { message: 'Method Not Allowed' } });
    }
    try {
        // Get request body
        const { name, email, type, message } = req.body;
        // Validate name
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ error: { message: 'Name is required.' } });
        }
        const sanitizedName = name.trim().substring(0, MAX_NAME_LENGTH);
        if (sanitizedName.length === 0) {
            return res.status(400).json({ error: { message: 'Name cannot be empty.' } });
        }
        // Validate email
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: { message: 'Email address is required.' } });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: { message: 'Invalid email address format.' } });
        }
        // Validate report type
        if (!type ||
            typeof type !== 'string' ||
            !VALID_REPORT_TYPES.includes(type)) {
            return res.status(400).json({
                error: {
                    message: `Invalid report type. Must be one of: ${VALID_REPORT_TYPES.join(', ')}.`,
                },
            });
        }
        // Validate message
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({ error: { message: 'Message is required.' } });
        }
        const sanitizedMessage = message.trim().substring(0, MAX_MESSAGE_LENGTH);
        if (sanitizedMessage.length === 0) {
            return res.status(400).json({ error: { message: 'Message cannot be empty.' } });
        }
        // Get client identifier for logging
        const identifier = getClientIdentifier(req);
        // Log report submission
        logger.log('[reports] Report submitted', {
            identifier,
            type,
            email: email.trim(),
            nameLength: sanitizedName.length,
            messageLength: sanitizedMessage.length,
        });
        // Store report in Redis for tracking (optional, non-blocking)
        try {
            const redis = await getRedisClient();
            const reportData = {
                name: sanitizedName,
                email: email.trim(),
                type,
                message: sanitizedMessage,
                timestamp: new Date().toISOString(),
                identifier,
            };
            await redis.lPush('reports', JSON.stringify(reportData));
            // Keep only last 1000 reports
            await redis.lTrim('reports', 0, 999);
        }
        catch (redisError) {
            // Non-critical: log but don't fail
            logger.warn('[reports] Failed to store report in Redis:', redisError);
        }
        // Send email notification if Resend is configured
        const adminEmail = process.env.ADMIN_EMAIL || 'desk@warmthly.org';
        if (process.env.RESEND_API_KEY) {
            try {
                const reportTypeLabel = getReportTypeLabel(type);
                const emailSubject = `[Warmthly Report] ${reportTypeLabel} from ${sanitizedName}`;
                const emailHtml = `
          <h2>New Report Submitted</h2>
          <p><strong>Type:</strong> ${reportTypeLabel}</p>
          <p><strong>From:</strong> ${sanitizedName} (${email.trim()})</p>
          <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <h3>Message:</h3>
          <p style="white-space: pre-wrap;">${sanitizedMessage.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Report ID: ${identifier} - ${new Date().toISOString()}</small></p>
        `;
                const result = (await resend.emails.send({
                    from: 'The Warmthly Desk <desk@warmthly.org>',
                    to: [adminEmail],
                    subject: emailSubject,
                    html: emailHtml,
                    replyTo: email.trim(),
                }));
                if (result.error) {
                    logger.error('[reports] Failed to send email notification:', result.error);
                    // Don't fail the request if email fails - report is still stored
                }
                else {
                    logger.log('[reports] Email notification sent successfully');
                }
            }
            catch (emailError) {
                logger.error('[reports] Error sending email notification:', emailError);
                // Don't fail the request if email fails
            }
        }
        else {
            logger.warn('[reports] RESEND_API_KEY not configured - email notification skipped');
        }
        // Success response
        return res.status(200).json({
            message: 'Report submitted successfully. We will review it promptly.',
        });
    }
    catch (error) {
        // Log and return error
        if (error instanceof Error) {
            logger.error('[reports] Unexpected error in reports handler:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
            });
        }
        else {
            logger.error('[reports] Unexpected error in reports handler:', error);
        }
        return res.status(500).json({
            error: { message: 'Internal Server Error. Please try again later.' },
        });
    }
}
export default withRateLimit(reportsHandler, apiRateLimitOptions);
//# sourceMappingURL=reports.js.map