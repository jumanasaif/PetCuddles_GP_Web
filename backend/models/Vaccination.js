const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const vaccinationSchema = new Schema({
  vet: {
    type: Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  service_id: {
    type: Schema.Types.ObjectId,
    ref: 'VetService',
    required: true
  },
  sub_service_id: {
    type: Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  petTypes: [{
    type: String,
    enum: ['dog', 'cat', 'rabbit', 'bird', 'sheep', 'cow', 'other'],
    required: true
  }],
  firstDoseAge: {
    type: String,
    required: true,
    trim: true
  },
  protectsAgainst: {
    type: String,
    required: true,
    trim: true
  },
  doseCount: {
    type: Number,
    required: true,
    min: 1
  },
  doseInterval: {
    type: String,
    required: true,
    trim: true
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  baseCost: {
    type: Number,
    required: true,
    min: 0
  },
  extraServices: [{
    name: String,
    cost: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
vaccinationSchema.index({ vet: 1, name: 1 });
vaccinationSchema.index({ service_id: 1, sub_service_id: 1 }, { unique: true });

// Update timestamp before saving
vaccinationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Vaccination', vaccinationSchema);