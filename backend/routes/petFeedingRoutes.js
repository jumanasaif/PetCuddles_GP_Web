// routes/petFeedingRoutes.js
const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const notificationController = require('../controllers/notificationController');

// Set feeding schedule
router.put('/:petId/feeding-schedule', async (req, res) => {
    try {
      const pet = await Pet.findById(req.params.petId);
      if (!pet) return res.status(404).json({ error: 'Pet not found' });
  
      // Merge new data with existing schedule
      pet.feedingSchedule = {
        ...pet.feedingSchedule,
        ...req.body,
        mealTimes: req.body.mealTimes || pet.feedingSchedule?.mealTimes || []
      };
  
      await pet.save();
      res.json({ pet });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Log feeding
router.post('/:petId/log-feeding', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId).populate('owner_id', 'fullName email phone ');
    

    if (!pet) return res.status(404).json({ error: 'Pet not found' });

    pet.feedingHistory.push(req.body);
    await pet.save();
    if(req.body.status ==='skipped'){
       const notification = await notificationController.createNotification(
          pet.owner_id._id,
          `⚠️ You missed a scheduled feeding for ${pet.name} today.
           Please make sure to feed your pet as soon as possible .`,
          `/pet-profile/${pet._id}`,
          'system',
         req.app.get('wss')              
      );
    }

    res.json(pet);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error);
  }
});

// Toggle reminders
router.put('/:petId/toggle-reminders', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId);
    if (!pet) return res.status(404).json({ error: 'Pet not found' });

    pet.feedingSchedule.remindersEnabled = req.body.enabled;
    await pet.save();

    res.json(pet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get feeding history
router.get('/:petId/feeding-history', async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId);
    if (!pet) return res.status(404).json({ error: 'Pet not found' });

    // Get last 7 days of history
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const history = pet.feedingHistory.filter(entry => 
      new Date(entry.date) >= sevenDaysAgo
    );

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
