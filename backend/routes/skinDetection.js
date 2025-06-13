// backend/routes/skinDetection.js
const express = require('express');
const router = express.Router();
const skinDetectionController = require('../controllers/skinDetection');
const upload = require('../config/multer'); // Configure multer for file uploads

// POST /api/skin/analyze - Analyze pet skin condition
router.post('/predict', 
  upload.single('image'), // Handle single image upload
  skinDetectionController.analyzeSkin
);

// GET /api/skin/history/:petId - Get analysis history for a pet
router.get('/history/:petId', 
  skinDetectionController.getAnalysisHistory
);

// Add to your existing routes
router.post('/ask', 
  skinDetectionController.askQuestion
);

module.exports = router;