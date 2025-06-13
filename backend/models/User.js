const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  resetToken: String,
  tokenExpiry: Date,
  role: { type: String, enum: ["pet_owner", "doctor", "vet", "shop","admin"], required: true },
  city: { type: String, required: false },
  village: { type: String, required: false}, // New: For village
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  }, // New: For geolocation
  profileImage: { type: String, default: '' }, 
  submittedSolutions: [{
    solution: String,
    behaviorPatternId: mongoose.Schema.Types.ObjectId,
    dateSubmitted: Date,
    effectiveness: Number,
    upvotes: { type: Number, default: 0 }
  }],
  createdAt: { type: Date, default: Date.now, required: true }
  
});

module.exports = mongoose.model('User', userSchema);
