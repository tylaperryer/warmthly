import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    // Destructure 'html' instead of 'body' from the request
    const { to, subject, html } = req.body;

    // Check if the html content is empty or just contains empty paragraph tags
    if (!html || html === '<p>  
</p>') {
      return res.status(400).json({ error: { message: 'Email body cannot be empty.' } });
    }

    const { data, error } = await resend.emails.send({
      from: 'The Warmthly Desk <desk@warmthly.org>',
      to: [to],
      subject: subject,
      // Pass the HTML content directly to the 'html' parameter
      html: html,
    });

    if (error) {
      return res.status(400).json({ error });
    }
    res.status(200).json({ message: 'Email sent successfully!', data });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
