// Updated petSchema in models/Pet.js
const mongoose = require('mongoose');

const weightRecordSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  weight: { type: Number, required: true },
  notes: { type: String }
});

const feedingScheduleSchema = new mongoose.Schema({
  mealsPerDay: { type: Number, required: true },
  mealTimes: [{ 
    time: { type: String, required: true }, // Format: "HH:MM"
    calories: { type: Number, required: true },
    foodType: { type: String },
    portionSize: { type: String }
  }],
  remindersEnabled: { type: Boolean, default: true },
  lastNotificationSent: { type: Date }
});

const feedingHistorySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  mealTime: { type: String },
  status: { type: String, enum: ['given', 'skipped','pending'], required: true },
  notes: { type: String }
});

const nutritionAnalysisSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  calories: Number,
  idealWeightRange: String,
  foodRecommendation: String,
  warning: {
    title: String,
    message: String,
    calories: Number
  },
  petType: String,
  breedData: mongoose.Schema.Types.Mixed
});

const vaccinationRecordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  nextDue: Date,
  doseNumber: { type: Number, required: true },
  totalDoses: { type: Number, required: true },
  clinic: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  vet: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  notes: String
});


const healthRecordSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: { 
    type: String, 
    enum: ['skin_detection', 'vet_visit', 'vaccination', 'medication', 'other'],
    required: true 
  },
  title: { type: String, required: true },
  description: String,
  images: [String],
  notes: String,
  data: mongoose.Schema.Types.Mixed, // For storing structured data like skin detection results
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const petSchema = new mongoose.Schema({
  owner_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { type: String, required: true },
  species: { 
    type: String, 
    enum: ['dog', 'cat', 'bird', 'rabbit','cow','sheep'], 
    required: true 
  },
  breed: { type: String, required: false },
  birth_date: { type: Date, required: false },
  age: { type: Number, required: false },
  weight: { type: Number, required: false },
  weight_history: [weightRecordSchema],
  feedingSchedule: feedingScheduleSchema,
  feedingHistory: [feedingHistorySchema],
  nutritionAnalysis: [nutritionAnalysisSchema],
  gender: { 
    type: String, 
    enum: ['male', 'female'], 
    required: true 
  },
  health_status: { type: String, required: false },
  img_url: { type: String, required: false },
  qrCodeUrl: { type: String },
  adoption_status: { 
    type: String, 
    enum: ['available', 'notAvailable', 'adopted','temporarilyAdopted'],
    default: 'notAvailable'
  },
  temporaryCaretaker: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: Date,
    endDate: Date,
    status: { 
      type: String, 
      enum: ["active", "completed", "canceled", "pending"],
      default: "pending"
    }
  },
  extensionRequests: [{
    caretaker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status:{
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
     default: "pending"
    },
    requestedEndDate: Date,
    requestedAt: { type: Date, default: Date.now }
  }],
  healthRecords: [healthRecordSchema],
 vaccinations: [vaccinationRecordSchema],

  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pet', petSchema);