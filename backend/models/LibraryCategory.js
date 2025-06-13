// models/LibraryCategory.js
const mongoose = require('mongoose');

const libraryCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  icon: String,
  color: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LibraryCategory', libraryCategorySchema);



