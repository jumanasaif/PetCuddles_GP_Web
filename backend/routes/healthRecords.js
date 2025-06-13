// routes/healthRecords.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const HealthRecord = require('../models/HealthRecord');
const Appointment = require('../models/Appointments');
const VetService = require('../models/VetService');
const FoundPet = require('../models/FoundPet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Configure file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = 'uploads/medical-reports/';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ storage });
  




// Create health record from appointment
router.post('/from-appointment', authMiddleware, async (req, res) => {
    try {
      const { appointmentId, diagnosis, treatment, medications, procedures, 
              vaccinations, lab_results, follow_up_required, 
              follow_up_date, follow_up_reason, notes } = req.body;
      
      const appointment = await Appointment.findById(appointmentId)
        .populate('pet_id')
        .populate('doctor_id', 'name')
        .populate('services.service_id');
  
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      if (appointment.status !== 'completed') {
        return res.status(400).json({ message: 'Only completed appointments can have health records' });
      }
      
      // Check if record already exists
      const existingRecord = await HealthRecord.findOne({ appointment_id: appointmentId });
      if (existingRecord) {
        return res.status(400).json({ message: 'Health record already exists for this appointment' });
      }
  
      // Transform services data
      const servicesWithDetails = await Promise.all(appointment.services.map(async service => {
        const serviceDoc = await VetService.findById(service.service_id);
        if (!serviceDoc) return service;
        
        const subService = serviceDoc.subServices.find(
          sub => sub._id.toString() === service.sub_service_id?.toString()
        );
        
        let extraService = null;
        if (service.extra_sub_service_id && subService) {
          extraService = subService.extraServices.find(
            extra => extra._id.toString() === service.extra_sub_service_id.toString()
          );
        }
        
        return {
          service_id: service.service_id,
          service_type: serviceDoc.type,
          sub_service: subService?.name || '',
          extra_service: extraService?.name || '',
          cost: service.cost,
          notes: ''
        };
      }));
      
      // Create health record
      const healthRecord = new HealthRecord({
        appointment_id: appointment._id,
        petType: appointment.petType,
        pet_id: appointment.petType === 'registered' ? appointment.pet_id?._id : undefined,
        externalPet: appointment.petType === 'external' ? appointment.externalPet : undefined,
        clinic_id: appointment.clinic_id,
        doctor_id: appointment.doctor_id?._id,
        doctor_name: appointment.doctor_id?.name,
        services: servicesWithDetails,
        diagnosis: diagnosis || '',
        treatment: treatment || '',
        medications: medications || [],
        procedures: procedures || [],
        vaccinations: vaccinations || [],
        lab_results: lab_results || [],
        follow_up_required: follow_up_required || false,
        follow_up_date: follow_up_date || undefined,
        follow_up_reason: follow_up_reason || '',
        notes: notes || ''
      });
  
      await healthRecord.save();
      res.status(201).json(healthRecord);
    } catch (error) {
      res.status(500).json({ message: 'Error creating health record', error: error.message });
    }
  });
// Get all health records
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { clinic, pet, appointment } = req.query;
    let query = {};
    
    if (clinic) query.clinic_id = clinic;
    if (pet) query.pet_id = pet;
    if (appointment) query.appointment_id = appointment;
    
    const records = await HealthRecord.find(query)
      .populate('pet_id', 'name species breed')
      .populate('doctor_id', 'name')
      .populate('services.service_id')
      .sort({ date_created: -1 });
    
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching health records', error: error.message });
  }
});

// Get single health record
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const record = await HealthRecord.findById(req.params.id)
      .populate('pet_id', 'name species breed age')
      .populate('doctor_id', 'name specialty')
      .populate('services.service_id');
    
    if (!record) {
      return res.status(404).json({ message: 'Health record not found' });
    }
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching health record', error: error.message });
  }
});


