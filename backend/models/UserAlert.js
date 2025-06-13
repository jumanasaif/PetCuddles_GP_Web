// models/UserAlert.js
const mongoose = require('mongoose');

const userAlertSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  petId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet' 
  },
   alertId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'alertModel'
  },
  alertModel: {
    type: String,
    required: true,
    enum: ['TemperatureAlert', 'DiseaseAlert']
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  receivedAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('UserAlert', userAlertSchema);