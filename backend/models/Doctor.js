const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Clinic = require('./Clinic');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Doctor name is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  birthDate: {
    type: Date,
    required: false
  },
  phone: {
    type: String,
    required: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  specialty: {
    type: String,
    required: [false, 'Specialty is not required'],
    enum: ['Dentistry', 'Dermatology', 'Surgery', 'Internal Medicine', 'Ophthalmology', 'Cardiology','General'],
    default:'General'
  },
  status: {
    type: String,
    enum: ['active', 'on leave', 'inactive'],
    default: 'active'
  },
  profileImage: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  temporaryPassword: {
    type: String,
    select: false
  },
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

doctorSchema.pre('save', async function(next) {
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
  doctorSchema.methods.generateAuthToken = function() {
    return jwt.sign(
      { 
        userId: this._id, 
        role: 'doctor',
        clinicId: this.clinic
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  };

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;