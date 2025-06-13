const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'userModel',
    required: true 
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Clinic', 'Shop', 'Doctor', 'Admin']
  },
  img_url: { type: String, required: false },
  video_url: { type: String, required: false },
  likes: [
    { 
      type: mongoose.Schema.Types.ObjectId, 
      refPath: 'likesModel',
      default: []
    }
  ],
  likesModel: {
    type: [String],
    enum: ['User', 'Clinic', 'Shop', 'Doctor', 'Admin'],
    default: []
  },
  comments: [
    {
      user: { 
        type: mongoose.Schema.Types.ObjectId, 
        refPath: 'comments.userModel',
        required: true 
      },
      userModel: {
        type: String,
        required: true,
        enum: ['User', 'Clinic', 'Shop', 'Doctor', 'Admin']
      },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  hashtags: [{ type: String, required: false }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
