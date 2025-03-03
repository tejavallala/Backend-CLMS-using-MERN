const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

if (!stripe) {
  throw new Error('Stripe initialization failed');
}

module.exports = stripe;