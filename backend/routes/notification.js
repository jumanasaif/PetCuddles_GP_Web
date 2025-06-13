const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');
const Notification = require('../models/Notifications');
const adminMiddleware = require('../middleware/adminMiddleware');


// Get all notifications for user
router.get('/', authMiddleware, async (req, res) => {
  try {
     if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Access forbidden' });
    }
    const notifications = await notificationController.getUserNotifications(req.user.userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// get adoption notification:

router.get('/adoption/:userId', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.params.userId,
      type: 'adoption',
      read: false
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching adoption notifications' });
  }
});




// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await notificationController.markAsRead(req.params.id);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// In notificationRoutes.js
router.patch('/mark-all-read', authMiddleware, async (req, res) => {
    try {
      await Notification.updateMany(
        { userId: req.user.userId, read: false },
        { $set: { read: true } }
      );
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });



// Get all notifications for the current clinic
router.get('/clinic/notifications', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    const notifications = await notificationController.getUserNotifications(req.user.userId);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.patch('/clinic/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await notificationController.markAsRead(req.params.id);
    
    if (!notification || notification.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Get all notifications for the current clinic
router.get('/shop/notifications', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    const notifications = await notificationController.getUserNotifications(req.user.userId);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.patch('/shop/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await notificationController.markAsRead(req.params.id);
    
    if (!notification || notification.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Get all notifications for the current clinic
router.get('/doctor/notifications', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    const notifications = await notificationController.getUserNotifications(req.user.userId);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Mark notification as read
router.patch('/doctor/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await notificationController.markAsRead(req.params.id);
    
    if (!notification || notification.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Get all notifications for the current clinic
router.get('/doctor/notifications', adminMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    const notifications = await notificationController.getUserNotifications(req.user.userId);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
