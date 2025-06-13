
// models/UserBookmark.js
const mongoose = require('mongoose');
const userBookmarkSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  itemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LibraryItem', 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserBookmark', userBookmarkSchema);