const mongoose = require('mongoose');
const Schema = mongoose.Schema;



// Extra Service Schema (name + cost + duration)
const extraServiceSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Extra service name is required'],
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
    set: v => parseFloat(v)
  },
  duration: {  // Duration in minutes
    type: Number,
    required: true,
    min: 0,
    default: 15,
    set: v => parseInt(v)
  }
}, { _id: true });

// Sub-Service Schema
const subServiceSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Sub-service name is required'],
    trim: true
  },
  baseCost: {
    type: Number,
    required: true,
    min: 0,
    set: v => parseFloat(v)
  },
  duration: {  // Base duration in minutes
    type: Number,
    required: true,
    min: 5,
    default: 30,
    set: v => parseInt(v)
  },
  requirements: {
    type: String,
    required: [true, 'Sub-service requirements are required'],
    trim: true
  },
  extraServices: {
    type: [extraServiceSchema],
    default: []
  }
}, { _id: true });

// Main Service Schema (fixed enum types)
const serviceSchema = new Schema({
  vet: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: [true, 'Vet ID is required']
  },
  type: {
    type: String,
    enum: [
      'checkup',
      'vaccination',
      'emergency',
      'surgery',
      'grooming',
      'dental',
      'follow_up',
      'laboratory_test',
      'diagnostic'
    ],
    required: [true, 'Service type is required']
  },
  subServices: {
    type: [subServiceSchema],
    required: [true, 'At least one sub-service is required'],
    validate: {
      validator: (v) => v.length > 0,
      message: 'At least one sub-service is required'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes for faster queries
serviceSchema.index({ vet: 1, type: 1, isActive: 1 });

const Service = mongoose.model('VetService', serviceSchema);
module.exports = Service;
