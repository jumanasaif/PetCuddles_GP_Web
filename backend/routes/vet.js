const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const Clinic = require('../models/Clinic');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Service = require('../models/VetService');
const Appointments = require('../models/Appointments');
const AdoptionQuestion = require("../models/AdoptionQuestions");
const AdoptionRequest = require("../models/AdoptionRequest");
const notificationController = require("../controllers/notificationController");
const adoptionController = require('../controllers/AdoptionController');
const HealthRecord = require('../models/HealthRecord');
const FoundPet = require('../models/FoundPet');
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: 'uploads/doctors/' });
const LabTest = require ('../models/LabTest');
const Vaccination = require('../models/Vaccination');

const vetUpload = multer({ 
  dest: 'uploads/vet-profiles/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png) are allowed!'));
  }
});


// routes/vet.js
router.get('/public-clinics', async (req, res) => {
  try {
    const clinics = await Clinic.find({ isActive: true, isVerified: true })
      .select('clinicName city village coordinates profileImage temporaryCareSettings')
      .limit(50);
    res.json(clinics);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


const syncVaccinations = async (service) => {
  if (service.type !== 'vaccination') {
    // Remove any existing vaccination entries if service type changed
    await Vaccination.deleteMany({ service_id: service._id });
    return;
  }

  try {
    // Get current vaccinations for this service
    const existingVaccinations = await Vaccination.find({ service_id: service._id });
    
    // Process each sub-service
    for (const subService of service.subServices) {
      const existingVaccination = existingVaccinations.find(v => 
        v.sub_service_id.toString() === subService._id.toString()
      );

      if (existingVaccination) {
        // Update existing vaccination
        await Vaccination.findByIdAndUpdate(existingVaccination._id, {
          name: subService.name,
          baseCost: subService.baseCost,
          extraServices: subService.extraServices.map(extra => ({
            name: extra.name,
            cost: extra.cost
          })),
          updatedAt: Date.now()
        });
      } else {
        // Create new vaccination with default values
        await new Vaccination({
          vet: service.vet,
          service_id: service._id,
          sub_service_id: subService._id,
          name: subService.name,
          petTypes: ['dog', 'cat'], // Default values
          firstDoseAge: '6-8 weeks', // Default value
          protectsAgainst: 'Various diseases', // Default value
          doseCount: 1, // Default value
          doseInterval: '1 year', // Default value
          isRequired: true, // Default value
          baseCost: subService.baseCost,
          extraServices: subService.extraServices.map(extra => ({
            name: extra.name,
            cost: extra.cost
          }))
        }).save();
      }
    }

    // Remove vaccinations for sub-services that were deleted
    const currentSubServiceIds = service.subServices.map(s => s._id.toString());
    const vaccinationsToRemove = existingVaccinations.filter(v => 
      !currentSubServiceIds.includes(v.sub_service_id.toString())
    );

    for (const vaccination of vaccinationsToRemove) {
      await Vaccination.findByIdAndDelete(vaccination._id);
    }
  } catch (error) {
    console.error('Error syncing vaccinations:', error);
  }
};

//    Get Vet Profile :   //
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    const clinic = await Clinic.findById(req.user.userId)
      .select('-password -payments -__v -createdAt -updatedAt')
      .populate({
        path: 'doctors',
        select: 'name specialty status'
      })
      .populate({
        path: 'currentTemporaryPets.petId',
        select: 'name species breed img_url age weight health_status',
        populate: {
          path: 'owner_id',
          select: 'fullName phone'
        }
      })
      .populate({
        path: 'currentTemporaryPets.requestId',
        populate: {
          path: 'ownerId',
          select: 'fullName phone'
        }
      });

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json(clinic);
  } catch (error) {
    console.error('Error fetching clinic profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

//Get Clinic name
router.get('/clinic/name', authMiddleware, async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.user.userId).select('clinicName');
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }
    res.json({ clinicName: clinic.clinicName });
  } catch (error) {
    console.error('Error fetching clinic name:', error);
    res.status(500).json({ message: 'Error fetching clinic name', error: error.message });
  }
});
 
