// backend/controllers/healthRecord.js
const Pet = require('../models/Pet');

exports.addHealthRecord = async (req, res) => {
  try {
    const { petId } = req.params;
    const { type, title, description, notes, data } = req.body;
    const files = req.files || [];

     // Get user ID from the authenticated user
    const userId = req.user.id; // Make sure your auth middleware sets req.user

    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    const imageUrls = files.map(file => `/uploads/health_records/${file.filename}`);

    const newRecord = {
      type,
      title,
      description,
      notes,
      images: imageUrls,
      data,
      createdBy: userId // Use the authenticated user's ID
    };

    pet.healthRecords.push(newRecord);
    await pet.save();

    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error adding health record:', error);
    res.status(500).json({ 
      error: 'Failed to add health record',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


exports.getHealthRecords = async (req, res) => {
  try {
    const { petId } = req.params;
    const pet = await Pet.findById(petId)
      .populate('healthRecords.createdBy', 'name email')
      .populate('vaccinations.vet', 'name')
      .populate('vaccinations.clinic', 'clinicName');
    
    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // Convert pet vaccinations to health record format
    const vaccinationRecords = pet.vaccinations.map(vacc => ({
      _id: vacc._id,
      type: 'vaccination',
      title: `${vacc.name} Vaccination`,
      date: vacc.date,
      data: {
        name: vacc.name,
        type: vacc.type,
        date: vacc.date,
        nextDue: vacc.nextDue,
        doseNumber: vacc.doseNumber,
        totalDoses: vacc.totalDoses,
        clinic: vacc.clinic?.clinicName,
        vet: vacc.vet?.name,
        notes: vacc.notes
      },
      createdBy: null // Vaccinations don't have createdBy in your schema
    }));

    // Convert health records to proper format
    const healthRecords = pet.healthRecords.map(record => ({
      ...record.toObject(),
      type: record.type || 'vet_visit' // Use existing type if available
    }));

    // Combine both arrays
    const allRecords = [...vaccinationRecords, ...healthRecords];

    // Sort by date (newest first)
    allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(allRecords);
  } catch (error) {
    console.error('Error fetching health records:', error);
    res.status(500).json({ error: 'Failed to fetch health records' });
  }
};


