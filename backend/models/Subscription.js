// models/SubscriptionPlan.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const featureSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String }
});

const subscriptionPlanSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  type: {
    type: String,
    required: true,
    enum: ['shop', 'vet'],
    index: true // Add index for better query performance
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP'] // Add other currencies as needed
  },
  billingPeriod: {
    type: String,
    required: true,
    enum: ['month', 'year']
  },
  features: [featureSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  discount: {
    amount: { type: Number, default: 0 },
    percentage: { type: Number, default: 0, min: 0, max: 100 }
  },
  savingsText: { type: String }, // e.g., "Save 20%"
  displayOrder: { type: Number, default: 0 }, // For sorting plans
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  trialPeriodDays: {
    type: Number,
    default: 0
  }
});

// Update the updatedAt field before saving
subscriptionPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get active plans by type
subscriptionPlanSchema.statics.getActivePlansByType = function(type) {
  return this.find({ type, isActive: true })
    .sort({ displayOrder: 1, price: 1 })
    .exec();
};

// Virtual property for display price
subscriptionPlanSchema.virtual('displayPrice').get(function() {
  return `${this.currency}${this.price.toFixed(2)}`;
});

// Virtual property for period display
subscriptionPlanSchema.virtual('periodDisplay').get(function() {
  return this.billingPeriod === 'month' ? 'monthly' : 'yearly';
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

module.exports = SubscriptionPlan;
