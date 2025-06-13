// models/Shop.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const shopSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Shop owner name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  village: {
    type: String,
    required: false
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  workingHours: {
    sunday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    monday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    tuesday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    wednesday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    thursday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    friday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: true }
    },
    saturday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    }
  },
  DeliveryProvide: {
    type: Boolean,
    default: false
  },
deliverySettings: {
    cost: { 
      type: Number, 
      default: 0 
    },
    estimatedDays: { 
      type: Number, 
      default: 3 
    },
    availableDays: [String], // ['monday', 'tuesday', etc.]
    maxDistance: { 
      type: Number, 
      default: 20 // in km
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 0 // Minimum order amount for free delivery
    }
  },
  profileImage: {
    type: String,
    default: ''
  },
   isActive: {
    type: Boolean,
    default: false
  },
  subscription: {
    plan: {
      type: String,
      enum: ['monthly', 'yearly']
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  role: {
    type: String,
    enum: ['shop'],
    default: 'shop'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
shopSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Generate auth token
shopSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      userId: this._id, 
      role: 'shop',
      shopName: this.shopName 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;