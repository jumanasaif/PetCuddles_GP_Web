const mongoose = require('mongoose');

const adoptionSchema = new mongoose.Schema({
  pet_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet', 
    required: true 
  },
  current_owner_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  adopter_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false // Optional field
  },
  adoption_type: { 
    type: String, 
    enum: ['lifetime', 'temporary'], 
    required: true ,
    default:'lifetime'
  },
  start_date: { 
    type: Date, 
    required: function() { return this.adoption_type === 'temporary'; } 
  },
  end_date: { 
    type: Date, 
    required: function() { return this.adoption_type === 'temporary'; } 
  },
  delivery_place: { 
    type: String, 
    required: true 
  },
  aboutPet: { 
    type: String, 
    required: false 
  },
  status: {
    type: String,
    enum: ['adopted', 'notadopted'],
    default: 'notadopted'
},
questions: {
  type: [String],
  required: false, 
},

  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Adoption', adoptionSchema);
