// models/VetTemporaryCare.js
const mongoose = require('mongoose');

const vetTemporaryCareSchema = new mongoose.Schema({
  petId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet', 
    required: true 
  },
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  vetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Clinic', 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  reason: {
    type: String,
    required: true
  },
  specialRequirements: [String],
  dailyRate: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  ownerNotes: String,
  vetResponse: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VetTemporaryCare', vetTemporaryCareSchema);