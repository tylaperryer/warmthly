import { Resend } from 'resend';
import logger from './logger.js';
import { getRedisClient } from './redis-client.js';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    let rawBody;
    try {
      rawBody = await getRawBody(req);
    } catch (bodyError) {
      logger.error('[inbound-email] Error getting raw body:', bodyError.message);
      if (req.body) {
        rawBody = Buffer.from(JSON.stringify(req.body));
      } else {
        throw new Error('Could not get request body');
      }
    }
    
    const signature = req.headers['svix-signature'];
    const id = req.headers['svix-id'];
    const timestamp = req.headers['svix-timestamp'];
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      logger.error('[inbound-email] RESEND_WEBHOOK_SECRET is required in production');
      return res.status(500).json({ error: { message: 'Webhook verification not configured' } });
    }

    let event;
    try {
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
      logger.error('[inbound-email] Webhook verification failed:', {
        message: verifyError.message,
        stack: verifyError.stack
      });
      return res.status(401).json({ error: { message: 'Webhook verification failed.' } });
    }

    if (event.type === 'email.received') {
      const emailData = event.data;
      
      if (!emailData) {
        logger.error('[inbound-email] Email data is missing');
        return res.status(400).json({ error: { message: 'Email data is missing' } });
      }

      const client = await getRedisClient();
      const emailToStore = {
        id: emailData.email_id || `email-${Date.now()}`,
        from: emailData.from || 'Unknown',
        to: emailData.to || 'Unknown',
        subject: emailData.subject || '(No Subject)',
        receivedAt: emailData.created_at || new Date().toISOString(),
      };

      try {
        const emailJson = JSON.stringify(emailToStore);
        await client.lPush('emails', emailJson);
      } catch (saveError) {
        logger.error('[inbound-email] Error saving email to Redis:', {
          message: saveError.message,
          stack: saveError.stack,
          name: saveError.name,
          code: saveError.code
        });
        throw saveError;
      }
    }

    return res.status(200).json({ message: 'Webhook processed successfully.' });

  } catch (error) {
    logger.error('[inbound-email] Error processing webhook:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    return res.status(500).json({ 
      error: { 
        message: 'Error processing webhook.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
}