router.get('/grouped/by-pet', authMiddleware, async (req, res) => {
  try {
    const { clinic } = req.query;
    let query = {};
    
    if (clinic) query.clinic_id = clinic;
    
    const records = await HealthRecord.find(query)
      .populate({
        path: 'pet_id',
        select: 'name species breed owner_id',
        populate: {
          path: 'owner_id',
          select: 'fullName'
        }
      })
      .populate('doctor_id', 'name _id')  
      .populate('services.service_id')
      .sort({ date_created: -1 });

    const groupedRecords = records.reduce(async (accPromise, record) => {
      const acc = await accPromise;
      let petId, petName, species, breed, ownerName;

      if (record.petType === 'found') {
        // Check if this found pet already exists in the FoundPet collection
        let foundPet = await FoundPet.findOne({
          name: record.foundPet?.name || 'Unknown',
          species: record.foundPet?.species || 'unknown',
          
          clinic: clinic
        });

        // If not found, create a new FoundPet entry
        if (!foundPet) {
          foundPet = new FoundPet({
            name: record.foundPet?.name || 'Unknown',
            species: record.foundPet?.species || 'unknown',
            breed: record.foundPet?.breed || 'Unknown',
            distinguishingFeatures: record.foundPet?.distinguishingFeatures || '',
            foundLocation: record.foundPet?.foundLocation || 'Unknown location',
            foundDate:record.foundPet?.foundDate || 'Unknown Date',
            estimatedAge:record.foundPet?.estimatedAge || 'Unknown Age',
            clinic: clinic,
            healthRecords: [record._id]
          });
          await foundPet.save();
        } else {
          // Add the record if it's not already there
          if (!foundPet.healthRecords.includes(record._id)) {
            foundPet.healthRecords.push(record._id);
            await foundPet.save();
          }
        }

        petId = `found_${record._id}`;
        petName = record.foundPet?.name || 'Found Pet';
        species = record.foundPet?.species?.toLowerCase() || 'unknown';
        breed = record.foundPet?.breed || 'Unknown Breed';
        ownerName = 'Found Pet (No Owner)';
      }

      // Handle different pet types
      else if (record.petType === 'registered') {
        petId = record.pet_id?._id || 'unknown';
        petName = record.pet_id?.name || 'Unknown Pet';
        species = record.pet_id?.species?.toLowerCase() || 'unknown';
        breed = record.pet_id?.breed || 'Unknown Breed';
        ownerName = record.pet_id?.owner_id?.fullName || 'Unknown Owner';
      } 
      else if (record.petType === 'external') {
        petId = `external_${record.externalPet?.name || 'unknown'}`;
        petName = record.externalPet?.name || 'External Pet';
        species = record.externalPet?.species?.toLowerCase() || 'unknown';
        breed = record.externalPet?.breed || 'Unknown Breed';
        ownerName = record.externalPet?.ownerName || 'External Pet Owner';
      }
      else {
        // Fallback for unknown types
        petId = `unknown_${record._id}`;
        petName = 'Unknown Pet';
        species = 'unknown';
        breed = 'Unknown Breed';
        ownerName = 'Unknown Owner';
      }

      if (!acc[petId]) {
        acc[petId] = {
          _id: petId,
          petName,
          species,
          breed,
          ownerName,
          petType: record.petType,
          count: 0,
          records: [],
          // Add found pet specific fields if available
          ...(record.petType === 'found' && {
            distinguishingFeatures: record.foundPet?.distinguishingFeatures,
            foundLocation: record.foundPet?.foundLocation,
            status: 'in_clinic' // Default status
          })
        };
      }
      
      acc[petId].records.push({
        id: record._id,
        date: record.date_created,
        diagnosis: record.diagnosis,
        doctor: record.doctor_name,
        doctorId: record.doctor_id?._id?.toString() || 'unknown',
        serialNumber: record.serialNumber || acc[petId].count + 1
      });
      
      acc[petId].count = acc[petId].records.length;
      
      return acc;
    }, Promise.resolve({}));
    
    res.json(Object.values(await groupedRecords));
  } catch (error) {
    console.error('Error fetching grouped records:', error);
    res.status(500).json({ message: 'Error fetching grouped health records', error: error.message });
  }
});

// Update health record
router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
  
      // Clean and validate array fields
      const cleanArrayField = (field) => {
        if (!Array.isArray(field)) return [];
        return field.filter(item => item && typeof item === 'object');
      };
  
      const updateObject = {
        diagnosis: updateData.diagnosis || '',
        treatment: updateData.treatment || '',
        medications: cleanArrayField(updateData.medications),
        procedures: cleanArrayField(updateData.procedures),
        vaccinations: cleanArrayField(updateData.vaccinations),
        lab_results: cleanArrayField(updateData.lab_results),
        follow_up_required: Boolean(updateData.follow_up_required),
        follow_up_date: updateData.follow_up_date || null,
        follow_up_reason: updateData.follow_up_reason || '',
        notes: updateData.notes || '',
        last_updated: new Date()
      };
  
      // Format dates in vaccinations
      if (updateObject.vaccinations) {
        updateObject.vaccinations = updateObject.vaccinations.map(vacc => ({
          ...vacc,
          date: vacc.date ? new Date(vacc.date) : null,
          next_due: vacc.next_due ? new Date(vacc.next_due) : null
        }));
      }
  
      const updatedRecord = await HealthRecord.findByIdAndUpdate(
        id,
        { $set: updateObject },
        { new: true, runValidators: true }
      ).populate('pet_id doctor_id');
  
      if (!updatedRecord) {
        return res.status(404).json({ message: 'Health record not found' });
      }
  
      res.json(updatedRecord);
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ 
        message: 'Error updating health record',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

// Delete health record
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const record = await HealthRecord.findByIdAndDelete(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Health record not found' });
    }
    
    // TODO: Delete associated files
    
    res.json({ message: 'Health record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting health record', error: error.message });
  }
});



