const mongoose = require('mongoose');

const TravelGuideSchema = new mongoose.Schema({
  location: {
    city: String,
    address: String,
    coordinates: { lat: Number, lng: Number }
  },
  userTrials: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    experience: {
      type: String,
      required: true
    },
    tips: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    photos: [String],
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Add index for coordinates
TravelGuideSchema.index({
  'coordinates.lat': 1,
  'coordinates.lng': 1
});

module.exports = mongoose.model('TravelGuide', TravelGuideSchema);
