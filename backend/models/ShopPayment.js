// models/ShopPayment.js
const mongoose = require('mongoose');

const shopPaymentSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  amount: {
    type: Number,
    required: true // Amount in cents
  },
  adminAmount: {
    type: Number,
    required: true // Amount that goes to admin
  },
  fee: {
    type: Number,
    required: true // Processing fee (in cents)
  },
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'card'
  },
  subscriptionPlan: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  subscriptionStart: {
    type: Date,
    default: Date.now
  },
  subscriptionEnd: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// Add indexes for faster queries
shopPaymentSchema.index({ shop: 1 });
shopPaymentSchema.index({ admin: 1 });
shopPaymentSchema.index({ createdAt: -1 });

const ShopPayment = mongoose.model('ShopPayment', shopPaymentSchema);

module.exports = ShopPayment;
