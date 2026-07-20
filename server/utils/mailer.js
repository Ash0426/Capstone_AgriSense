// server/utils/mailer.js
// Sends the OTP email. Uses the SMTP_* values from .env — see .env.example for setup notes.
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function sendOtpEmail(toEmail, code) {
  await transporter.sendMail({
    from: `"AgriSense" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Your AgriSense password reset code',
    text: `Your one-time code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your AgriSense password reset code is:</p><h2>${code}</h2><p>This code expires in 10 minutes.</p>`,
  });
}

module.exports = { sendOtpEmail };
