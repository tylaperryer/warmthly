// /api/get-emails.js
import jwt from 'jsonwebtoken';
import { withRateLimit, apiRateLimitOptions } from './rate-limit.js';
import logger from './logger.js';
import { getRedisClient } from './redis-client.js';

async function getEmailsHandler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { message: 'Authentication required.' } });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      logger.error('[get-emails] JWT_SECRET is not configured');
      return res.status(500).json({ error: { message: 'Authentication system not configured.' } });
    }

    jwt.verify(token, jwtSecret);

    // Get Redis client
    const client = await getRedisClient();

    // Fetch the 100 most recent emails from the 'emails' list
    let emails = [];
    try {
      emails = await client.lRange('emails', 0, 99);
    } catch (kvError) {
      logger.error('[get-emails] Error fetching from Redis:', {
        message: kvError.message,
        stack: kvError.stack,
        name: kvError.name,
        code: kvError.code
      });
      
      // If the list doesn't exist, return empty array instead of error
      if (kvError.message && (kvError.message.includes('WRONGTYPE') || kvError.message.includes('no such key'))) {
        emails = [];
      } else {
        throw kvError;
      }
    }

    // The emails are stored as strings, so we need to parse them back into objects
    const parsedEmails = emails
      .map((email, index) => {
        try {
          return JSON.parse(email);
        } catch (e) {
          logger.error(`[get-emails] Error parsing email at index ${index}:`, e.message);
          return null;
        }
      })
      .filter(email => email !== null);
    
    // Reverse to show newest first (since lpush adds to beginning)
    const reversedEmails = parsedEmails.reverse();

    res.status(200).json(reversedEmails);

  } catch (error) {
    // Handle JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      logger.error('[get-emails] JWT verification error:', error.message);
      return res.status(401).json({ error: { message: 'Invalid token.' } });
    }
    if (error instanceof jwt.TokenExpiredError) {
      logger.error('[get-emails] JWT expired:', error.message);
      return res.status(401).json({ error: { message: 'Token expired. Please log in again.' } });
    }
    
    // Log the full error for debugging
    logger.error('[get-emails] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Return more specific error messages
    if (error.message && error.message.includes('REDIS')) {
      return res.status(500).json({ 
        error: { 
          message: 'Database connection error. Please check REDIS_URL configuration.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
    
    return res.status(500).json({ 
      error: { 
        message: 'Failed to fetch emails.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
}

// Export handler with rate limiting
export default withRateLimit(getEmailsHandler, apiRateLimitOptions);
