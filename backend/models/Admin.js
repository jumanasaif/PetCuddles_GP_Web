const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Add this import at the top
const Payment= require('./Payment');

const adminSchema = new mongoose.Schema({
  fullName:{
    type: String,
    default:'PetCuddles'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    default: 'admin@vetconnect.com',
    immutable: true // Prevents changing the email
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'admin',
    immutable: true
  },
  profileImage: {
    type: String,
    default: '/images/admin-avatar.png' // Add a default admin avatar
  },
  balance: {
    type: Number,
    default: 0 // Stored in cents
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }]

}, { timestamps: true });

// Static method to create/get the admin
adminSchema.statics.getAdmin = async function() {
  let admin = await this.findOne({});
  if (!admin) {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
    
    admin = await this.create({
      email: 'admin@vetconnect.com',
      password: hashedPassword,
      role: 'admin'
    });
  }
  return admin;
};

// Method to generate auth token
adminSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      userId: this._id, 
      role: this.role,
      email: this.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

adminSchema.methods.updateBalance = async function(paymentId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');
  
  this.balance += payment.adminAmount;
  this.transactions.push(paymentId);
  
  return this.save();
};

module.exports = mongoose.model('Admin', adminSchema);