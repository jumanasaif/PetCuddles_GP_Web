// routes/postAdoptionOptions.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Pet = require('../models/Pet');
const Adoption = require('../models/Adoption');
const VetTemporaryCare = require('../models/VetTemporaryCare');

// Get options after temporary adoption ends
router.get('/:petId/options', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId);
    
    if (!pet || pet.owner_id.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Pet not found or not owned by you' });
    }

    res.json({
      pet: {
        _id: pet._id,
        name: pet.name,
        img_url: pet.img_url
      },
      options: [
        {
          id: 'readopt',
          title: 'Put up for adoption again',
          description: 'List your pet for adoption (temporary or permanent)'
        },
        {
          id: 'vet',
          title: 'Find a vet for temporary care',
          description: 'Locate veterinary clinics that provide boarding services'
        },
        {
          id: 'keep',
          title: 'Keep pet with you',
          description: 'End the adoption process and keep your pet'
        }
      ]
    });
  } catch (error) {
    console.error('Error getting post-adoption options:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Owner chooses to put pet up for adoption again
router.post('/:petId/readopt', authMiddleware, async (req, res) => {
  try {
    const { adoptionType, startDate, endDate, deliveryPlace, aboutPet, questions } = req.body;
    const petId = req.params.petId;

    const pet = await Pet.findById(petId);
    if (!pet || pet.owner_id.toString() !== req.user.userId) {
      return res.status(404).json({ message: 'Pet not found or not owned by you' });
    }

    // Create new adoption record
    const adoption = new Adoption({
      pet_id: petId,
      current_owner_id: req.user.userId,
      adoption_type: adoptionType,
      start_date: adoptionType === 'temporary' ? new Date(startDate) : undefined,
      end_date: adoptionType === 'temporary' ? new Date(endDate) : undefined,
      delivery_place: deliveryPlace,
      aboutPet: aboutPet,
      questions: questions,
      status: 'notadopted'
    });

    await adoption.save();

    // Update pet status
    pet.adoption_status = 'available';
    await pet.save();

    res.json({
      message: 'Pet successfully listed for adoption',
      adoption
    });
  } catch (error) {
    console.error('Error re-listing pet for adoption:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Owner chooses vet temporary care
router.post('/:petId/vet-care', authMiddleware, async (req, res) => {
  try {
    // This will redirect to the vet temporary care request flow
    // The actual implementation would be similar to the vet temporary care request route above
    res.json({
      redirect: `/vet-temporary-care/request?petId=${req.params.petId}`
    });
  } catch (error) {
    console.error('Error initiating vet care process:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
