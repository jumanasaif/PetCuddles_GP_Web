// models/BehaviorPattern.js
const mongoose = require('mongoose');

// models/BehaviorPattern.js
const solutionSchema = new mongoose.Schema({
  solution: { type: String, required: true },
  effectiveness: { 
    type: Number, 
    min: 0, 
    max: 1,
    set: v => parseFloat(v.toFixed(2)) // Store with 2 decimal places
  },
  implementation: { type: String, enum: ['easy', 'medium', 'hard'] },
  steps: [String],
  source: { 
    type: String, 
    enum: ['expert', 'user_submitted'], 
    default: 'expert' 
  },
  submitted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submission_date: {
    type: Date,
    default: Date.now
  },
  trialCount: {
    type: Number,
    default: 0
  },
  totalEffectiveness: {
    type: Number,
    default: 0
  },
  last_tried: {
    type: Date
  }
});

const frequencyAdviceSchema = new mongoose.Schema({
  level: { type: String, required: true, enum: ['low', 'medium', 'high'] },
  message: String,
  actions: [String],
  severity: { type: Number, min: 1, max: 3 }
});

const medicalFlagSchema = new mongoose.Schema({
  needs_vet: Boolean,
  urgency: { type: String, enum: ['immediate', 'within_24h', 'within_week'],required: false },
  red_flags: [String],
  related_conditions: [String]
});

const behaviorPatternSchema = new mongoose.Schema({
  species: { 
    type: [String], 
    required: true,
    enum: ['dog', 'cat', 'rabbit', 'bird', 'cow', 'sheep']
  },
  breed_specific: [String], // Optional breed-specific behaviors
  id: { type: String, required: true, unique: true },
  keywords: [String],
  name: { type: String, required: true },
  description: { type: String, required: true },
  categories: [String],
  causes: [String],
  solutions: [solutionSchema],
  frequency_advice: [frequencyAdviceSchema],
  medical_flags: medicalFlagSchema,
  age_related: {
    is_common: Boolean,
    typical_age_range: String
  },
  prevention_tips: [String],
  video_examples: [String], // URLs to example videos
  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BehaviorPattern', behaviorPatternSchema);