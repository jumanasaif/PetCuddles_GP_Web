// routes/vaccinations.js
const express = require('express');
const router = express.Router();
const Vaccination = require('../models/Vaccination');
const authMiddleware = require('../middleware/authMiddleware');

// Get all vaccinations for a clinic
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { clinic } = req.query;
    const clinicId = clinic || req.user.userId; // Use query param or authenticated user's ID
    
    const vaccinations = await Vaccination.find({ vet: clinicId })
      .sort({ name: 1 });
    
    res.json(vaccinations);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching vaccinations', 
      error: error.message 
    });
  }
});

// Get single vaccination by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const vaccination = await Vaccination.findById(req.params.id);
    
    if (!vaccination) {
      return res.status(404).json({ message: 'Vaccination not found' });
    }
    
    // Verify the requesting user has access to this clinic's data
    if (vaccination.vet.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to vaccination record' });
    }
    
    res.json(vaccination);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching vaccination', 
      error: error.message 
    });
  }
});


// routes/vaccination.js
router.get('/by-name/:name', authMiddleware, async (req, res) => {
  try {
    const { name } = req.params;
    const clinicId = req.user.userId;
    const vaccination = await Vaccination.findOne({
      vet: clinicId,
      name: name // Exact match
    });

    if (!vaccination) {
      return res.status(404).json({ message: 'Vaccination not found' });
    }

    res.json(vaccination);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching vaccination', 
      error: error.message 
    });
  }
});

// Corrected pet owner route
router.get('/by-name/:name/:clinicId', authMiddleware, async (req, res) => {
  try {
    const { name, clinicId } = req.params; // Fixed destructuring
    const vaccination = await Vaccination.findOne({
      vet: clinicId,
      name: name // Exact match
    });

    if (!vaccination) {
      return res.status(404).json({ message: 'Vaccination not found' });
    }

    res.json(vaccination);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching vaccination', 
      error: error.message 
    });
  }
});


// Create a new vaccination (though typically created via service sync)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'clinic' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only clinics can create vaccinations' });
    }

    const vaccination = new Vaccination({
      ...req.body,
      vet: req.user.userId // Ensure the vet is set to the authenticated clinic
    });

    const savedVaccination = await vaccination.save();
    res.status(201).json(savedVaccination);
  } catch (error) {
    res.status(400).json({ 
      message: 'Error creating vaccination',
      error: error.message 
    });
  }
});


// Update a vaccination
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const vaccination = await Vaccination.findById(req.params.id);
    
    if (!vaccination) {
      return res.status(404).json({ message: 'Vaccination not found' });
    }
    
    // Verify ownership
    if (vaccination.vet.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to update this vaccination' });
    }

    const updatedVaccination = await Vaccination.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(updatedVaccination);
  } catch (error) {
    res.status(400).json({ 
      message: 'Error updating vaccination',
      error: error.message 
    });
  }
});

// Delete a vaccination
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const vaccination = await Vaccination.findById(req.params.id);
    
    if (!vaccination) {
      return res.status(404).json({ message: 'Vaccination not found' });
    }
    
    // Verify ownership
    if (vaccination.vet.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this vaccination' });
    }

    await Vaccination.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vaccination deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting vaccination',
      error: error.message 
    });
  }
});


module.exports = router;