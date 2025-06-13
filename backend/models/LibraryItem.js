const mongoose = require('mongoose');

const libraryItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['article', 'video', 'interactive'],
    required: true 
  },
  // For articles
  articleContent: { type: String },
  articleFile: { type: String },
  // For videos
  videoUrl: { type: String },
  videoFile: { type: String },
  duration: { type: Number }, // In minutes
  // For interactive components
  interactiveTool: { type: mongoose.Schema.Types.Mixed },
  // Common fields
  categories: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LibraryCategory' 
  }],
  petTypes: [{ 
    type: String, 
    enum: ['dog', 'cat', 'bird', 'rabbit', 'cow', 'sheep'] 
  }],
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'] 
  },
  thumbnail: { type: String },
  images: [{ type: String }], // For additional images in articles
  author: { type: String },
  views: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add a virtual property for content based on type
libraryItemSchema.virtual('content').get(function() {
  if (this.type === 'article') {
    return this.articleContent || this.articleFile;
  } else if (this.type === 'video') {
    return this.videoUrl || this.videoFile;
  }
  return this.interactiveTool;
});

module.exports = mongoose.model('LibraryItem', libraryItemSchema);