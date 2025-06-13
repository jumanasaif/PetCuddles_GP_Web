const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  // Reference to the appointment that created this record
  appointment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
 
  },

  // Pet information (can be either registered or external)
  petType: {
    type: String,
    enum: ['registered', 'external', 'found'],
    required: true
  },


  // For registered pets
  pet_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: function() { return this.petType === 'registered'; }
  },

  // For external pets (copy of the info from appointment)
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
  // Found Pets:
  foundPet: {
    name: {
      type: String,
      default: 'Unknown'
    },
    species: {
      type: String,
      required: function() { return this.petType === 'found'; },
       default: 'unknown'
    },
    breed: String,
    estimatedAge: {
      type: String,
      required: function() { return this.petType === 'found'; },
       default: 'unknown'
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'unknown'],
      required: function() { return this.petType === 'found'; },
     default: 'unknown'
    },
    distinguishingFeatures: String,
    foundLocation: String,
    foundDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['in_clinic', 'fostered', 'adopted', 'released'],
      default: 'in_clinic'
    }
  },

  // Mark if this is a found pet case
  isFoundPet: {
    type: Boolean,
    default: false
  },

  // Clinic and doctor information
  clinic_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
    required: true
  },
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  doctor_name: {
    type: String,
    required: true
  },

  // Services performed (copied from appointment)
  services: [{
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VetService'
    },
    service_type: String,
    sub_service: String,
    extra_service: String,
    cost: Number,
    notes: String
  }],

  // Medical information
  diagnosis: String,
  treatment: String,
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    notes: String
  }],
  procedures: [{
    name: String,
    description: String,
    notes: String
  }],
  vaccinations: [{
    name: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    date: {
      type: Date,
      default: null
    },
    next_due: {
      type: Date,
      default: null
    },
    dose_number: {
      type: Number,
      default: 1
    },
    dose_count: {
      type: Number,
      default: 1
    },
    dose_description: {
      type: String,
      default: ''
    },
    is_completed: {
      type: Boolean,
      default: false
    }
  }],
  lab_results: [{
    test_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabTest'
    },
    test_name: String,
    date: Date,
    summary: String,
    results: [{
      parameter: {
        name: String,
        unit: String,
        normal_range: String
      },
      value: mongoose.Schema.Types.Mixed,
      unit: String,
      normal_range: String,
      flag: {
        type: String,
        enum: ['normal', 'high', 'low', 'critical'],
        default: 'normal'
      }
    }]
      
  }],
  medical_reports: [{
    type: {
      type: String,
      enum: ['xray', 'lab', 'ultrasound', 'lab_result', 'other'],
      required: true
    },
    description: String,
    file_name: String,
    file_path: String, // Store the file path instead of file_data
    file_type: String,
    upload_date: {
      type: Date,
      default: Date.now
    }
  }],

  // Follow-up information
  follow_up_required: {
    type: Boolean,
    default: false
  },
  follow_up_date: {
    type: Date,
    validate: {
      validator: function(v) {
        // Allow null/undefined or valid dates
        return v === null || v === undefined || !isNaN(v.getTime());
      },
      message: props => `${props.value} is not a valid date!`
    }
  },
  follow_up_reason: {
    type: String,
    default: ' '
  },

  // General notes
  notes: {
    type: String,
    maxlength: 2000
  },

  // Timestamps
  date_created: {
    type: Date,
    default: Date.now
  },
  last_updated: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
healthRecordSchema.pre('save', async function(next) {
  // Generate serial number
  if (this.isNew) {
    const count = await this.constructor.countDocuments({ 
      pet_id: this.pet_id,
      petType: this.petType
    });
    this.serialNumber = count + 1;
    console.log(`Creating record for pet ${this.pet_id} with serial ${this.serialNumber}`);
  }
  this.last_updated = Date.now();
  next();
});

healthRecordSchema.pre('save', function(next) {
  if (this.petType === 'found') {
    this.isFoundPet = true;
  }
  next();
});

// Indexes for performance
healthRecordSchema.index({ appointment_id: 1 });
healthRecordSchema.index({ clinic_id: 1, date_created: -1 });
healthRecordSchema.index({ pet_id: 1 });
healthRecordSchema.index({ doctor_id: 1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
