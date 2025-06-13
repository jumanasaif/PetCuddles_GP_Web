// models/SkinConditionDetection.js
const mongoose = require('mongoose');

const skinConditionDetectionSchema = new mongoose.Schema({
  pet_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  image_url: { type: String, required: true },
  prediction: { type: String, required: true },  // This is the required field
  confidence: { type: Number, required: true },
  species: { type: String, required: true },
  notes: String,
recommendation: {
  type: Object,
  required: true
},
  createdAt: { type: Date, default: Date.now }
});


// In your SkinConditionDetection schema
skinConditionDetectionSchema.index({ user_id: 1 });
skinConditionDetectionSchema.index({ prediction: 1, species: 1, createdAt: 1 });

module.exports = mongoose.model('SkinConditionDetection', skinConditionDetectionSchema);