// /api/get-emails.js
import { createClient } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    const kv = createClient({
      url: process.env.REDIS_URL,
    });

    // Fetch the 100 most recent emails from the 'emails' list
    const emails = await kv.lrange('emails', 0, 99);

    // The emails are stored as strings, so we need to parse them back into objects
    const parsedEmails = emails.map(email => JSON.parse(email));

    res.status(200).json(parsedEmails);

  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails.' });
  }
}

