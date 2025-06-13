// notificationModel.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  link: {  
    type: String,
    required: false
  },
  type: {  
    type: String,
    enum: ['adoption', 'system', 'message', 'feeding', 'feeding-reminder', 'adoption-update', 'weather-alert','disease-alert'],
    default: 'system'
  },
  severity: {  // Add severity field for weather alerts
    type: String,
    enum: ['warning', 'danger', 'extreme','medium','high','low'],
    required: false
  },
  petId: {  // Add petId for pet-specific alerts
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pet",
    required: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
