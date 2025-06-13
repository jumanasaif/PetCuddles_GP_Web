const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Appointment = require('../models/Appointments');
const HealthRecord = require('../models/HealthRecord');
const LabTest = require('../models/LabTest');
const Doctor = require('../models/Doctor');




// Doctor login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const doctor = await Doctor.findOne({ email }).select('+password');
    
    if (!doctor) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = doctor.generateAuthToken();
    
    res.json({ 
      token,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialty: doctor.specialty,
        clinic: doctor.clinic
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get doctor profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    const doctor = await Doctor.findById(req.user.userId)
      .select('-password -temporaryPassword')
      .populate('clinic', 'clinicName city village profileImage');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get doctor dashboard statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const doctorId = req.user.userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Count today's appointments
    const todayAppointments = await Appointment.countDocuments({
      doctor_id: doctorId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['pending', 'accepted'] }
    });

    // Count upcoming appointments (next 7 days)
    const upcomingAppointments = await Appointment.countDocuments({
      doctor_id: doctorId,
      date: { $gte: tomorrow, $lte: nextWeek },
      status: { $in: ['pending', 'accepted'] }
    });

    // First find all appointment IDs for this doctor
    const appointments = await Appointment.find({ doctor_id: doctorId }).select('_id');
    const appointmentIds = appointments.map(appt => appt._id);

    // Count pending lab tests linked to these appointments
    const pendingTests = await LabTest.countDocuments({
      appointment_id: { $in: appointmentIds },
      status: 'pending'
    });

    // Count completed health records for the doctor
    const completedRecords = await HealthRecord.countDocuments({
      doctor_id: doctorId
    });

    // Count recent patients (seen in last 30 days)
    const recentAppointments = await Appointment.find({
      doctor_id: doctorId,
      date: { $gte: thirtyDaysAgo },
      status: 'completed'
    }).populate('pet_id');

    const uniquePatientIds = new Set();
    recentAppointments.forEach(appt => {
      if (appt.pet_id) {
        uniquePatientIds.add(appt.pet_id._id.toString());
      }
    });

    res.json({
      todayAppointments,
      upcomingAppointments,
      pendingTests,
      completedRecords,
      recentPatients: uniquePatientIds.size
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



// Get today's appointments
router.get('/appointments/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      doctor_id: req.user.userId,
      date: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $in: ['pending', 'accepted'] }
    })
    .populate({
      path: 'pet_id',
      select: 'name species breed img_url owner_id',
      populate: {
        path: 'owner_id',
        select: 'fullName phone'
      }
    })
    .populate('clinic_id', 'clinicName')
    .sort({ date: 1, Time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all appointments with filtering
router.get('/appointments', authMiddleware, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = { doctor_id: req.user.userId };

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: 'pet_id',
        select: 'name species breed img_url owner_id',
        populate: {
          path: 'owner_id',
          select: 'fullName phone'
        }
      })
      .populate('clinic_id', 'clinicName')
      .sort({ date: -1, Time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update appointment status
router.patch('/appointments/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        doctor_id: req.user.userId
      },
      { status },
      { new: true }
    )
    .populate('pet_id', 'name species breed')
    .populate('owner_id', 'fullName phone');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all patients for a doctor
router.get('/patients', authMiddleware, async (req, res) => {
  try {
    // First find all appointments for this doctor to get patient IDs
    const appointments = await Appointment.find({
      doctor_id: req.user.userId
    }).populate({
      path: 'pet_id',
      select: 'name species breed age gender img_url medicalHistory lastVisit owner_id',
      populate: {
        path: 'owner_id',
        select: 'fullName phone email address'
      }
    });

    // Extract unique pets
    const uniquePets = [];
    const petIds = new Set();
    
    appointments.forEach(appt => {
      if (appt.pet_id && !petIds.has(appt.pet_id._id.toString())) {
        petIds.add(appt.pet_id._id.toString());
        uniquePets.push(appt.pet_id);
      }
    });

    res.json(uniquePets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recent patients (last 30 days)
router.get('/patients/recent', authMiddleware, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find all appointments in last 30 days
    const appointments = await Appointment.find({
      doctor_id: req.user.userId,
      date: { $gte: thirtyDaysAgo },
      status: 'completed'
    })
    .populate({
      path: 'pet_id',
      select: 'name species breed img_url owner_id lastVisit',
      populate: {
        path: 'owner_id',
        select: 'fullName phone'
      }
    })
    .sort({ date: -1 });

    // Extract unique pets
    const uniquePets = [];
    const petIds = new Set();
    
    appointments.forEach(appt => {
      if (appt.pet_id && !petIds.has(appt.pet_id._id.toString())) {
        petIds.add(appt.pet_id._id.toString());
        uniquePets.push(appt.pet_id);
      }
    });

    // Sort by most recent visit
    uniquePets.sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));

    res.json(uniquePets.slice(0, 5)); // Return top 5 recent patients
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Create new health record
router.post('/patients/:petId/records', authMiddleware, async (req, res) => {
  try {
    const {
      weight,
      temperature,
      heartRate,
      respiratoryRate,
      symptoms,
      diagnosis,
      treatment,
      medications,
      notes,
      followUpDate
    } = req.body;

    const newRecord = new HealthRecord({
      pet_id: req.params.petId,
      doctor_id: req.user.userId,
      clinic_id: req.user.clinic, // Assuming clinic is stored in user object
      weight,
      temperature,
      heartRate,
      respiratoryRate,
      symptoms,
      diagnosis,
      treatment,
      medications,
      notes,
      followUpDate: followUpDate ? new Date(followUpDate) : null
    });

    await newRecord.save();

    // Update pet's last visit date
    await Pet.findByIdAndUpdate(req.params.petId, {
      lastVisit: new Date()
    });

    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Get patient health records
router.get('/patients/:petId/records', authMiddleware, async (req, res) => {
  try {
    const healthRecords = await HealthRecord.find({
      pet_id: req.params.petId,
      doctor_id: req.user.userId
    })
    .populate('clinic_id', 'clinicName')
    .sort({ date_created: -1 });

    res.json(healthRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get lab tests assigned to doctor
router.get('/lab-tests', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    
    // First find all appointments for this doctor
    const appointments = await Appointment.find({
      doctor_id: req.user.userId
    }).select('_id');

    if (!appointments){
      console.log("not appointments found");
    }

    const appointmentIds = appointments.map(appt => appt._id);
    // Now find lab tests associated with these appointments
    let query = { appointment_id: { $in: appointmentIds } };

    if (status) {
      query.status = status;
    }

    const labTests = await LabTest.find(query)
      .populate('pet_id', 'name species breed')
      .populate({
        path: 'appointment_id',
        model:'Appointment',
        select: 'date Time doctor_id',
        populate: {
          path: 'doctor_id',
          model:'Doctor',
          select: 'name'
        }
      })
      .populate('clinic_id', 'clinicName')
      .sort({ createdAt: -1 });

    res.json(labTests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    console.log(error);
  }
});

// Submit lab test results
router.put('/lab-tests/:id/results', authMiddleware, async (req, res) => {
  try {
    const { results, summary, recommendations } = req.body;

    const labTest = await LabTest.findOneAndUpdate(
      {
        _id: req.params.id,
        doctor_id: req.user.userId,
        status: { $ne: 'completed' }
      },
      {
        results,
        summary,
        recommendations,
        status: 'completed',
        completed_at: new Date()
      },
      { new: true }
    );

    if (!labTest) {
      return res.status(404).json({ message: 'Lab test not found or already completed' });
    }

    // Update health record
    await HealthRecord.findByIdAndUpdate(
      labTest.health_record_id,
      {
        $push: {
          lab_results: {
            test_id: labTest._id,
            test_name: labTest.test_name,
            date: labTest.completed_at,
            results: labTest.results,
            summary: labTest.summary
          }
        }
      }
    );

    res.json(labTest);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update doctor profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { phone, specialty, status } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      req.user.userId,
      { phone, specialty, status },
      { new: true, runValidators: true }
    ).select('-password -temporaryPassword');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const doctor = await Doctor.findById(req.user.userId).select('+password');
    
    const isMatch = await bcrypt.compare(currentPassword, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    doctor.password = await bcrypt.hash(newPassword, salt);
    doctor.temporaryPassword = undefined;
    await doctor.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Get upcoming appointments (next 7 days)
router.get('/appointments/upcoming', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const appointments = await Appointment.find({
      doctor_id: req.user.userId,
      date: {
        $gte: today,
        $lte: nextWeek
      },
      status: { $in: ['pending', 'accepted'] }
    })
    .populate({
      path: 'pet_id',
      select: 'name species breed img_url owner_id',
      populate: {
        path: 'owner_id',
        select: 'fullName phone'
      }
    })
    .populate('clinic_id', 'clinicName')
    .sort({ date: 1, Time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get health records for doctor's patients
router.get('/health-records', authMiddleware, async (req, res) => {
  try {
    const { petId, limit } = req.query;
    let query = { doctor_id: req.user.userId };

    if (petId) {
      query.pet_id = petId;
    }

    const records = await HealthRecord.find(query)
      .populate({
        path: 'pet_id',
        select: 'name species breed',
        populate: {
          path: 'owner_id',
          select: 'fullName phone'
        }
      })
      .populate('clinic_id', 'clinicName')
      .sort({ date_created: -1 })
      .limit(limit ? parseInt(limit) : 10);

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single health record
router.get('/health-records/:id', authMiddleware, async (req, res) => {
  try {
    const record = await HealthRecord.findOne({
      _id: req.params.id,
      doctor_id: req.user.userId
    })
    .populate({
      path: 'pet_id',
      select: 'name species breed age gender',
      populate: {
        path: 'owner_id',
        select: 'fullName phone email'
      }
    })
    .populate('clinic_id', 'clinicName city village')
    .populate('doctor_id', 'name specialty');

    if (!record) {
      return res.status(404).json({ message: 'Health record not found' });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});




module.exports = router;
