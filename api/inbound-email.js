// /api/inbound-email.js

export default async function handler(req, res) {
  // We only want to handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const event = req.body;

    // Check if this is a received email event
    if (event.type === 'email.received') {
      const emailData = event.data;

      console.log('Email Received:');
      console.log('From:', emailData.from);
      console.log('To:', emailData.to);
      console.log('Subject:', emailData.subject);
      
      // Here is where you would add logic in the future,
      // such as saving the email to a database, forwarding it, etc.
    }

    // Respond to Resend to acknowledge receipt of the webhook
    res.status(200).json({ message: 'Webhook received successfully.' });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

