import logger from './logger.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const publicKey = process.env.YOCO_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({ error: 'Yoco public key not configured' });
    }
    
    return res.status(200).json({ publicKey });
  } catch (error) {
    logger.error('Error getting Yoco public key:', error);
    return res.status(500).json({ error: 'Failed to get public key' });
  }
}

