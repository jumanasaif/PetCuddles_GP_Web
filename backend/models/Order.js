const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  priceAtPurchase: { 
    type: Number, 
    required: true 
  },
  productName: { 
    type: String,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  shopId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Shop', 
    required: true 
  },
  items: [orderItemSchema],

  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  deliveryCost: {
    type: Number,
    default: 0
  },
  totalAmount: { 
    type: Number, 
    required: true 
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryAddress: {
    type: {
      street: String,
      city: String,
      village: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    required: false
  },
  estimatedDeliveryDays: {
    type: Number,
    default: 3
  },
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'credit_card'],
    required: true
  },
  appliedCoupons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  stripePaymentId: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add pre-save hook to store product names
orderSchema.pre('save', async function(next) {
  if (this.isModified('items')) {
    for (const item of this.items) {
      if (!item.productName) {
        const product = await mongoose.model('Product').findById(item.productId);
        if (product) {
          item.productName = product.name;
        }
      }
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);