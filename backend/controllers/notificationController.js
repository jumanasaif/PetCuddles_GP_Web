// notificationController.js
const Notification = require('../models/Notifications');
const WebSocket = require("ws");

exports.createNotification = async (userId, message, link = null, type = 'system', wss, severity = null, petId = null,alertId= null) => {
  try {
    const notification = new Notification({
      userId,
      message,
      link,
      type,
      severity,
      petId,
      alertId
    });

    await notification.save();

    if (wss) {
      wss.clients.forEach((client) => {
        if (client.userId === userId.toString() && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "notification",
            data: notification
          }));
        }
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};




exports.getUserNotifications = async (userId) => {
  try {
    return await Notification.find({ userId })
      .sort({ createdAt: -1 })
      
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

exports.markAsRead = async (notificationId) => {
  try {
    return await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};
