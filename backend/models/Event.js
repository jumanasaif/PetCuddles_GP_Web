const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  image: { type: String },
  organizer: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'organizerModel',
    required: true 
  },
  organizerModel: {
    type: String,
    required: true,
    enum: ['User', 'Clinic', 'Shop', 'Doctor', 'Admin']
  },
  attendees: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      refPath: 'attendees.userModel',
      required: true 
    },
    userModel: {
      type: String,
      required: true,
      enum: ['User', 'Clinic', 'Shop', 'Doctor', 'Admin']
    },
    status: {
      type: String,
      enum: ['attending', 'interested'],
      required: true
    }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);