/**
 * Inbound Email Handler
 * Processes webhook events from Resend for incoming emails
 * Stores emails in Redis for retrieval
 * Phase 3 Issue 3.9: Added request timeout
 */

import { Resend } from 'resend';

import { withTimeout } from '../security/request-timeout.js';
import { createErrorResponse, ErrorCode } from '../utils/error-response.js';
import logger from '../utils/logger.js';
import { getRedisClient } from '../utils/redis-client.js';

/**
 * Resend client instance
 */
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Request object interface
 */
interface Request {
  readonly method: string;
  readonly headers: {
    readonly 'svix-signature'?: string;
    readonly 'svix-id'?: string;
    readonly 'svix-timestamp'?: string;
    [key: string]: string | undefined;
  };
  readonly body?: unknown;
  on: (event: string, callback: (chunk?: Buffer) => void) => void;
  [key: string]: unknown;
}

/**
 * Response object interface
 */
interface Response {
  status: (code: number) => Response;
  json: (data: unknown) => Response;
  [key: string]: unknown;
}

/**
 * Email data from webhook
 */
interface EmailData {
  readonly email_id?: string;
  readonly from?: string;
  readonly to?: string;
  readonly subject?: string;
  readonly created_at?: string;
  [key: string]: unknown;
}

/**
 * Webhook event
 */
interface WebhookEvent {
  readonly type: string;
  readonly data?: EmailData;
  [key: string]: unknown;
}

/**
 * Stored email structure
 */
interface StoredEmail {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly receivedAt: string;
}

/**
 * Get raw body from request
 *
 * @param req - Request object
 * @returns Promise resolving to Buffer
 */
function getRawBody(req: Request): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('error', reject);
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

/**
 * Inbound email handler
 * Processes Resend webhook events
 *
 * @param req - Request object
 * @param res - Response object
 * @returns Response with success or error
 */
async function inboundEmailHandler(req: Request, res: Response): Promise<Response> {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    // Get raw body for webhook verification
    let rawBody: Buffer;
    try {
      rawBody = await getRawBody(req);
    } catch (bodyError: unknown) {
      const errorMessage = bodyError instanceof Error ? bodyError.message : String(bodyError);
      logger.error('[inbound-email] Error getting raw body:', errorMessage);

      // Fallback: try to get from parsed body
      if (req.body) {
        rawBody = Buffer.from(JSON.stringify(req.body));
      } else {
        throw new Error('Could not get request body');
      }
    }

    // Get webhook headers
    const signature = req.headers['svix-signature'];
    const id = req.headers['svix-id'];
    const timestamp = req.headers['svix-timestamp'];
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Validate webhook secret
    if (!webhookSecret) {
      logger.error('[inbound-email] RESEND_WEBHOOK_SECRET is required in production');
      return res.status(500).json({ error: { message: 'Webhook verification not configured' } });
    }

    // Verify webhook signature
    let event: WebhookEvent;
    try {
      event = resend.webhooks.verify({
        body: rawBody,
        headers: {
          'svix-id': id || '',
          'svix-timestamp': timestamp || '',
          'svix-signature': signature || '',
        },
        secret: webhookSecret,
      }) as WebhookEvent;
    } catch (verifyError: unknown) {
      if (verifyError instanceof Error) {
        logger.error('[inbound-email] Webhook verification failed:', {
          message: verifyError.message,
          stack: verifyError.stack,
        });
      }
      return res.status(401).json({ error: { message: 'Webhook verification failed.' } });
    }

    // Process email.received event
    if (event.type === 'email.received') {
      const emailData = event.data;

      if (!emailData) {
        logger.error('[inbound-email] Email data is missing');
        return res.status(400).json({ error: { message: 'Email data is missing' } });
      }

      // Prepare email data for storage
      const emailToStore: StoredEmail = {
        id: emailData.email_id || `email-${Date.now()}`,
        from: emailData.from || 'Unknown',
        to: emailData.to || 'Unknown',
        subject: emailData.subject || '(No Subject)',
        receivedAt: emailData.created_at || new Date().toISOString(),
      };

      // Store in Redis
      try {
        const client = await getRedisClient();
        const emailJson = JSON.stringify(emailToStore);
        await client.lPush('emails', emailJson);
      } catch (saveError: unknown) {
        if (saveError instanceof Error) {
          logger.error('[inbound-email] Error saving email to Redis:', {
            message: saveError.message,
            stack: saveError.stack,
            name: saveError.name,
            code: (saveError as { code?: string }).code,
          });
        }
        throw saveError;
      }
    }

    return res.status(200).json({ message: 'Webhook processed successfully.' });
  } catch (error: unknown) {
    // Log and return error
    if (error instanceof Error) {
      logger.error('[inbound-email] Error processing webhook:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: (error as { code?: string }).code,
      });
    }

    return res.status(500).json(
      createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Error processing webhook.')
    );
  }
}

// Phase 3 Issue 3.9: Add request timeout (20 seconds for webhook processing)
export default withTimeout(inboundEmailHandler, 20000);
