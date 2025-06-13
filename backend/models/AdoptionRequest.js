const mongoose = require('mongoose');

const AdoptionRequestSchema = new mongoose.Schema({
  owner_id: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the pet owner
    ref: 'User', // Assuming you have a User model
    required: true,
  },
  pet_type: {
    type: String,
    enum: ['Pet', 'FoundPet'],
    required: true
  },
  pet_id: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the pet
    ref: 'Pet', // Assuming you have a Pet model
    required: true,
  },
  requester_id: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the requester
    ref: 'User', // Assuming you have a User model
    required: true,
  },
  adoption_type: { 
    type: String, 
    enum: ['lifetime', 'temporary'], 
    required: true ,
     default: 'lifetime'
  },
  questionsAndAnswers: [
    {
      question: {
        type: String,
        required: true,
      },
      answer: {
        type: String,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'], // Allowed statuses
    default: 'pending', // Default status is 'pending'
  },
    // For found pets only
    clinic_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required:false
    },
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the creation date
  },

});
AdoptionRequestSchema.index({ pet_id: 1, pet_type: 1 });
AdoptionRequestSchema.index({ owner_id: 1, status: 1 });

module.exports = mongoose.model('AdoptionRequest', AdoptionRequestSchema);