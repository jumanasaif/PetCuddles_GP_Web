// models/SheepBreed.js
const mongoose = require('mongoose');

const sheepBreedSchema = new mongoose.Schema({
  breed: { type: String, required: true, unique: true },
  image: { type: String, required: true }
});

module.exports = mongoose.model('SheepBreed', sheepBreedSchema);