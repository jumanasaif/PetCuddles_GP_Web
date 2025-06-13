const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const authMiddleware = require('../middleware/authMiddleware');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Clinic = require('../models/Clinic');
const Shop = require('../models/Shop');
const Admin = require('../models/Admin');

// Get all chats for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userModel = req.user.role === 'vet' ? 'Clinic' : 
                     req.user.role === 'shop' ? 'Shop' :
                     req.user.role === 'admin' ? 'Admin' :
                     'User';

    const chats = await Chat.find({
      'participants.id': req.user.userId
    })
    .sort('-lastMessageAt')
    .populate({
      path: 'participants.id',
      select: 'fullName clinicName shopName profileImage', // Select only needed fields
    })
    .populate('messages.senderId', 'fullName clinicName shopName profileImage');

    // Enhance chat data with participant details
    const enhancedChats = await Promise.all(chats.map(async chat => {
      // Find the other participant (not the current user)
      const otherParticipant = chat.participants.find(p => 
        p.id.toString() !== req.user.userId.toString()
      );
      
      if (!otherParticipant) {
        console.error('Could not find other participant in chat:', chat._id);
        return null;
      }

      return {
        ...chat.toObject(),
        participant: otherParticipant.id, // Already populated
        unreadCount: chat.messages.filter(m => 
          !m.read && m.senderId.toString() !== req.user.userId.toString()
        ).length
      };
    }));

    res.json(enhancedChats.filter(chat => chat !== null));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get unread message count for current user
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(400).json({ message: 'User ID missing' });
    }

    const userId = req.user.userId;
    
    // Alternative aggregation query that might be more reliable
    const ObjectId = mongoose.Types.ObjectId;

const result = await Chat.aggregate([
  { $match: { 'participants.id': new ObjectId(userId) } },
  { $project: {
    unreadCount: {
      $size: {
        $filter: {
          input: "$messages",
          as: "msg",
          cond: {
            $and: [
              { $eq: ["$$msg.read", false] },
              { $ne: ["$$msg.senderId", new ObjectId(userId)] }
            ]
          }
        }
      }
    }
  }},
  { $group: {
    _id: null,
    totalUnread: { $sum: "$unreadCount" }
  }}
]);


    const unreadCount = result[0]?.totalUnread || 0;
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error in unread-count:', error);
    res.status(500).json({ 
      message: 'Error fetching unread count',
      error: error.message 
    });
  }
});

// Get specific chat messages
router.get('/:chatId', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.chatId)) {
      return res.status(400).json({ message: 'Invalid chat ID format' });
    }
    
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      'participants.id': req.user.userId
    }).populate('messages.senderId');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Mark messages as read
    const unreadMessages = chat.messages.filter(m => 
      !m.read && !m.senderId.equals(req.user.userId)
      .map(m => m._id));

    if (unreadMessages.length > 0) {
      await Chat.updateOne(
        { _id: req.params.chatId },
        { $set: { 'messages.$[elem].read': true } },
        { arrayFilters: [{ 'elem._id': { $in: unreadMessages } }] }
      );
    }

    res.json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Start a new chat or get existing one (updated to handle admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { recipientId, recipientType } = req.body;
    const userModel = req.user.role === 'vet' ? 'Clinic' : 
                     req.user.role === 'shop' ? 'Shop' : 
                     req.user.role === 'doctor' ? 'Doctor' :
                     req.user.role === 'admin' ? 'Admin' :
                     'User';

    // Validate recipientType
    if (!['User', 'Clinic', 'Shop', 'Admin','Doctor'].includes(recipientType)) {
      return res.status(400).json({ message: 'Invalid recipient type' });
    }

    // Check if chat already exists between these two participants
    const existingChat = await Chat.findOne({
      $and: [
        { 'participants.id': req.user.userId, 'participants.model': userModel },
        { 'participants.id': recipientId, 'participants.model': recipientType }
      ]
    }).populate('participants.id');

    if (existingChat) {
      return res.json({
        ...existingChat.toObject(),
        participant: existingChat.participants.find(p => 
          p.id._id.toString() !== req.user.userId.toString()
        ).id
      });
    }

    // Create new chat if none exists
    const newChat = new Chat({
      participants: [
        { id: req.user.userId, model: userModel },
        { id: recipientId, model: recipientType }
      ],
      messages: []
    });

    await newChat.save();

    // Populate the participant info before sending back
    const populatedChat = await Chat.findById(newChat._id)
      .populate('participants.id', 'fullName clinicName shopName profileImage name');

    res.status(201).json({
      ...populatedChat.toObject(),
      participant: populatedChat.participants.find(p => 
        p.id._id.toString() !== req.user.userId.toString()
      ).id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});




module.exports = router;
