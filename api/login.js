// This is the code for api/login.js

export default function handler(req, res) {
  // Get the password that the frontend sent in its request
  const { password } = req.body;

  // Get the correct password from Vercel's secure environment variables
  const correctPassword = process.env.ADMIN_PASSWORD;

  // Check if the password is correct
  if (password === correctPassword) {
    // If yes, send back a "success" status
    res.status(200).json({ message: 'Login successful' });
  } else {
    // If no, send back an "unauthorized" status
    res.status(401).json({ message: 'Invalid password' });
  }
}
