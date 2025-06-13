// routes/shopPayment.js
const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Admin = require('../models/Admin');
const ShopPayment = require('../models/ShopPayment');
const mongoose = require('mongoose');

// Create shop payment (simulated, no real Stripe integration)
router.post('/create-shop-payment', async (req, res) => {
  try {
    const { amount, shopId, subscriptionPlan } = req.body;

    // Basic validation
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    if (!shopId || !mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ error: 'Invalid shop ID' });
    }
    if (!['monthly', 'yearly'].includes(subscriptionPlan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Get admin account
    const admin = await Admin.getAdmin();
    if (!admin) {
      return res.status(500).json({ error: 'Admin account not configured' });
    }

    // Verify shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Calculate subscription end date
    const subscriptionStart = new Date();
    let subscriptionEnd = new Date();
    
    if (subscriptionPlan === 'monthly') {
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
    } else {
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
    }

    // Calculate fees (example: 2% fee)
    const feePercentage = 0.02;
    const feeAmount = Math.round(amount * feePercentage);
    const adminAmount = amount - feeAmount;

    // Create payment record
    const payment = await ShopPayment.create({
      shop: shopId,
      admin: admin._id,
      amount: Math.round(amount),
      adminAmount: adminAmount,
      fee: feeAmount,
      status: 'completed', // Mark as completed since we're simulating
      subscriptionPlan,
      subscriptionEnd
    });

    // Update shop's subscription and activate account
    shop.subscription = {
      plan: subscriptionPlan,
      startDate: subscriptionStart,
      endDate: subscriptionEnd,
      isActive: true
    };
    shop.isActive = true;
    await shop.save();

    res.json({ 
      success: true,
      paymentId: payment._id
    });

  } catch (err) {
    console.error('Shop payment error:', err);
    res.status(500).json({ 
      error: 'Payment processing failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get shop subscription plans
router.get('/shop-subscription-plans', async (req, res) => {
  try {
    // These would normally come from a database or config
    const plans = {
      monthly: {
        price: 1999, // $19.99 in cents
        period: 'month',
        features: [
          'limit 50 product listing',
          'Product management',
          'Order tracking',
          'Basic analytics'
        ],
      },
      yearly: {
        price: 19900, // $199.00 in cents
        period: 'year',
        savings: 'Save 20%',
        features: [
          'Full shop listing',
          'Premium placement',
          'Advanced analytics',
          'Priority support'
        ],
      }
    };

    res.json(plans);
  } catch (err) {
    console.error('Error getting subscription plans:', err);
    res.status(500).json({ error: 'Failed to get subscription plans' });
  }
});

module.exports = router;