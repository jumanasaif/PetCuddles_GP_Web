const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  vet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  stripePaymentId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true // Amount in cents
  },
  adminAmount: {
    type: Number,
    required: true // Amount that goes to admin (in cents)
  },
  fee: {
    type: Number,
    required: true // Stripe processing fee (in cents)
  },
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'card'
  },
  receiptUrl: String,
  metadata: Object
}, { timestamps: true });

// Add indexes for faster queries
paymentSchema.index({ vet: 1 });
paymentSchema.index({ admin: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;