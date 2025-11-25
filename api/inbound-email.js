import { createClient } from '@vercel/kv';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // We don't need webhook verification for this step, let's keep it simple first.
    const event = req.body;

    if (event.type === 'email.received') {
      const emailData = event.data;
      
      // Connect to the Vercel KV database
      const kv = createClient({
        url: process.env.REDIS_URL,
        // The token is part of the URL, so we don't need a separate token variable
      });

      // Create a simple object for the email
      const emailToStore = {
        id: emailData.email_id,
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        receivedAt: emailData.created_at,
      };

      // Save the email to a list in the database.
      // We use 'lpush' to add it to the beginning of a list called 'emails'.
      await kv.lpush('emails', JSON.stringify(emailToStore));
      
      console.log('Email saved to KV store:', emailToStore.id);
    }

    res.status(200).json({ message: 'Webhook processed.' });

  } catch (error) {
    console.error('Error processing webhook:', error.message);
    return res.status(400).json({ error: 'Error processing webhook.' });
  }
}
