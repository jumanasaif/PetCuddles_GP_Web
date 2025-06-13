const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Create event
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, time, location } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let organizerModel;
    switch(userRole) {
      case 'pet_owner': organizerModel = 'User'; break;
      case 'clinic': organizerModel = 'Clinic'; break;
      case 'vet': organizerModel = 'Clinic'; break;
      case 'doctor': organizerModel = 'Doctor'; break;
      case 'shop': organizerModel = 'Shop'; break;
      case 'admin': organizerModel = 'Admin'; break;
      default: organizerModel = 'User';
    }

    const newEvent = new Event({
      title,
      description,
      date,
      time,
      location,
      image: req.file ? `uploads/${req.file.filename}` : null,
      organizer: userId,
      organizerModel,
      attendees: []
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Error creating event' });
  }
});

// Get all events
router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find()
      .populate({
        path: 'organizer',
        select: 'fullName profileImage clinicName shopName',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'attendees.user',
        select: 'fullName profileImage',
        options: { strictPopulate: false }
      })
      .sort({ date: 1, time: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// Update attendance
router.put('/:eventId/attendance', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let userModel;
    switch(userRole) {
      case 'pet_owner': userModel = 'User'; break;
      case 'clinic': userModel = 'Clinic'; break;
      case 'vet': userModel = 'Clinic'; break;
      case 'doctor': userModel = 'Doctor'; break;
      case 'shop': userModel = 'Shop'; break;
      case 'admin': userModel = 'Admin'; break;
      default: userModel = 'User';
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Remove existing attendance if any
    event.attendees = event.attendees.filter(
      a => a.user.toString() !== userId || a.userModel !== userModel
    );

    // Add new attendance if not "not_interested"
    if (status !== 'not_interested') {
      event.attendees.push({
        user: userId,
        userModel,
        status
      });
    }

    await event.save();
    res.status(200).json(event);
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Error updating attendance' });
  }
});

// Delete event
router.delete('/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is organizer or admin
    const isOrganizer = event.organizer.toString() === userId && 
      event.organizerModel.toLowerCase() === userRole;
    
    if (!isOrganizer && userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(eventId);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event' });
  }
});

// Update event
router.put('/:eventId', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, date, time, location } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is organizer or admin
    const isOrganizer = event.organizer.toString() === userId && 
      event.organizerModel.toLowerCase() === userRole;
    
    if (!isOrganizer && userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    // Update event fields
    event.title = title;
    event.description = description;
    event.date = date;
    event.time = time;
    event.location = location;
    
    // Update image if new one was uploaded
    if (req.file) {
      event.image = `uploads/${req.file.filename}`;
    }

    const updatedEvent = await event.save();
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event' });
  }
});

module.exports = router;
