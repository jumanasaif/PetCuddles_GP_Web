const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_51RIbAR4CVrHa7X9FbfpOePCnA9rtSPDWD9AA65h9eAJltnQYfh3PCmkFWwCRxPGPdyoJ67NixHMwHesFzwYMxeav00nbbiit6x');
const Admin = require('../models/Admin');
const Clinic = require('../models/Clinic');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');



// Remove any auth middleware from the payment route
router.post('/create-payment-intent', async (req, res) => {
    try {
      const { amount, vetId, paymentMethodId } = req.body;
  
      // Basic validation
      if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      if (!vetId || !mongoose.Types.ObjectId.isValid(vetId)) {
        return res.status(400).json({ error: 'Invalid vet ID' });
      }
  
      // Get admin account
      const admin = await Admin.getAdmin();
      if (!admin) {
        return res.status(500).json({ error: 'Admin account not configured' });
      }
  
      // Verify vet exists
      const vet = await Clinic.findById(vetId);
      if (!vet) {
        return res.status(404).json({ error: 'Veterinarian not found' });
      }
  
      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        payment_method: paymentMethodId,
        payment_method_types: ['card'],
        automatic_payment_methods: {
            enabled: false, // Disable automatic payment methods
        },
    
        metadata: { vetId }
      });
  
  
      // Calculate fees (example: 2% fee)
      const feePercentage = 0.02;
      const feeAmount = Math.round(amount * feePercentage);
      const adminAmount = amount - feeAmount;
  
      // Create payment record - FIELD NAMES MATCHING MODEL
      const payment = await Payment.create({
        vet: vetId,
        admin: admin._id,
        stripePaymentId: paymentIntent.id,  // Correct field name
        amount: Math.round(amount),
        adminAmount: adminAmount,
        fee: feeAmount,
        status: 'pending',
        currency: 'usd'
      });
  
      // Add payment to vet's record using the model method
      await vet.addPayment(payment._id);
  
      res.json({ 
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentId: paymentIntent.id
      });
  
    } catch (err) {
      console.error('Payment error:', err);
      res.status(500).json({ 
        error: 'Payment processing failed',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
});
module.exports = router;