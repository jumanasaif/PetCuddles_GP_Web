const Pet = require('../models/Pet');
const Notification = require('../models/Notifications');
const notificationController = require("../controllers/notificationController");

// Get all extension requests for the current caretaker
exports.getExtensionRequests = async (req, res) => {
  try {
    const pets = await Pet.find({
      'temporaryCaretaker.userId': req.user.id,
      'extensionRequests': { $exists: true, $not: { $size: 0 } }
    })
    .populate('owner_id')
    .populate('extensionRequests.caretaker_id');

    const requests = pets.flatMap(pet => 
      pet.extensionRequests.map(req => ({
        _id: req._id,
        pet_id: { _id: pet._id, name: pet.name },
        caretaker_id: req.caretaker_id,
        currentStartDate: pet.temporaryCaretaker.startDate,
        currentEndDate: pet.temporaryCaretaker.endDate,
        requestedEndDate: req.requestedEndDate,
        requestedAt: req.requestedAt
      }))
    );

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

