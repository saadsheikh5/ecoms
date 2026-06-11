const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY is not configured. Stripe checkout endpoints will fail until it is set.');
}

module.exports = Stripe(stripeSecretKey || 'REDACTED_FOR_PRODUCTION');
