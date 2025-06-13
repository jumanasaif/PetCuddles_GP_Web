// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  shopId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Shop', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  price: { 
    type: Number, 
    required: true 
  },
  category: { 
    type: String,
    enum: ['food', 'toy', 'accessory', 'health', 'grooming', 'other'],
    required: true
  },
  subcategory: String,
  stock: { 
    type: Number, 
    required: true,
    min: 0
  },
  threshold: {  // NEW: Add threshold field
    type: Number,
    required: true,
    min: 0,
    default: 5
  },
  images: [{
    data: { type: String, required: true },
    contentType: { type: String, required: true }
  }],
 petTypes: [{ 
  type: String, 
  enum: ['dog', 'cat', 'bird', 'rabbit', 'cow', 'sheep'],
  validate: {
    validator: function(v) {
      return this.petTypes.length <= 6; // Or your max number
    },
    message: 'Too many pet types selected'
  }
}],
  brand: {
    type: String,
    required: false 
  },
  weight:  {
    type: String,
    required: false 
  }, // e.g., "5kg", "10lb"
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

//method to check stock status
productSchema.methods.checkStockStatus = function() {
  if (this.stock === 0) return 'out-of-stock';
  if (this.stock <= this.threshold) return 'low-stock';
  return 'in-stock';
};

module.exports = mongoose.model('Product', productSchema);


