const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'senderModel' },
  senderModel: { type: String, required: true, enum: ['User', 'Clinic', 'Shop','Admin','Doctor'] },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

const chatSchema = new mongoose.Schema({
  participants: [{
    id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'participants.model' },
    model: { type: String, required: true, enum: ['User', 'Clinic', 'Shop','Admin','Doctor'] }
  }],
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now }
});

// Add indexes for faster querying
chatSchema.index({ 'participants.id': 1, 'participants.model': 1 });
chatSchema.index({ lastMessageAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;