// routes/vet.js
router.get('/public-profile/:clinicId', async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.clinicId)
      .select('-password -payments -__v -isVerified -isActive')
      .populate({
        path: 'doctors',
        select: 'name specialty profileImage phone'
      });

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    const services = await Service.find({ vet: clinic._id, isActive: true });
    
    res.json({
      ...clinic.toObject(),
      services,
      vaccinations: services.filter(s => s.type === 'vaccination')
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update Vet Profile Image
router.put(
  '/profile-image',
  authMiddleware,
  vetUpload.single('profileImage'),
  async (req, res) => {
    try {
      if (req.user.role !== 'clinic') {
        return res.status(403).json({ message: 'Access forbidden' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const clinic = await Clinic.findById(req.user.userId);
      if (!clinic) {
        return res.status(404).json({ message: 'Clinic not found' });
      }

      // Construct the file path (you might want to store this differently in production)
      const filePath = `/uploads/vet-profiles/${req.file.filename}`;

      // Update the profile image
      clinic.profileImage = filePath;
      await clinic.save();

      res.json({
        message: 'Profile image updated successfully',
        profileImage: filePath
      });
    } catch (error) {
      console.error('Error updating profile image:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Get clinic working hours
router.get('/:id/working-hours', async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id).select('workingHours');
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }
    
    res.json({
      success: true,
      workingHours: clinic.workingHours
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching working hours',
      error: error.message 
    });
  }
});

// Get vet's temporary care settings
router.get('/temporary-care/settings', authMiddleware, async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.user.userId)
      .select('temporaryCareSettings');
    
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json({
      settings: clinic.temporaryCareSettings || {
        providesTemporaryCare: false,
        maxPetsCapacity: 0,
        dailyRatePerPet: 0,
        description: '',
        facilities: []
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// get all found pets
router.get('/found-pets', authMiddleware,async (req, res) => {
  try {


    const foundPets = await FoundPet.find({ clinic: req.user.userId })
      .populate({
        path: 'healthRecords',
        select: '_id date_created'
      });
    
    const enrichedPets = foundPets.map(pet => ({
      ...pet.toObject(),
      hasRecords: pet.healthRecords.length > 0
    }));
    
    res.json(enrichedPets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new found pet
router.post('/found-pet', authMiddleware, async (req, res) => {
  try {
    const foundPet = new FoundPet({
      ...req.body,
      clinic: req.user.userId,
      status: 'in_clinic'
    });
    
    await foundPet.save();

    // Get all users (or filter by role if needed)
   const users = await User.find({ role: 'pet_owner' });
    // Send notification to each user
    const notificationPromises = users.map(user => 
      notificationController.createNotification(
        user._id, // Send to each user's ID
        `New found pet reported at ${req.user.clinicName || 'our clinic'}: ${req.body.species} ${req.body.breed}`,
        `/found-pets/${foundPet._id}`,
        'system',
        req.app.get('wss')
      )
    );

    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);

    res.status(201).json(foundPet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
// Update the status of a found pet
router.patch('/found-pets/:id/status', authMiddleware,async (req, res) => {
  try {
    const foundPet = await FoundPet.findOneAndUpdate(
      { _id: req.params.id, clinic: req.user.userId },
      { status: req.body.status },
      { new: true }
    );
    
    if (!foundPet) {
      return res.status(404).json({ message: 'Found pet not found' });
    }
    
    res.json(foundPet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// List found pets available for adoption
router.get('/found-pets/available', authMiddleware, async (req, res) => {
  try {
    const pets = await FoundPet.find({
      clinic: req.user.clinicId,
      adoptionStatus: 'available'
    });
    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Put a found pet up for adoption
router.post('/found-pets/:id/adopt', authMiddleware, async (req, res) => {
  try {
    const { aboutPet, deliveryPlace, questions } = req.body;
    
    const pet = await FoundPet.findByIdAndUpdate(
      req.params.id,
      {
        adoptionStatus: 'available',
        adoptionDetails: {
          aboutPet,
          deliveryPlace,
          questions: questions || []
        }
      },
      { new: true }
    );
    
    res.json(pet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// add adopt request 
router.post('/found-pets/requests', authMiddleware, async (req, res) => {
  try {
    const { 
      pet_id, 
      pet_type, 
      owner_id, 
      requester_id, 
      questionsAndAnswers,
      clinic_id
    } = req.body;

    // Verify references exist
    const [pet] = await Promise.all([
      FoundPet.findById(pet_id),
 
    ]);

    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    const wss = req.app.get('wss');


    // Validate questionsAndAnswers
    const validQuestions = Array.isArray(questionsAndAnswers) && 
      questionsAndAnswers.every(qa => 
        typeof qa.question === 'string' && 
        typeof qa.answer === 'string'
      );
    
    if (!validQuestions) {
      return res.status(400).json({ message: 'Invalid questionsAndAnswers format' });
    }

    const request = new AdoptionRequest({
      pet_id,
      pet_type: 'FoundPet', // Force this value since route is for found pets
      owner_id,
      requester_id,
      questionsAndAnswers,
      adoption_type: 'lifetime',
      clinic_id: clinic_id || owner_id, // Default to owner_id if not provided
      status: 'pending'
    });

    await request.save();
    
    const notification = await notificationController.createNotification(
      owner_id,
      `New adoption request for ${pet.name}`,
      `/clinic/found-pets/requests/${request._id}`,
      'adoption',
      wss // Pass the WebSocket server
    );
    
    res.status(201).json({
      success: true,
      request: {
        _id: request._id,
        pet_name: pet.name,
        status: request.status,
        createdAt: request.createdAt
      }
    });
  } catch (error) {
    console.error('Adoption request error:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
});


// Get all adoption requests for vet's found pets
router.get('/found-pets/requests', authMiddleware, async (req, res) => {
  try {
    console.log('User making request:', req.user); // Debug log
    
    if (req.user.role !== 'vet' && req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const requests = await AdoptionRequest.find({
      clinic_id: req.user.userId, // Ensure this matches your JWT payload
      pet_type: 'FoundPet'
    })
    .populate('pet_id', 'name breed age foundDate adoptionStatus')
    .populate('requester_id', 'fullName email phone city village profileImage')
    .sort({ createdAt: -1 });

    console.log('Found requests:', requests); // Debug log
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ 
      message: 'Error fetching adoption requests',
      error: error.message 
    });
  }
});

// Get single adoption request
router.get('/found-pets/requests/:id', authMiddleware, async (req, res) => {
  try {
    const request = await AdoptionRequest.findOne({
      _id: req.params.id,
      clinic_id: req.user.userId
    })
    .populate('pet_id')
    .populate('requester_id');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Approve adoption request
router.patch('/found-pets/requests/:id/approve', authMiddleware, async (req, res) => {
  try {
    const request = await AdoptionRequest.findOneAndUpdate(
      {
        _id: req.params.id,
        clinic_id: req.user.userId,
        status: 'pending'
      },
      { status: 'approved' },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    // Update the found pet status
    await FoundPet.findByIdAndUpdate(request.pet_id, {
      adoptionStatus: 'adopted'
    });

    res.json({ success: true, request });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Reject adoption request
router.patch('/found-pets/requests/:id/reject', authMiddleware, async (req, res) => {
  try {
    const request = await AdoptionRequest.findOneAndUpdate(
      {
        _id: req.params.id,
        clinic_id: req.user.userId,
        status: 'pending'
      },
      { status: 'rejected' },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    res.json({ success: true, request });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



router.get('/found-pets/:id', authMiddleware, async (req, res) => {
  try {
    const foundPet = await FoundPet.findById(req.params.id).populate('clinic');
    if (!foundPet) {
      return res.status(404).json({ message: 'Found pet not found' });
    }
    res.json(foundPet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});




//    Add new doctor:    //
router.post('/doctors', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Only clinics can add doctors' });
    }
    
    const clinic = await Clinic.findById(req.user.userId);
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    const { name, gender, birthDate, phone, specialty } = req.body;
    
    // Generate default email if not provided
    let email = req.body.email;
    if (!email || email === '') {
      const formattedClinicName = clinic.clinicName.replace(/\s+/g, '_').toLowerCase();
      const formattedDoctorName = name.replace(/\s+/g, '_').toLowerCase();
      email = `${formattedClinicName}_${formattedDoctorName}@gmail.com`;
    }

    // Set default password
    const defaultPassword = 'doctorpass';
    const doctor = new Doctor({
      name,
      gender,
      birthDate: birthDate || null,
      phone,
      email,
      specialty: specialty || 'General',
      password: defaultPassword,
      temporaryPassword: defaultPassword, // Store unhashed for display
      clinic: req.user.userId,
      profileImage: req.file ? `/uploads/doctors/${req.file.filename}` : '',
    });

    await doctor.save();

    // Add doctor to clinic's doctors array
    await Clinic.findByIdAndUpdate(
      req.user.userId,
      { $push: { doctors: doctor._id } },
      { new: true }
    );

    res.status(201).json({
      ...doctor.toObject(),
      temporaryPassword: defaultPassword
    });
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).json({ 
      message: 'Error adding doctor', 
      error: error.message 
    });
  }
});

// Get all doctors for a clinic:  //
router.get('/doctors', authMiddleware, async (req, res) => {
    try {

        if (req.user.role !== 'clinic') {
          return res.status(403).json({ message: 'Only clinics can manage Doctors' });
       }
    
      const doctors = await Doctor.find({ clinic: req.user.userId })
        .select('name gender birthDate phone email specialty status profileImage temporaryPassword createdAt');
  
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching doctors', error: error.message });
    }
  });

// New route for pet owners to get doctors by clinic ID
router.get('/:clinicId/doctors', authMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find({ clinic: req.params.clinicId })
      .select('name gender birthDate phone email specialty status profileImage temporaryPassword createdAt');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors', error: error.message });
  }
});


// Get single doctor
router.get('/doctors/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Only clinics can access doctor details' });
    }

    const doctor = await Doctor.findOne({
      _id: req.params.id,
      clinic: req.user.userId
    }).select('-password -__v');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctor', error: error.message });
  }
});

// Update doctor
router.put('/doctors/:id', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Only clinics can update doctors' });
    }

    const updates = { ...req.body };
    
    // Handle profile image update
    if (req.file) {
      updates.profileImage = `/uploads/doctors/${req.file.filename}`;
    }

    const updatedDoctor = await Doctor.findOneAndUpdate(
      { 
        _id: req.params.id,
        clinic: req.user.userId 
      },
      updates,
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(updatedDoctor);
  } catch (error) {
    res.status(500).json({ message: 'Error updating doctor', error: error.message });
  }
});

// Delete doctor
router.delete('/doctors/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Only clinics can delete doctors' });
    }

    // Find and delete the doctor
    const deletedDoctor = await Doctor.findOneAndDelete({
      _id: req.params.id,
      clinic: req.user.userId
    });

    if (!deletedDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Remove doctor from clinic's doctors array
    await Clinic.findByIdAndUpdate(
      req.user.userId,
      { $pull: { doctors: req.params.id } }
    );

    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting doctor', error: error.message });
  }
});

// Reset doctor password
router.post('/doctors/:id/reset-password', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Only clinics can reset doctor passwords' });
    }

    const defaultPassword = 'doctorpass';
    
    const doctor = await Doctor.findOneAndUpdate(
      { 
        _id: req.params.id,
        clinic: req.user.userId 
      },
      { 
        password: defaultPassword,
        temporaryPassword: defaultPassword 
      },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json({ 
      success: true,
      temporaryPassword: defaultPassword,
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

// Update doctor status
router.patch('/doctors/:id/status', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Only clinics can update doctor status' });
    }

    const { status } = req.body;
    if (!['active', 'on leave', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const doctor = await Doctor.findOneAndUpdate(
      { 
        _id: req.params.id,
        clinic: req.user.userId 
      },
      { status },
      { new: true }
    ).select('_id name status');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Error updating doctor status', error: error.message });
  }
});


  // Add Clinic Services: //
  router.post('/services', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'clinic') {
            return res.status(403).json({ message: 'Only clinics can add services' });
        }

        const { type, subServices } = req.body;

        // Enhanced validation
        if (!type) {
            return res.status(400).json({ message: 'Service type is required' });
        }

        if (!subServices || !Array.isArray(subServices) ){
            return res.status(400).json({ message: 'Sub-services must be an array' });
        }

        if (subServices.length === 0) {
            return res.status(400).json({ message: 'At least one sub-service is required' });
        }

        // Validate each sub-service
        for (const subService of subServices) {
            if (!subService.name || !subService.requirements) {
                return res.status(400).json({ 
                    message: 'Each sub-service must have a name and requirements' 
                });
            }

            if (typeof subService.baseCost !== 'number' || subService.baseCost < 0) {
                return res.status(400).json({ 
                    message: 'Each sub-service must have a valid base cost' 
                });
            }

            // Validate extra services if they exist
            if (subService.extraServices && Array.isArray(subService.extraServices)) {
                for (const extra of subService.extraServices) {
                    if (!extra.name || typeof extra.cost !== 'number' || extra.cost < 0) {
                        return res.status(400).json({ 
                            message: 'Each extra service must have a name and valid cost' 
                        });
                    }
                }
            }
        }

        const newService = new Service({
            vet: req.user.userId,
            type,
            subServices,
            isActive: true
        });

        const savedService = await newService.save();
        res.status(201).json(savedService);
        // Sync with Vaccination model
        await syncVaccinations(savedService);

    } catch (error) {
        console.error('Detailed error:', error);
        
        // Handle specific Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                message: 'Validation error',
                errors: messages
            });
        }
        
        res.status(500).json({ 
            message: 'Error adding service', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});


// get Clinic Servics: //
router.get('/services', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Only clinics can manage services' });
    }
    const services = await Service.find({ vet: req.user.userId });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
});

// New route for pet owners to get services by clinic ID
router.get('/:clinicId/services', authMiddleware, async (req, res) => {
  try {
    const services = await Service.find({ vet: req.params.clinicId });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
});

// Update Service 
router.put('/services/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'clinic') {
            return res.status(403).json({ message: 'Only clinics can update services' });
        }

        const updatedService = await Service.findOneAndUpdate(
            { _id: req.params.id, vet: req.user.userId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedService) {
            return res.status(404).json({ message: 'Service not found' });
        }

        // Sync with Vaccination model
        await syncVaccinations(updatedService);
        res.json(updatedService);
    } catch (error) {
        res.status(500).json({ message: 'Error updating service', error: error.message });
    }
});

// Toggle Active Status (PATCH)
router.patch('/services/:id/toggle-active', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'clinic') {
            return res.status(403).json({ message: 'Only clinics can update services' });
        }

        const service = await Service.findOne({ _id: req.params.id, vet: req.user.userId });
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        service.isActive = !service.isActive;
        await service.save();

        res.json(service);
    } catch (error) {
        res.status(500).json({ message: 'Error toggling service status', error: error.message });
    }
});

// Delete Service (DELETE)
router.delete('/services/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'clinic') {
            return res.status(403).json({ message: 'Only clinics can delete services' });
        }

        const deletedService = await Service.findOneAndDelete(
            { _id: req.params.id, vet: req.user.userId }
        );

        if (!deletedService) {
            return res.status(404).json({ message: 'Service not found' });
        }
        // Remove associated vaccinations
        await Vaccination.deleteMany({ service_id: req.params.id });
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting service', error: error.message });
    }
});





// Get all lab tests (with optional status filter)
router.get('/lab-tests', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Only clinics can manage services' });
    }

    // Optional status filter from query params
    const statusFilter = req.query.status;
    const query = { 
      clinic_id: req.user.userId // assuming user has clinic_id
    };
    
    if (statusFilter) {
      query.status = statusFilter;
    }

    const labTests = await LabTest.find(query)
      .populate('pet_id', 'name species breed')
      .populate('appointment_id', 'date')
      .sort({ createdAt: -1 });

    res.json(labTests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lab tests', error: error.message });
  }
});



// Get test parameters structure
router.get('/lab-tests/:id/parameters', authMiddleware, async (req, res) => {
  try {
    const labTest = await LabTest.findById(req.params.id)
      .populate('service_id', 'type')
      .populate('sub_service_id', 'name requirements');
    
    if (!labTest) {
      return res.status(404).json({ message: 'Lab test not found' });
    }

    // Return parameters structure based on test type
    let parameters = [];
    if (labTest.test_name.includes('Blood Count')) {
      parameters = [
        { name: 'RBC', unit: 'million/µL', normal_range: '5.5-8.5' },
        { name: 'WBC', unit: '/µL', normal_range: '6000-17000' },
        { name: 'Hemoglobin', unit: 'g/dL', normal_range: '12-18' },
        { name: 'Hematocrit', unit: '%', normal_range: '37-55' }
      ];
    } else if (labTest.test_name.includes('Chemistry')) {
      parameters = [
        { name: 'Glucose', unit: 'mg/dL', normal_range: '70-120' },
        { name: 'BUN', unit: 'mg/dL', normal_range: '6-25' },
        { name: 'Creatinine', unit: 'mg/dL', normal_range: '0.5-1.5' }
      ];
    }
    // Add more test types as needed

    res.json({
      test: labTest,
      parameters
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching test parameters', error: error.message });
  }
});



// Get single lab test with owner information
// Get single lab test with owner information
router.get('/lab-tests/:id', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lab test ID' });
    }

    const labTest = await LabTest.findById(req.params.id)
      .populate({
        path: 'pet_id',
        select: 'name species breed age gender owner_id',
        populate: {
          path: 'owner_id',
          select: 'fullName email phone',
          // Add error handling for owner population
          options: { lean: true }
        },
        // Add error handling for pet population
        options: { lean: true }
      })
      .populate({
        path:'appointment_id',
        select: 'date doctor_id',
        populate: {
          path: 'doctor_id',
          select: 'name',
          // Add error handling for owner population
          options: { lean: true }
        },
        options: { lean: true }
       }
      )
      .populate('service_id', 'type')
      .populate('clinic_id','clinicName phone city village email')
      .lean(); // Convert to plain JavaScript object

    if (!labTest) {
      return res.status(404).json({ message: 'Lab test not found' });
    }

    // Handle case where pet_id was deleted but reference remains
    if (labTest.pet_id === null && labTest.pet_info) {
      labTest.pet_id = {
        name: labTest.pet_info.name,
        species: labTest.pet_info.species,
        breed: labTest.pet_info.breed,
        age: labTest.pet_info.age,
        gender: labTest.pet_info.gender
      };
    }

    // Transform the results to ensure consistent structure
    if (labTest.results) {
      labTest.results = labTest.results.map(result => {
        // Handle cases where result might be malformed
        if (!result) return null;
        
        return {
          parameter: {
            name: result.parameter?.name || result.parameter || 'Unknown',
            unit: result.unit || '',
            normal_range: result.normal_range || ''
          },
          value: result.value || '',
          unit: result.unit || '',
          normal_range: result.normal_range || '',
          flag: result.flag || 'normal'
        };
      }).filter(Boolean); // Remove any null results
    }

    res.json(labTest);
  } catch (error) {
    console.error('Error in /lab-tests/:id:', error);
    res.status(500).json({ 
      message: 'Error fetching lab test', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});
// Submit lab test results
router.put('/lab-tests/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { results, summary, vet_notes, recommendations } = req.body;
    
    if (req.user.role !== 'vet' && req.user.role !== 'clinic') {
      return res.status(403).json({ message: 'Unauthorized to complete lab tests' });
    }

    const existingTest = await LabTest.findById(req.params.id);
    if (!existingTest) {
      return res.status(404).json({ message: 'Lab test not found' });
    }

    // Prepare the complete results structure
    const completeResults = results.map(result => ({
      parameter: {
        name: result.name,
        unit: result.unit,
        normal_range: result.normal_range
      },
      value: result.value,
      unit: result.unit,
      normal_range: result.normal_range,
      flag: result.flag
    }));

    // Update LabTest
    const updatedTest = await LabTest.findByIdAndUpdate(
      req.params.id,
      {
        results: completeResults,
        summary,
        vet_notes,
        recommendations,
        status: 'completed',
        completed_at: new Date(),
      },
      { new: true }
    );

    // Update HealthRecord with identical structure
    await HealthRecord.findByIdAndUpdate(
      updatedTest.health_record_id,
      {
        $push: {
          lab_results: {
            test_id: updatedTest._id,
            test_name: updatedTest.test_name,
            date: updatedTest.completed_at,
            results: completeResults, // Same structure as LabTest
            summary: updatedTest.summary
          }
        }
      },
      { new: true }
    );

    res.json({ success: true, labTest: updatedTest });
  } catch (error) {
    res.status(500).json({ message: 'Error completing lab test', error: error.message });
  }
});


module.exports = router;