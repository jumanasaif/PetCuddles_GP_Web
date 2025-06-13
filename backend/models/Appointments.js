const VetService = require('./VetService'); 
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
 // Core References (conditional based on pet type)
 petType: {
    type: String,
    enum: ['registered', 'external'],
    required: true
  },
  
  // For registered pets
  pet_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: function() { return this.petType === 'registered'; }
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.petType === 'registered'; }
  },
  
  // For external pets
  externalPet: {
    name: {
      type: String,
      required: function() { return this.petType === 'external'; }
    },
    species: {
      type: String,
      required: function() { return this.petType === 'external'; }
    },
    breed: String,
    age: Number,
    gender: String,
    ownerName: {
      type: String,
      required: function() { return this.petType === 'external'; }
    },
    ownerPhone: {
      type: String,
      required: function() { return this.petType === 'external'; }
    },
    ownerEmail: String
  },

  clinic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
services: [{
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VetService',
      required: true
    },
    sub_service_id: mongoose.Schema.Types.ObjectId,
    extra_sub_service_id: mongoose.Schema.Types.ObjectId,
    cost: {
      type: Number,
      required: true
    }
  }],
  // Timing Information
  date: {
    type: Date,
    required: true,
  },
   Time: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM)`
    }
  },
  expectedEndTime: {  // New field
    type: String,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format (HH:MM)`
    }
  },
  reason: {
    type: String,
    required: false
  },
status: {
  type: String,
  enum: ['pending', 'completed', 'cancelled','pending_request', 'accepted', 'rejected'],
  default: 'pending'
},
  source: {
    type: String,
    enum: ['vet_added', 'owner'],
    required: true
  },
  isFirstVisit: {
    type: Boolean,
    default: function() { 
      return this.petType === 'external' || this.source === 'walk_in';
   }
   },
  // Additional Features
  isEmergency: {
    type: Boolean,
    default: false
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', null],
    default: null
  },
  recurrenceEndDate: {
    type: Date
  },

  estimatedCost: {
    type: Number,
    min: 0
  },
  actualCost: {
    type: Number,
    min: 0
  },
// In your appointmentSchema
vaccinationDoses: {
  type: Map,
  of: new mongoose.Schema({
    name: String,
    type: String,
    doseCount: Number,
    doseInterval: String,
    doseDescription: String,
    selectedDose: Number
  }),
  default: () => new Map()
},
followUpInfo: {
  needed: Boolean,
  date: Date,
  time: String,
  period: String,
  notes: String
},

  // Tracking Information
  notes: {
    type: String,
    maxlength: 1000,
    required: false
  },
  cancellationReason: {
    type: String,
    enum: [
      'owner_request',
      'clinic_request',
      'doctor_unavailable',
      'emergency_closure',
      'other',
    ],
    default: "owner_request"
  },
 rescheduleRequests: [{
    requestedDate: Date,
    requestedTime: String,
    requestedEndTime: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    reason: String,
    requestedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date
  }],
  reminders: {
    dayBeforeSent: Boolean,
    hourBeforeSent: Boolean
  },
   discount: {
    amount: Number,
    reason: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});



// Helper function to calculate end time
function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
}

// Pre-save hook for appointment
appointmentSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Calculate total duration from selected services
  if (this.isModified('services') || this.isModified('Time')) {
    let totalDuration = 0;
    
    // Calculate total duration from all services
    for (const service of this.services) {
      const serviceDoc = await VetService.findById(service.service_id);
      if (!serviceDoc) continue;
      
      const subService = serviceDoc.subServices.find(
        sub => sub._id.toString() === service.sub_service_id.toString()
      );
      
      if (subService) {
        // Add base duration
        totalDuration += subService.duration || 30; // Default 30 minutes
        
        // Add extra service duration if exists
        if (service.extra_sub_service_id) {
          const extraService = subService.extraServices.find(
            extra => extra._id.toString() === service.extra_sub_service_id.toString()
          );
          if (extraService) {
            totalDuration += extraService.duration || 15; // Default 15 minutes
          }
        }
      }
    }
    
    // Add buffer time between appointments (optional)
    totalDuration += 5; // 5 minutes buffer
    
    // Calculate and set expected end time
    if (this.Time) {
      this.expectedEndTime = calculateEndTime(this.Time, totalDuration);
    }
  }
  
  // Validate recurrence pattern if isRecurring is true
  if (this.isRecurring && !this.recurrencePattern) {
    throw new Error('Recurrence pattern required for recurring appointments');
  }
  
  next();
});


// Indexes for performance
appointmentSchema.index({ clinic_id: 1, date: 1, status: 1 });
appointmentSchema.index({ owner_id: 1, date: 1 });
appointmentSchema.index({ doctor_id: 1, date: 1 });
appointmentSchema.index({ pet_id: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
