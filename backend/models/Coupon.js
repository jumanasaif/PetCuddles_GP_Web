// models/Coupon.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['amount', 'percentage'],
    default: 'amount',
    required: true
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0
  },
  isPetCuddles: {
    type: Boolean,
    default: false
  },
  conditions: {
    minPurchase: {  
      type: Number,
      default: 0
    },
    validUntil: {   
      type: Date,
      required: function() { return !this.isPetCuddles; } // Not required for Pet Cuddles coupons
    },
    firstOrderOnly: { 
      type: Boolean,
      default: false
    },
    specificProducts: [{ 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    categories: [String], // For category-based discounts
    subcategories: [String] // For subcategory-based discounts
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;