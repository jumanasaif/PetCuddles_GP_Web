const mongoose = require('mongoose');

const rabbitBreedSchema = new mongoose.Schema({
  breed: { type: String, required: true, unique: true },
  image: { type: String, required: true },
});

module.exports = mongoose.model('RabbitBreed', rabbitBreedSchema);