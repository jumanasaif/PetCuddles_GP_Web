const mongoose = require('mongoose');

const lostPetSchema = new mongoose.Schema({
    pet_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Pet',  // Reference to the Pet model
        required: true 
    },
    owner_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',  // Reference to the User model
        required: true 
    },
    last_seen_location: { 
        type: String, 
        required: true 
    },
    last_seen_date: { 
        type: Date, 
        required: true 
    },
    last_seen_time: { 
        type: String, 
        required: false 
    },
    distinctive_features: { 
        type: String, 
        required: false 
    },
    status: { 
        type: String, 
        enum: ['lost', 'found', 'reunited'], 
        default: 'lost', 
        required: true 
    },
    date_reported: { 
        type: Date, 
        default: Date.now, 
        required: true 
    },
    reward: { 
        type: Number, 
        required: false 
    },
    additional_details: { 
        type: String, 
        required: false 
    },
    postId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post',
        required: true 
    }
});

module.exports = mongoose.model('LostPet', lostPetSchema);