const mongoose = require('mongoose');


const labTestSchema = new mongoose.Schema({
    // Reference Fields
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VetService',
      required: true
    },
    sub_service_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true
    },
    health_record_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthRecord',
      required: true
    },
    clinic_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true
    },
  
    // Test Information (copied from service for record keeping)
    test_name: {
      type: String,
      required: true
    },
    requirements: {
      type: String,
      required: true
    },
  
    // Pet Information (denormalized)
    pet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet'
    },
    pet_info: {
      name: String,
      species: String,
      breed: String,
      age: Number,
      gender: String
    },

// In your LabTest model
results: [{
  parameter: {
    name: String,
    unit: String,
    normal_range: String
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
  },
  unit: String,
  normal_range: String,
  flag: {
    type: String,
    enum: ['normal', 'high', 'low', 'critical'],
    default: 'normal'
  }
}],
  
    // Interpretation
    summary: {
      type: String,
      enum: ['normal', 'abnormal', 'inconclusive'],
      required: false
    },

    vet_notes:{
      type: String, 
      default:''
    } ,
    recommendations:{
      type: String, 
      default:''
      } ,
  
    // Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed'],
      default: 'pending'
    },
    completed_at: Date,

  }, { timestamps: true });
  
  // Indexes
  labTestSchema.index({ appointment_id: 1 });
  labTestSchema.index({ health_record_id: 1 });
  labTestSchema.index({ clinic_id: 1, status: 1 });
  
  module.exports = mongoose.model('LabTest', labTestSchema);