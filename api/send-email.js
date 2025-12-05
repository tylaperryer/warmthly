import { Resend } from 'resend';
import { withRateLimit, emailRateLimitOptions } from './rate-limit.js';
import logger from './logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const MAX_SUBJECT_LENGTH = 200;

function isEmptyHTML(html) {
  if (!html || typeof html !== 'string') {
    return true;
  }
  
  const trimmed = html.trim();
  
  if (!trimmed) {
    return true;
  }
  
  const emptyPatterns = [
    /^<p>\s*<\/p>$/i,
    /^<p><br\s*\/?><\/p>$/i,
    /^<p>\s*<br\s*\/?>\s*<\/p>$/i,
    /^<p>&nbsp;<\/p>$/i,
    /^<p>\s*&nbsp;\s*<\/p>$/i,
  ];
  
  return emptyPatterns.some(pattern => pattern.test(trimmed));
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

async function sendEmailHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      logger.error('RESEND_API_KEY is not configured');
      return res.status(500).json({ error: { message: 'Email service is not configured. Please contact the administrator.' } });
    }

    const { to, subject, html } = req.body;

    if (!to || typeof to !== 'string') {
      return res.status(400).json({ error: { message: 'Recipient email address is required.' } });
    }

    if (!isValidEmail(to)) {
      return res.status(400).json({ error: { message: 'Invalid email address format.' } });
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ error: { message: 'Email subject is required.' } });
    }

    if (isEmptyHTML(html)) {
      return res.status(400).json({ error: { message: 'Email body cannot be empty.' } });
    }

    const sanitizedSubject = subject.trim().substring(0, MAX_SUBJECT_LENGTH);

    const { data, error } = await resend.emails.send({
      from: 'The Warmthly Desk <desk@warmthly.org>',
      to: [to.trim()],
      subject: sanitizedSubject,
      html: html,
    });

    if (error) {
      logger.error('Resend API error:', error);
      return res.status(400).json({ error: { message: error.message || 'Failed to send email. Please try again.' } });
    }

    return res.status(200).json({ message: 'Email sent successfully!', data });
  } catch (error) {
    logger.error('Unexpected error in send-email handler:', error);
    return res.status(500).json({ error: { message: 'Internal Server Error. Please try again later.' } });
  }
}

export default withRateLimit(sendEmailHandler, emailRateLimitOptions);
