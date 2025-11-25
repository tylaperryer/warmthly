import { createClient } from 'redis';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to get the raw request body from Vercel
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get the raw body for signature verification
    const rawBody = await getRawBody(req);
    
    // Get the signature headers from the request
    const signature = req.headers['svix-signature'];
    const id = req.headers['svix-id'];
    const timestamp = req.headers['svix-timestamp'];

    // Verify the webhook signature if secret is configured
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    let event;

    if (webhookSecret) {
      try {
        // Verify the webhook signature
        event = resend.webhooks.verify({
          body: rawBody,
          headers: {
            'svix-id': id,
            'svix-timestamp': timestamp,
            'svix-signature': signature,
          },
          secret: webhookSecret,
        });
      } catch (verifyError) {
        console.error('Webhook verification failed:', verifyError.message);
        return res.status(401).json({ error: 'Webhook verification failed.' });
      }
    } else {
      // If no secret is configured, parse the body directly (less secure, but works for testing)
      console.warn('RESEND_WEBHOOK_SECRET not configured - webhook verification skipped');
      event = JSON.parse(rawBody.toString());
    }

    // Log the incoming webhook for debugging
    console.log('Webhook received and verified:', {
      type: event?.type,
      hasData: !!event?.data,
      timestamp: new Date().toISOString()
    });

    if (event.type === 'email.received') {
      const emailData = event.data;
      
      // Validate required fields
      if (!emailData) {
        console.error('Email data is missing');
        return res.status(400).json({ error: 'Email data is missing' });
      }

      // Validate REDIS_URL is configured
      if (!process.env.REDIS_URL) {
        console.error('REDIS_URL is not configured');
        return res.status(500).json({ error: 'Database is not configured.' });
      }

      // Connect to the Vercel KV database
      const kv = createClient({
        url: process.env.REDIS_URL,
      });
      await kv.connect();

      // Create a simple object for the email
      const emailToStore = {
        id: emailData.email_id || `email-${Date.now()}`,
        from: emailData.from || 'Unknown',
        to: emailData.to || 'Unknown',
        subject: emailData.subject || '(No Subject)',
        receivedAt: emailData.created_at || new Date().toISOString(),
      };

      // Save the email to a list in the database.
      // We use 'lpush' to add it to the beginning of a list called 'emails'.
      await kv.lpush('emails', JSON.stringify(emailToStore));
      
      console.log('Email saved to KV store:', {
        id: emailToStore.id,
        from: emailToStore.from,
        to: emailToStore.to,
        subject: emailToStore.subject
      });
    } else {
      console.log('Webhook event type not handled:', event.type);
    }

    res.status(200).json({ message: 'Webhook processed successfully.' });

  } catch (error) {
    console.error('Error processing webhook:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({ 
      error: 'Error processing webhook.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