// Download medical report
router.get('/download/:recordId/:reportId', authMiddleware, async (req, res) => {
  try {
    const record = await HealthRecord.findById(req.params.recordId);
    if (!record) {
      return res.status(404).json({ 
        success: false,
        message: 'Health record not found' 
      });
    }

    const report = record.medical_reports.id(req.params.reportId);
    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: 'Medical report not found in this health record' 
      });
    }

    if (!report.file_path) {
      return res.status(404).json({ 
        success: false,
        message: 'File path not found for this report' 
      });
    }

    if (!fs.existsSync(report.file_path)) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found on server' 
      });
    }

    res.setHeader('Content-Type', report.file_type);
    res.setHeader('Content-Disposition', `attachment; filename=${report.file_name}`);
    res.sendFile(path.resolve(report.file_path));
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error downloading file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// In your routes file
router.post('/found-pets', authMiddleware, async (req, res) => {
  try {
    const { clinic_id, doctor_id, doctor_name, foundPet, medicalInfo } = req.body;
    console.log('Received data:', req.body); // Add this line    
    // Create the health record directly without an appointment
    const record = new HealthRecord({
      petType: 'found',
      foundPet: {
        name: foundPet.name || 'Unknown',
        species: foundPet.species,
        breed: foundPet.breed || '',
        estimatedAge: foundPet.estimatedAge,
        gender: foundPet.gender,
        distinguishingFeatures: foundPet.distinguishingFeatures || '',
        foundLocation: foundPet.foundLocation || '',
        foundDate: foundPet.foundDate || new Date()
      },
      clinic_id,
      doctor_id,
      doctor_name,
      diagnosis: medicalInfo.diagnosis || '',
      treatment: medicalInfo.treatment || '',
      notes: medicalInfo.notes || '',
      procedures: medicalInfo.procedures || [] ,
      medications:medicalInfo.medications || [],
      vaccinations: medicalInfo.vaccinations || [],
      lab_results: medicalInfo.lab_results || [] 
    });

    await record.save();
    
    res.status(201).json({
      success: true,
      data: record
    });
  } catch (err) {
    console.error('Error details:', err); // Add this line
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});


const nodemailer = require('nodemailer');



router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { type, description, recordId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Find the health record
    const healthRecord = await HealthRecord.findById(recordId);
    if (!healthRecord) {
      throw new Error('Health record not found');
    }

    // Update the health record with the new file
    const updatedRecord = await HealthRecord.findByIdAndUpdate(
      recordId,
      {
        $push: {
          medical_reports: {
            type: type || 'other',
            description: description || 'Lab Test Result',
            file_name: req.file.originalname,
            file_path: req.file.path,
            file_type: req.file.mimetype,
            upload_date: new Date()
          }
        }
      },
      { new: true }
    );

    // Determine owner email based on pet type
    let ownerEmail, ownerName, petName;

    if (healthRecord.petType === 'registered') {
      // For registered pets, populate owner info
      const populatedRecord = await HealthRecord.findById(recordId)
        .populate({
          path: 'pet_id',
          populate: {
            path: 'owner_id',
            select: 'email fullName'
          }
        });

      if (populatedRecord.pet_id?.owner_id) {
        ownerEmail = populatedRecord.pet_id.owner_id.email;
        ownerName = populatedRecord.pet_id.owner_id.fullName || 'Pet Owner';
        petName = populatedRecord.pet_id.name || 'your pet';
      }
    } else if (healthRecord.petType === 'external') {
      // For external pets, use the stored info
      ownerEmail = healthRecord.externalPet.ownerEmail;
      ownerName = healthRecord.externalPet.ownerName || 'Pet Owner';
      petName = healthRecord.externalPet.name || 'your pet';
    }

    // Send email if we have an email address
    if (ownerEmail) {
      // Configure email transport
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD
        },
      });
      
      // Email content
      const subject = `New Medical Report for ${petName}`;
      const text = `Dear ${ownerName},\n\nA new medical report has been uploaded for ${petName}.\n\nDescription: ${description || 'No description provided'}\n\nThank you,\nYour Veterinary Clinic`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">New Medical Report for ${petName}</h2>
          <p>Dear ${ownerName},</p>
          <p>A new medical report has been uploaded for ${petName}.</p>
          <p><strong>Description:</strong> ${description || 'No description provided'}</p>
          <p>You can view this report in your pet's health records or contact us if you have any questions.</p>
          <p>Thank you,<br>Your Veterinary Clinic</p>
        </div>
      `;

      // Attach the PDF if it's a PDF file
      const attachments = [];
      if (req.file.mimetype === 'application/pdf') {
        attachments.push({
          filename: req.file.originalname,
          path: req.file.path,
          contentType: 'application/pdf'
        });
      }

      try {
        await transporter.sendMail({
          from: 'Your Veterinary Clinic',
          to: ownerEmail,
          subject,
          text,
          html,
          attachments
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the whole request if email fails
      }
    }

    res.json({ 
      success: true, 
      healthRecord: updatedRecord,
      emailSent: !!ownerEmail
    });
  } catch (error) {
    // Clean up the uploaded file if there's an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Error uploading file', 
      error: error.message 
    });
  }
});
module.exports = router;
