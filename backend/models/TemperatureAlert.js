// models/TemperatureAlert.js
const mongoose = require('mongoose');

const temperatureAlertSchema = new mongoose.Schema({
  thresholdType: { 
    type: String, 
    enum: ['high', 'low'], 
    required: true 
  },
  temperature: { 
    type: Number, 
    required: true 
  },
  severity: { 
    type: String, 
    enum: ['warning', 'danger', 'extreme'], 
    required: true 
  },
  affectedSpecies: [{ 
    type: String, 
    enum: ['dog', 'cat', 'bird', 'rabbit', 'cow', 'sheep'] 
  }],
  regions: [String], // Cities/villages affected
  message: String,
  startTime: { 
    type: Date, 
    default: Date.now 
  },
  endTime: Date,
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin' 
  }
}, { timestamps: true });

module.exports = mongoose.model('TemperatureAlert', temperatureAlertSchema);