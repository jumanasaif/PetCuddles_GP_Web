const express = require("express");
const router = express.Router();
const AdoptionRequest = require("../models/AdoptionRequest");
const Pet = require("../models/Pet");
const Adoption = require("../models/Adoption");
const authMiddleware = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");
const { scheduleExpirationCheck } = require('../utils/adoptionExpiryChecker');

router.patch('/requests/:id/approve', authMiddleware, async (req, res) => {
    try {
      const requestId = req.params.id;
      const { requesterID } = req.body;
      
      // 1. Find and update the adoption request
      const request = await AdoptionRequest.findByIdAndUpdate(
        requestId,
        { status: 'approved' },
        { new: true }
      )
      .populate('pet_id')
      .populate('requester_id')
      .populate('owner_id');
  
      if (!request) {
        return res.status(404).json({ message: 'Adoption request not found' });
      }

    
      const notification = await notificationController.createNotification(
        requesterID,
        `Your request to adopt ${request.pet_id.name} has been accepted successfully !.`,
        '/adoption/requests',
        'adoption'
      );
  
      // Send real-time notification
      req.app.get("sendNotification")(requesterID, notification.message);
  
      
      // 2. Validate required fields
      
    // Set default adoption_type if missing
    request.adoption_type = request.adoption_type || 'lifetime';
    request.status = 'approved';
    await request.save();

    // Update pet
    const petUpdates = {
      adoption_status: 'adopted',
      ...(request.adoption_type === 'lifetime' && {
        owner_id: request.requester_id._id
      })
    };
  
 
  
      // 4. Update pet
      const updatedPet = await Pet.findByIdAndUpdate(
        request.pet_id._id,
        petUpdates,
        { new: true }
      );
  
      if (!updatedPet) {
        throw new Error('Failed to update pet information');
      }
  
     // 5. Find and delete existing adoption record 

      await Adoption.deleteOne({ pet_id: request.pet_id._id });
      
  
      res.json({
        message: 'Adoption approved successfully',
        request,
        pet: updatedPet,
        ownershipTransferred: request.adoption_type === 'lifetime'
      });
  
    } catch (error) {
      console.error('Error approving adoption:', error);
      res.status(500).json({
        message: 'Failed to approve adoption',
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    }
});


// Approve temporary:
router.patch('/requests/:id/approve-temporary', authMiddleware, async (req, res) => {
  try {
    const requestId = req.params.id;
    
    // 1. Find the adoption request
    const request = await AdoptionRequest.findById(requestId)
      .populate('pet_id')
      .populate('requester_id')
      .populate('owner_id');

    if (!request) {
      return res.status(404).json({ message: 'Adoption request not found' });
    }

    // 2. Find the related adoption record
    const adoptionRecord = await Adoption.findOne({ 
      pet_id: request.pet_id._id,
      current_owner_id: request.owner_id._id
    });

    if (!adoptionRecord || !adoptionRecord.start_date || !adoptionRecord.end_date) {
      return res.status(400).json({ 
        message: 'Original adoption record missing or incomplete' 
      });
    }

    // Format dates for notifications
    const formattedStartDate = adoptionRecord.start_date.toLocaleDateString();
    const formattedEndDate = adoptionRecord.end_date.toLocaleDateString();

    // 3. Update pet with temporary caretaker information
    const updatedPet = await Pet.findByIdAndUpdate(
      request.pet_id._id,
      {
        adoption_status: 'temporarilyAdopted',
        temporaryCaretaker: {
          userId: request.requester_id._id,
          startDate: adoptionRecord.start_date,
          endDate: adoptionRecord.end_date,
          status: 'active'
        }
      },
      { new: true }
    );
    
    // 4. Send notifications
    const ownerNotification = await notificationController.createNotification(
      request.owner_id._id,
      `Your pet ${updatedPet.name} has been temporarily adopted by ${request.requester_id.fullName} until ${formattedEndDate}.`,
      '/my-pets',
      'adoption'
    );

    const caretakerNotification = await notificationController.createNotification(
      request.requester_id._id,
      `Your temporary adoption of ${updatedPet.name} has been approved. Care period: ${formattedStartDate} to ${formattedEndDate}.`,
      '/my-pets',
      'adoption'
    );

    // Send real-time notifications
    req.app.get("sendNotification")(request.owner_id._id, ownerNotification.message);
    req.app.get("sendNotification")(request.requester_id._id, caretakerNotification.message);

    // 5. Schedule automatic expiration check
    await scheduleExpirationCheck (updatedPet._id, adoptionRecord.end_date);

     // 6. Find and delete existing adoption record 

     await Adoption.deleteOne({ pet_id: request.pet_id._id });
    res.json({
      message: 'Temporary adoption approved successfully',
      pet: updatedPet,
      request
    });

  } catch (error) {
    console.error('Error approving temporary adoption:', error);
    res.status(500).json({
      message: 'Failed to approve temporary adoption',
      error: error.message
    });
  }
});



// Reject request :
router.patch('/requests/:id/reject', authMiddleware, async (req, res) => {
    try {
      const requestId = req.params.id;
      const { requesterID } = req.body;
  
      // 1. Find and update the adoption request
      const request = await AdoptionRequest.findByIdAndUpdate(
        requestId,
        { status: 'denied' },
        { new: true }
      )
      .populate('pet_id')
      .populate('requester_id')
      .populate('owner_id');
  
      if (!request) {
        return res.status(404).json({ message: 'Adoption request not found' });
      }
      
      // Create rejection notification
      const notification = await notificationController.createNotification(
        requesterID,
        `Your request to adopt ${request.pet_id.name} has been denied.`,
        '/adoption/requests',
        'adoption'
      );
  
      // Send real-time notification
      req.app.get("sendNotification")(requesterID, notification.message);
  
      res.json({
        message: 'Adoption request rejected successfully',
        request
      });
  
    } catch (error) {
      console.error('Error rejecting adoption:', error);
      res.status(500).json({
        message: 'Failed to reject adoption request',
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    }
  });
  


module.exports = router;