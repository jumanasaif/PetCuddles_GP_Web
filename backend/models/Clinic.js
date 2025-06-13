const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const Payment= require('./Payment');
const Doctor= require('./Doctor');

const clinicSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Clinic owner or manager name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  clinicName: {
    type: String,
    required: [true, 'Clinic name is required'],
    trim: true
  },
  clinicLicense: {
    imageUrl: {
      type: String,
      required: [true, 'License image URL is required'],
      validate: {
        validator: function(v) {
          return /^\/uploads\/clinic-licenses\/.+$/.test(v);
        },
        message: props => `${props.value} is not a valid license image path`
      }
    }
  },
  isVerified: {
    type: Boolean,
    default: false
},
verificationDate: Date,
isActive: {
    type: Boolean,
    default: false
},
activationDate: Date,
approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
},
  city: {
    type: String,
    required: [true, 'City is required']
  },
  village: {
    type: String,
    required: false
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },

  workingHours: {
    sunday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    monday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    tuesday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    wednesday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    thursday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    },
    friday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: true }
    },
    saturday: {
      open: String,
      close: String,
      closed: { type: Boolean, default: false }
    }
  },
  role: {
    type: String,
    enum: ['vet'],
    default: 'vet'
  },

  profileImage: {
    type: String,
    default: ''
  },
  
  payments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  totalPaid: {
    type: Number,
    default: 0 // In cents
  },
  doctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }],

  temporaryCareSettings: {
    providesTemporaryCare: {
      type: Boolean,
      default: false
    },
    maxPetsCapacity: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value'
      }
    },
    dailyRatePerPet: {  // Cost per day per pet
      type: Number,
      default: 0,
      min: 0
    },
    description: String,
    facilities: [String] // e.g., ["large kennels", "outdoor space", "24/7 monitoring"]
  },
  
 currentTemporaryPets: [{
  petId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet' 
  },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'rejected'],
    default: 'pending'
  },
  ownerNotes: String,
  specialRequirements: [String],
  dailyRate: Number,
  totalCost: Number,
  requestId: {  // Reference to the VetTemporaryCare document
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VetTemporaryCare'
  }
}],
  createdAt: {
    type: Date,
    default: Date.now
  }
});



// Add to clinicSchema
clinicSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Add token generation method
clinicSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      userId: this._id, 
      role: 'clinic',
      clinicName: this.clinicName 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

clinicSchema.methods.addPayment = async function(paymentId) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');
  
  this.payments.push(paymentId);
  this.totalPaid += payment.amount;
  
  return this.save();
};


const Clinic = mongoose.model('Clinic', clinicSchema);

module.exports = Clinic;

