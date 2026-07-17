const nodemailer = require('nodemailer');

const getTransportConfig = () => {
  const authUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const authPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  const smtpHost = process.env.SMTP_HOST;
  const emailService = process.env.EMAIL_SERVICE;

  if (smtpHost && authUser && authPass) {
    return {
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
      auth: {
        user: authUser,
        pass: authPass,
      },
    };
  }

  if (emailService && authUser && authPass) {
    return {
      service: emailService,
      auth: {
        user: authUser,
        pass: authPass,
      },
    };
  }

  return null;
};

const getTransporter = () => {
  const transportConfig = getTransportConfig();
  return transportConfig ? nodemailer.createTransport(transportConfig) : null;
};

const isPlaceholderSender = (value = '') => (
  !value ||
  value.includes('yourstore.com') ||
  value.includes('example.com') ||
  !value.includes('@')
);

const getEmailFrom = () => {
  const configuredSender = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  return isPlaceholderSender(configuredSender)
    ? process.env.SMTP_USER || process.env.EMAIL_USER
    : configuredSender;
};

module.exports = {
  getTransporter,
  getEmailFrom,
};
