import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { to, subject, body } = req.body;
    const { data, error } = await resend.emails.send({
      from: 'The Warmthly Desk <desk@warmthly.org>',
      to: [to],
      subject: subject,
      html: `<p>${body}</p>`,
    });
    if (error) {
      return res.status(400).json({ error });
    }
    res.status(200).json({ message: 'Email sent successfully!', data });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
