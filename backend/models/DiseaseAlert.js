// models/DiseaseAlert.js
const mongoose = require('mongoose');

const diseaseAlertSchema = new mongoose.Schema({
  disease: { type: String, required: true },
  species: { type: String, required: true },
  regions: [{
    city: String,
    village: String
  }],
  caseCount: { type: Number, required: true },
  confidenceThreshold: { type: Number, default: 0.6 },
  severity: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    required: true 
  },
  message: String,
  recommendations: [String],
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  isActive: { type: Boolean, default: true },
  triggeredByCases: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'SkinConditionDetection' 
  }]
}, { timestamps: true });

module.exports = mongoose.model('DiseaseAlert', diseaseAlertSchema);
