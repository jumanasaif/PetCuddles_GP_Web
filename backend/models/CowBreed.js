const mongoose = require('mongoose');

const cowBreedSchema = new mongoose.Schema({
  breed: { type: String, required: true, unique: true },
  image: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["dairy", "beef", "dual", "heritage", "tropical", "other"],
    required: true 
  }
});

module.exports = mongoose.model('CowBreed', cowBreedSchema);
