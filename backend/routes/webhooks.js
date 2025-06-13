const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_51RJgrERRpMs7bamVrLP5pXEeTQgtNs4JfihTKI5LD9OkJDrgLiSL3ayaBOnDneyGpUwLqmbidiJQGM3CwvyCcqXK00YjSnqhz3');
const Payment = require('../models/Payment');

router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    
    try {
      await Payment.findOneAndUpdate(
        { stripePaymentId: paymentIntent.id },
        {
          status: 'succeeded',
          receiptUrl: paymentIntent.charges.data[0].receipt_url,
          metadata: paymentIntent.metadata
        }
      );
    } catch (err) {
      console.error('Failed to update payment:', err);
    }
  }

  // Handle failed payment
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    
    await Payment.findOneAndUpdate(
      { stripePaymentId: paymentIntent.id },
      { status: 'failed' }
    );
  }

  res.json({ received: true });
});