// models/PetBehaviorLog.js
const mongoose = require('mongoose');

const behaviorObservationSchema = new mongoose.Schema({
  pet_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet', 
    required: [true, 'Pet ID is required'] 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required'] 
  },
  behavior_pattern_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BehaviorPattern',
    validate: {
      validator: function(v) {
        // Either behavior_pattern_id or custom_behavior must be present
        return !!v || !!this.custom_behavior;
      },
      message: 'Either behavior pattern or custom behavior is required'
    }
  },
  custom_behavior: {
    type: String,
    validate: {
      validator: function(v) {
        // Either behavior_pattern_id or custom_behavior must be present
        return !!v || !!this.behavior_pattern_id;
      },
      message: 'Either behavior pattern or custom behavior is required'
    }
  },
  date_observed: { type: Date, default: Date.now },
  frequency: { 
    type: String, 
    enum: ['once', 'daily', 'weekly', 'constantly'] 
  },
  intensity: { type: Number, min: 1, max: 5 },
  duration_minutes: Number,
  triggers: [String],
  environment: {
    location: String,
    time_of_day: String,
    people_present: Number,
    other_pets_present: Boolean
  },
  video_evidence: String, // URL to uploaded video
  notes: String,
 solutions_tried: [{
    solution: { type: String, required: true },
    is_suggested: { type: Boolean, default: true },
    tried_date: { type: Date, default: Date.now },
    helped_resolve: { type: Boolean },
    effectiveness: { type: Number, min: 0, max: 100 }, // Percentage
    notes: String,
    steps_followed: [String]
  }],
  status: { 
    type: String, 
    enum: ['active', 'resolved', 'escalated'], 
    default: 'active' 
  },
  vet_consulted: Boolean,
  follow_up_date: Date
});

module.exports = mongoose.model('PetBehaviorLog', behaviorObservationSchema);
