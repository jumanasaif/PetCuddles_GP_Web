const mongoose = require('mongoose');

const foundPetSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Unknown'
  },
  species: {
    type: String,
    required: true,
    enum: ['dog', 'cat', 'bird', 'rabbit', 'other']
  },
  breed: String,
  estimatedAge: String,
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    default: 'unknown'
  },
  distinguishingFeatures: String,
  foundLocation: {
    type: String,
    required: true
  },
  foundDate: {
    type: Date,
    default: Date.now
  },
  // Physical status
  status: {
    type: String,
    enum: ['in_clinic', 'fostered', 'adopted', 'released'],
    default: 'in_clinic'
  },
  // Adoption process status
  adoptionStatus: {
    type: String,
    enum: ['not_listed', 'available', 'pending', 'adopted'],
    default: 'not_listed'
  },
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  healthRecords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthRecord'
  }],
  // Adoption details (only when listed)
  adoptionDetails: {
    aboutPet: {
      type: String,
      required: function() { return this.adoptionStatus === 'available'; }
    },
    deliveryPlace: {
      type: String,
      required: function() { return this.adoptionStatus === 'available'; }
    },
    questions: [String],
    // Force lifetime adoption for found pets
    adoption_type: {
      type: String,
      enum: ['lifetime'],
      default: 'lifetime'
    }
  },
  img_url: { type: String, required: false },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
foundPetSchema.index({ clinic: 1, adoptionStatus: 1 });
foundPetSchema.index({ status: 1, adoptionStatus: 1 });

module.exports = mongoose.model('FoundPet', foundPetSchema);
