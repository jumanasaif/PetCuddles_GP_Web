// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../models/Subscription');

// GET vet subscription plans
router.get('/vet', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ type: 'vet', isActive: true })
      .sort({ displayOrder: 1 })
      .lean();
    
    if (!plans || plans.length === 0) {
      return res.status(404).json({ message: 'No subscription plans found' });
    }

    // Transform the data to match your frontend structure
    const transformedPlans = plans.reduce((acc, plan) => {
      acc[plan.name] = {
        price: `$${plan.price.toFixed(2)}`,
        period: plan.billingPeriod,
        features: plan.features.map(f => f.description || f.name),
        ...(plan.savingsText && { savings: plan.savingsText })
      };
      return acc;
    }, {});

    res.json(transformedPlans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/shop', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ type: 'shop', isActive: true })
      .sort({ displayOrder: 1 })
      .lean();
    
    if (!plans || plans.length === 0) {
      return res.status(404).json({ message: 'No subscription plans found' });
    }

    const transformedPlans = plans.reduce((acc, plan) => {
      acc[plan.name] = {
        price: `$${plan.price.toFixed(2)}`,
        period: plan.billingPeriod,
        features: plan.features.map(f => f.description || f.name),
        ...(plan.savingsText && { savings: plan.savingsText })
      };
      return acc;
    }, {});

    res.json(transformedPlans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
