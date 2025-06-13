// routes/diseaseAlerts.js
const express = require('express');
const router = express.Router();
const DiseaseAlert = require('../models/DiseaseAlert');
const UserAlert = require('../models/UserAlert');
const User = require('../models/User');
const Pet = require('../models/Pet');
const Notification = require('../models/Notifications');
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Get active disease alerts for user's area
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const alerts = await DiseaseAlert.find({
      isActive: true,
      $or: [
        { 'regions.city': user.city },
        { 'regions.village': user.village }
      ]
    }).sort({ severity: -1, createdAt: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching disease alerts' });
  }
});

// Get user's disease alert notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const alerts = await UserAlert.find({
      userId: req.user.userId,
      alertModel: 'DiseaseAlert'
    })
      .populate('alertId')
      .populate('petId', 'name species')
      .sort({ receivedAt: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark disease alert as read
router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const alert = await UserAlert.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { read: true },
      { new: true }
    );

    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error updating alert status' });
  }
});

// Get details of a specific disease alert
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const alert = await DiseaseAlert.findById(req.params.id)
      .populate('triggeredByCases', 'pet_id prediction confidence createdAt')
      .populate({
        path: 'triggeredByCases',
        populate: {
          path: 'pet_id',
          select: 'name species'
        }
      });

    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alert details' });
  }
});

module.exports = router;