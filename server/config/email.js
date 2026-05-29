const nodemailer = require('nodemailer');

const getTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const isPlaceholderSender = (value = '') => (
  !value ||
  value.includes('yourstore.com') ||
  value.includes('example.com')
);

const getEmailFrom = () => {
  const configuredSender = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  return isPlaceholderSender(configuredSender)
    ? process.env.SMTP_USER
    : configuredSender;
};

module.exports = {
  getTransporter,
  getEmailFrom,
};
