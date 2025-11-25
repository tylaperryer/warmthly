// /api/get-emails.js
import { createClient } from '@vercel/kv';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Basic authentication check - verify admin password from header
    // This is a simple approach; for production, consider using JWT tokens
    const authHeader = req.headers.authorization;
    const providedPassword = authHeader?.replace('Bearer ', '');
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!providedPassword || providedPassword !== correctPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate REDIS_URL is configured
    if (!process.env.REDIS_URL) {
      console.error('REDIS_URL is not configured');
      return res.status(500).json({ error: 'Database is not configured.' });
    }

    const kv = createClient({
      url: process.env.REDIS_URL,
    });

    // Fetch the 100 most recent emails from the 'emails' list
    const emails = await kv.lrange('emails', 0, 99);

    // The emails are stored as strings, so we need to parse them back into objects
    // Handle case where emails array might be empty or contain invalid JSON
    const parsedEmails = emails
      .map(email => {
        try {
          return JSON.parse(email);
        } catch (e) {
          console.error('Error parsing email:', e);
          return null;
        }
      })
      .filter(email => email !== null)
      .reverse(); // Reverse to show newest first (since lpush adds to beginning)

    res.status(200).json(parsedEmails);

  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails.' });
  }
}

