/**
 * Get Emails Handler
 * Retrieves emails from Redis with JWT authentication
 * Includes rate limiting and error handling
 */
import jwt from 'jsonwebtoken';
import { withRateLimit, apiRateLimitOptions } from '../middleware/rate-limit.js';
import logger from '../utils/logger.js';
import { getRedisClient } from '../utils/redis-client.js';
/**
 * Maximum emails to return
 */
const MAX_EMAILS = 100;
/**
 * Get emails handler
 * Requires JWT authentication
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response with emails array or error
 */
async function getEmailsHandler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: { message: 'Method Not Allowed' } });
    }
    try {
        // Check authentication header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: { message: 'Authentication required.' } });
        }
        // Extract token
        const token = authHeader.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger.error('[get-emails] JWT_SECRET is not configured');
            return res.status(500).json({ error: { message: 'Authentication system not configured.' } });
        }
        // Verify JWT token with explicit algorithm specification
        // Prevents algorithm confusion attacks
        jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
        // Get emails from Redis
        const client = await getRedisClient();
        let emails = [];
        try {
            emails = await client.lRange('emails', 0, MAX_EMAILS - 1);
        }
        catch (kvError) {
            // Handle Redis errors gracefully
            if (kvError instanceof Error) {
                logger.error('[get-emails] Error fetching from Redis:', {
                    message: kvError.message,
                    stack: kvError.stack,
                    name: kvError.name,
                    code: kvError.code,
                });
                // Handle specific Redis errors
                if (kvError.message &&
                    (kvError.message.includes('WRONGTYPE') || kvError.message.includes('no such key'))) {
                    emails = [];
                }
                else {
                    throw kvError;
                }
            }
            else {
                throw kvError;
            }
        }
        // Parse emails
        const parsedEmails = emails
            .map((email, index) => {
            try {
                return JSON.parse(email);
            }
            catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                logger.error(`[get-emails] Error parsing email at index ${index}:`, errorMessage);
                return null;
            }
        })
            .filter((email) => email !== null);
        // Return emails in reverse order (newest first)
        const reversedEmails = parsedEmails.reverse();
        return res.status(200).json(reversedEmails);
    }
    catch (error) {
        // Handle JWT errors
        if (error instanceof jwt.JsonWebTokenError) {
            logger.error('[get-emails] JWT verification error:', error.message);
            return res.status(401).json({ error: { message: 'Invalid token.' } });
        }
        if (error instanceof jwt.TokenExpiredError) {
            logger.error('[get-emails] JWT expired:', error.message);
            return res.status(401).json({ error: { message: 'Token expired. Please log in again.' } });
        }
        // Handle other errors
        if (error instanceof Error) {
            logger.error('[get-emails] Unexpected error:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                code: error.code,
            });
            // Handle Redis connection errors
            if (error.message && error.message.includes('REDIS')) {
                return res.status(500).json({
                    error: {
                        message: 'Database connection error. Please check REDIS_URL configuration.',
                        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
                    },
                });
            }
        }
        return res.status(500).json({
            error: {
                message: 'Failed to fetch emails.',
                details: process.env.NODE_ENV === 'development' && error instanceof Error
                    ? error.message
                    : undefined,
            },
        });
    }
}
export default withRateLimit(getEmailsHandler, apiRateLimitOptions);
//# sourceMappingURL=get-emails.js.map