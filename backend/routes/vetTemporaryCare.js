// routes/vetTemporaryCare.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Clinic = require('../models/Clinic');
const Pet = require('../models/Pet');
const VetTemporaryCare = require('../models/VetTemporaryCare');
const notificationController = require('../controllers/notificationController');
const { setupDailyExpirationChecker } = require('../utils/adoptionExpiryChecker');

// Vet updates their temporary care settings
router.put('/settings', authMiddleware, async (req, res) => {
  try {
    
    const { providesTemporaryCare, maxPetsCapacity, dailyRatePerPet, description, facilities } = req.body;

    const updatedClinic = await Clinic.findByIdAndUpdate(
      req.user.userId,
      { 
        'temporaryCareSettings.providesTemporaryCare': providesTemporaryCare,
        'temporaryCareSettings.maxPetsCapacity': maxPetsCapacity,
        'temporaryCareSettings.dailyRatePerPet': dailyRatePerPet,
        'temporaryCareSettings.description': description,
        'temporaryCareSettings.facilities': facilities
      },
      { new: true }
    );

    res.json({
      message: 'Temporary care settings updated successfully',
      settings: updatedClinic.temporaryCareSettings
    });
  } catch (error) {
    console.error('Error updating vet temporary care settings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available vets for temporary care
router.get('/available-vets', authMiddleware, async (req, res) => {
  try {
    const vets = await Clinic.aggregate([
      {
        $match: {
          'temporaryCareSettings.providesTemporaryCare': true
        }
      },
      {
        $addFields: {
          activePetsCount: {
            $size: {
              $filter: {
                input: { $ifNull: ['$currentTemporaryPets', []] },
                as: 'pet',
                cond: { $eq: ['$$pet.status', 'active'] }
              }
            }
          }
        }
      },
      {
        $match: {
          $expr: {
            $lt: ['$activePetsCount', '$temporaryCareSettings.maxPetsCapacity']
          }
        }
      },
      {
        $project: {
          clinicName: 1,
          city: 1,
          village: 1,
          coordinates: 1,
          profileImage: 1,
          temporaryCareSettings: 1
        }
      }
    ]);

    res.json(vets);
  } catch (error) {
    console.error('Error fetching available vets:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Owner requests vet temporary care
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { petId, vetId, startDate, endDate, reason, specialRequirements, ownerNotes } = req.body;

    // Validate pet exists and belongs to owner
    const pet = await Pet.findById(petId);
    if (!pet || pet.owner_id.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Pet not found or not owned by you' });
    }

    // Validate vet exists and accepts temporary care
    const vet = await Clinic.findById(vetId);
    if (!vet || !vet.temporaryCareSettings.providesTemporaryCare) {
      return res.status(404).json({ message: 'Vet not found or does not provide temporary care' });
    }

    // Ensure currentTemporaryPets is initialized
    if (!Array.isArray(vet.currentTemporaryPets)) {
      vet.currentTemporaryPets = [];
    }

    // Check vet capacity (active pets only)
    const activePets = vet.currentTemporaryPets.filter(p => p.status === 'active').length;
    if (activePets >= vet.temporaryCareSettings.maxPetsCapacity) {
      return res.status(400).json({ message: 'This vet is currently at full capacity' });
    }

    // Calculate dates and cost
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const dailyRate = vet.temporaryCareSettings.dailyRatePerPet;
    const totalCost = days * dailyRate;

    // Create the request
    const request = new VetTemporaryCare({
      petId,
      ownerId: req.user.userId,
      vetId,
      startDate: start,
      endDate: end,
      reason,
      specialRequirements,
      dailyRate,
      totalCost,
      ownerNotes,
      status: 'pending'
    });

    await request.save();

    // Add this pet to the vet's currentTemporaryPets
    vet.currentTemporaryPets.push({
      petId,
      startDate: start,
      endDate: end,
      status: 'pending',
      ownerNotes,
      specialRequirements,
      dailyRate,
      totalCost
    });

    await vet.save();

    // Notify the vet
    const notification = await notificationController.createNotification(
      vetId,
      `New temporary care request for ${pet.name}`,
      `/clinic/temporary-care/requests/${request._id}`,
      'system',
      req.app.get('wss')
    );

    res.status(201).json({
      message: 'Temporary care request submitted successfully',
      request,
      notification
    });
  } catch (error) {
    console.error('Error creating temporary care request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Vet gets their temporary care requests
router.get('/vet/requests', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Only vets can access this endpoint' });
    }

    const requests = await VetTemporaryCare.find({ vetId: req.user.userId })
      .populate('petId', 'name species breed img_url')
      .populate('ownerId', 'fullName phone')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching vet temporary care requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single temporary care request by ID
router.get('/requests/:id', authMiddleware, async (req, res) => {
  try {
    const request = await VetTemporaryCare.findById(req.params.id)
      .populate('petId', 'name species breed img_url age weight health_status')
      .populate('ownerId', 'fullName phone email')
      .populate('vetId', 'clinicName city village profileImage phone');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify the requesting user is either the vet or the owner
    const isVet = req.user.role === 'clinic' && request.vetId._id.toString() === req.user.userId;
    const isOwner = req.user.role === 'pet_owner' && request.ownerId._id.toString() === req.user.userId;

    if (!isVet && !isOwner) {
      return res.status(403).json({ message: 'Unauthorized to view this request' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching temporary care request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Vet responds to temporary care request
router.put('/vet/requests/:id/respond', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Only vets can perform this action' });
    }

    const { status, responseMessage } = req.body;
    const requestId = req.params.id;

    // Find and update request
    const request = await VetTemporaryCare.findByIdAndUpdate(
      requestId,
      { 
        status,
        vetResponse: responseMessage 
      },
      { new: true }
    ).populate('petId ownerId');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update vet's current temporary pets list
    const vet = await Clinic.findById(req.user.userId);
    const petRequest = vet.currentTemporaryPets.find(p => p.petId.toString() === request.petId._id.toString());
    
    if (petRequest) {
      if (status === 'approved'){
        petRequest.status = 'active';
      }
      else {
        petRequest.status = status;
      }
     await vet.save();
    }

    // Send notification to owner
    const notificationMessage = status === 'approved' 
      ? `Your temporary care request for ${request.petId.name} has been approved by ${vet.clinicName}`
      : `Your temporary care request for ${request.petId.name} has been declined by ${vet.clinicName}`;

    const notification = await notificationController.createNotification(
      request.ownerId._id,
      notificationMessage,
      `/pets/${request.petId._id}`,
      'adoption',
      req.app.get('wss')
    );

    // If approved, update pet status
    if (status === 'approved') {
      await Pet.findByIdAndUpdate(request.petId._id, {
        adoption_status: 'temporarilyAdopted',
        temporaryCaretaker: {
          userId: vet._id,
          startDate: request.startDate,
          endDate: request.endDate,
          status: 'active'
        }
      });

      // Schedule expiration check
      await setupDailyExpirationChecker(request.petId._id, request.endDate);
    }

    res.json({
      message: `Request ${status} successfully`,
      request,
      notification
    });
  } catch (error) {
    console.error('Error responding to temporary care request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a temporary care request
router.delete('/requests/:id', authMiddleware, async (req, res) => {
  try {
    const request = await VetTemporaryCare.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only vet or owner can delete (pending requests only)
    const isVet = req.user.role === 'clinic' && request.vetId.toString() === req.user.userId;
    const isOwner = req.user.role === 'pet_owner' && request.ownerId.toString() === req.user.userId;
    
    if (!isVet && !isOwner) {
      return res.status(403).json({ message: 'Unauthorized to delete this request' });
    }

    // Only allow deletion of pending requests
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be deleted' });
    }

    await VetTemporaryCare.findByIdAndDelete(req.params.id);
    
    // If vet is deleting, remove from their currentTemporaryPets array
    if (isVet) {
      await Clinic.findByIdAndUpdate(
        req.user.userId,
        { $pull: { currentTemporaryPets: { petId: request.petId } } }
      );
    }

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting temporary care request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get request counts for vet dashboard
router.get('/vet/requests/count', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Only vets can access this endpoint' });
    }

    const counts = await VetTemporaryCare.aggregate([
      { $match: { vetId: mongoose.Types.ObjectId(req.user.userId) } },
      { $group: { 
        _id: '$status',
        count: { $sum: 1 }
      }}
    ]);

    res.json(counts);
  } catch (error) {
    console.error('Error fetching request counts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Owner gets their temporary care requests
router.get('/owner/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await VetTemporaryCare.find({ ownerId: req.user.userId })
      .populate('petId', 'name species breed img_url')
      .populate('vetId', 'clinicName city profileImage')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching owner temporary care requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// In your vetTemporaryCare.js routes
router.get('/vet/availability/:clinicId', authMiddleware, async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.clinicId)
      .select('temporaryCareSettings currentTemporaryPets');
    
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    const activePets = clinic.currentTemporaryPets.filter(
      p => p.status === 'active'
    ).length;

    const availableSlots = Math.max(
      0,
      clinic.temporaryCareSettings.maxPetsCapacity - activePets
    );

    res.json({
      available: availableSlots > 0,
      availableSlots,
      dailyRate: clinic.temporaryCareSettings.dailyRatePerPet
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add to your vetTemporaryCare.js routes
router.put('/requests/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    // Update the request status
    const request = await VetTemporaryCare.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Update the clinic's currentTemporaryPets array
    await Clinic.updateOne(
      { _id: request.vetId, 'currentTemporaryPets.requestId': request._id },
      { $set: { 'currentTemporaryPets.$.status': status } }
    );
    
    // If completing care, update the pet's status
    if (status === 'completed') {
      await Pet.findByIdAndUpdate(request.petId, {
        $unset: { temporaryCaretaker: 1 },
        adoption_status: 'available'
      });
    }
    
    res.json({ message: 'Status updated successfully', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



module.exports = router;