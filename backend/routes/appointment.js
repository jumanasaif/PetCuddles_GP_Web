const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointments');
const Pet = require('../models/Pet');
const Doctor = require('../models/Doctor');
const Vaccination = require('../models/Vaccination');
const VetService = require('../models/VetService');
const LabTest = require('../models/LabTest');
const notificationController = require("../controllers/notificationController");
const authMiddleware = require('../middleware/authMiddleware');
const HealthRecord = require('../models/HealthRecord');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const User = require("../models/User");


// Search pets by owner or pet name
router.get('/search-pets', authMiddleware, async (req, res) => {
    try {
      const { query } = req.query;
      
      // Check if query contains comma (owner,pet format)
      if (query.includes(',')) {
        const [ownerQuery, petQuery] = query.split(',').map(q => q.trim());
        
        const pets = await Pet.aggregate([
          {
            $lookup: {
              from: 'users',
              localField: 'owner_id',
              foreignField: '_id',
              as: 'owner'
            }
          },
          { $unwind: '$owner' },
          {
            $match: {
              $and: [
                { name: { $regex: petQuery, $options: 'i' } },
                { 'owner.fullName': { $regex: ownerQuery, $options: 'i' } }
              ]
            }
          },
          {
            $project: {
              name: 1,
              species: 1,
              breed: 1,
              img_url: 1,
              userId: '$owner._id',  // Changed from owner_id to userId
              owner: {
                fullName: 1,
                email: 1,
                phone: 1
              }
            }
          }
        ]);
        
        return res.json(pets);
      }
      
      // Regular search (works for owner OR pet name)
      const pets = await Pet.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'owner_id',
            foreignField: '_id',
            as: 'owner'
          }
        },
        { $unwind: '$owner' },
        {
          $match: {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { 'owner.fullName': { $regex: query, $options: 'i' } }
            ]
          }
        },
        {
            $project: {
              name: 1,
              species: 1,
              breed: 1,
              img_url: 1,
              userId: '$owner._id',  // Changed from owner_id to userId
              owner: {
                fullName: 1,
                email: 1,
                phone: 1
              }
            }
          }
      ]);
  
      res.json(pets);
    } catch (error) {
      res.status(500).json({ message: 'Error searching pets', error: error.message });
    }
  });

// Add Appointment
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { 
        petType,
        pet_id,
        externalPet,
        clinic_id,
        doctor_id,
        selectedServices, 
        date,
        Time,
        reason,
        isEmergency,
        notes,
        estimatedCost,
        actualCost,
        vaccinationDoses,
        followUpInfo
      } = req.body;
  
      // Validate required fields
      if (!clinic_id) {
        return res.status(400).json({ message: 'Clinic ID is required' });
      }
      const userRole = req.user.role;

      if (!selectedServices || selectedServices.length === 0) {
        return res.status(400).json({ message: 'At least one service must be selected' });
      }
      const pet = await Pet.findById(pet_id).populate('owner_id', 'fullName email phone ');
      const doctor = await Doctor.findById(doctor_id).populate('name');

      // Transform selectedServices to match our schema
      const transformedServices = selectedServices.map(service => ({
        service_id: service.service_id,
        sub_service_id: service.sub_service_id, // Just store ID
        extra_sub_service_id: service.extra_sub_service_id || null, // Just store ID or null
        cost: service.cost
      }));
      
      const appointmentDate = new Date(`${date}T${Time}`);
      const appointment = new Appointment({
        petType,
        pet_id: petType === 'registered' ? pet_id : undefined,
        externalPet: petType === 'external' ? externalPet : undefined,
        clinic_id,
        doctor_id,
        services: transformedServices, // Use transformed services
        date: appointmentDate,
        Time, 
        reason,
        notes,
        estimatedCost: transformedServices.reduce((sum, s) => sum + s.cost, 0),
        actualCost: transformedServices.reduce((sum, s) => sum + s.cost, 0),
        isEmergency,
        owner_id: petType === 'registered' ? pet.owner_id._id : undefined,
        vaccinationDoses: vaccinationDoses || new Map(),
        followUpInfo: followUpInfo || {},
        source: req.user.role === 'clinic' ? 'vet_added' : 'owner',
        status: req.user.role === 'clinic' ? 'pending' : 'pending_request',
        
      });
  
      const savedAppointment = await appointment.save();
      const notification = await notificationController.createNotification(
            clinic_id,
            `New Appointment regesterd now for Dr ${doctor.name}`,
            `/clinic-appointment`,
            'system',
             req.app.get('wss')
            
      );
      const doctorNotification = await notificationController.createNotification(
            doctor_id,
            `New Appointment regesterd now for ${pet.name} in ${date} at ${Time}`,
            `/clinic-appointment`,
            'system',
             req.app.get('wss')
            
      );

      console.log("Sending confirmation notification to clinic:", appointment.clinic_id._id);
      console.log("WebSocket server available:", !!req.app.get('wss'));

       
       
      res.status(201).json(savedAppointment);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  


// Get all appointments for a clinic with filtering
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, date, doctor, petType, clinic_id } = req.query;
    const clinicId = clinic_id || req.user.userId;
    
    let query = { clinic_id: clinicId };
    
    // Apply filters (keep existing filter logic)
    
   // Update your population to ensure owner data is properly populated
const appointments = await Appointment.find(query)
.populate({
  path: 'pet_id',
  select: 'name species breed img_url owner_id',
  populate: {
    path: 'owner_id',
    select: 'fullName email phone'
  }
})
.populate('owner_id', 'fullName email phone') // Direct owner population if exists
.populate('doctor_id', 'name specialty')
.populate('services.service_id', 'type subServices')
.sort({ date: 1, Time: 1 });

    // Manually attach subservice and extraservice data
    const appointmentsWithServices = await Promise.all(appointments.map(async appointment => {
      const servicesWithDetails = await Promise.all(appointment.services.map(async service => {
        const serviceDoc = await VetService.findById(service.service_id);
        if (!serviceDoc) return service;
        
        const subService = serviceDoc.subServices.find(
          sub => sub._id.toString() === service.sub_service_id.toString()
        );
        
        let extraService = null;
        if (service.extra_sub_service_id && subService) {
          extraService = subService.extraServices.find(
            extra => extra._id.toString() === service.extra_sub_service_id.toString()
          );
        }
        
        return {
          ...service.toObject(),
          service_details: {
            type: serviceDoc.type,
            sub_service: subService ? {
              name: subService.name,
              baseCost: subService.baseCost
            } : null,
            extra_service: extraService ? {
              name: extraService.name,
              cost: extraService.cost
            } : null
          }
        };
      }));
      
      return {
        ...appointment.toObject(),
        services: servicesWithDetails
      };
    }));
    
    res.json(appointmentsWithServices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});



// Update an appointment
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 1. Find the existing appointment
    const existingAppointment = await Appointment.findById(id)
      .populate('pet_id', 'name species breed img_url')
      .populate('owner_id', 'fullName email phone')
      .populate('doctor_id', 'name specialty');

    if (!existingAppointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // 2. Validate the requesting user has permission
    if (req.user.role === 'clinic' && existingAppointment.clinic_id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    // 3. Prepare update object with validation
    const updateObj = {};
    
    // Handle date/time updates
    if (updates.date || updates.Time) {
      const newDate = updates.date || existingAppointment.date;
      const newTime = updates.Time || existingAppointment.Time;
      
      // Combine date and time into a single datetime object
      const appointmentDateTime = new Date(`${newDate}T${newTime}`);
         
      updateObj.date = newDate;
      updateObj.Time = newTime;
    
       const doctorNotification = await notificationController.createNotification(
         existingAppointment.doctor_id._id,
         `the Appointment for ${existingAppointment.pet_id.name} was updated to ${newDate} at ${newTime}`,
         `/clinic-appointment`,
          'system',
          req.app.get('wss')     
       );

    }

    // Handle doctor changes
    if (updates.doctor_id) {
      // Verify the doctor exists and belongs to this clinic
      const doctor = await Doctor.findOne({
        _id: updates.doctor_id,
        clinic: existingAppointment.clinic_id
      });
      
      if (!doctor) {
        return res.status(400).json({ message: 'Invalid doctor selection' });
      }
      
      updateObj.doctor_id = updates.doctor_id;
    }

    // Handle other fields
    if (updates.reason) updateObj.reason = updates.reason;
    if (updates.notes) updateObj.notes = updates.notes;
    if (updates.status) updateObj.status = updates.status;
    if (updates.source) updateObj.source = updates.source;

    // 4. Apply the updates
    Object.assign(existingAppointment, updateObj);
    existingAppointment.updatedAt = new Date();

    const updatedAppointment = await existingAppointment.save();

    let healthRecord = null;
    if (updates.status === 'completed') {
      // Check for existing health record or create new one
      healthRecord = await HealthRecord.findOne({ appointment_id: id }) || 
        new HealthRecord({
          appointment_id: updatedAppointment._id,
          petType: updatedAppointment.petType,
          pet_id: updatedAppointment.petType === 'registered' ? updatedAppointment.pet_id?._id : undefined,
          externalPet: updatedAppointment.petType === 'external' ? updatedAppointment.externalPet : undefined,
          clinic_id: updatedAppointment.clinic_id,
          doctor_id: updatedAppointment.doctor_id?._id,
          doctor_name: updatedAppointment.doctor_id?.name,
          services: [],
          diagnosis: '',
          treatment: '',
          medications: [],
          procedures: [],
          vaccinations: [],
          lab_results: [],
          follow_up_required: false,
          follow_up_date: null,
          follow_up_reason: ''
        });

      // Process services
      const serviceDetails = await Promise.all(
        updatedAppointment.services.map(async service => {
          const serviceDoc = await VetService.findById(service.service_id)
            .populate('subServices');
          
          if (!serviceDoc) {
            return {
              service_id: service.service_id,
              service_type: 'Unknown',
              sub_service: '',
              extra_service: '',
              cost: service.cost,
              notes: ''
            };
          }

          const subService = serviceDoc.subServices.find(
            sub => sub._id.toString() === service.sub_service_id?.toString()
          );
          
          let extraService = null;
          if (service.extra_sub_service_id && subService?.extraServices) {
            extraService = subService.extraServices.find(
              extra => extra._id.toString() === service.extra_sub_service_id.toString()
            );
          }

          // Handle lab tests
          if (serviceDoc.type === 'laboratory_test' && subService) {
            try {
              await new LabTest({
                service_id: service.service_id,
                sub_service_id: service.sub_service_id,
                appointment_id: id,
                health_record_id: healthRecord._id,
                clinic_id: updatedAppointment.clinic_id,
                test_name: subService.name,
                requirements: subService.requirements,
                petType: updatedAppointment.petType,
                pet_id: updatedAppointment.petType === 'registered' ? updatedAppointment.pet_id?._id : undefined,
                pet_info: {
                  name: updatedAppointment.petType === 'registered' 
                    ? existingAppointment.pet_id?.name 
                    : updatedAppointment.externalPet?.name,
                  species: updatedAppointment.petType === 'registered' 
                    ? existingAppointment.pet_id?.species 
                    : updatedAppointment.externalPet?.species,
                  breed: updatedAppointment.petType === 'registered' 
                    ? existingAppointment.pet_id?.breed 
                    : updatedAppointment.externalPet?.breed,
                  age: updatedAppointment.petType === 'registered' 
                    ? existingAppointment.pet_id?.age 
                    : updatedAppointment.externalPet?.age,
                  gender: updatedAppointment.petType === 'registered' 
                    ? existingAppointment.pet_id?.gender 
                    : updatedAppointment.externalPet?.gender
                },
                status: 'pending',
                created_by: req.user._id
              }).save();
            } catch (err) {
              console.error('Error creating lab test:', err);
              // Consider whether to continue or fail the operation
            }
          }

          return {
            service_id: service.service_id,
            service_type: serviceDoc.type,
            sub_service: subService?.name || '',
            extra_service: extraService?.name || '',
            cost: service.cost,
            notes: ''
          };
        })
      );

      // Update health record with services
      healthRecord.services = serviceDetails;

      // Process follow-up info
      if (updatedAppointment.followUpInfo?.needed) {
        healthRecord.follow_up_required = true;
        healthRecord.follow_up_reason = updatedAppointment.followUpInfo.notes || '';
        
        if (updatedAppointment.followUpInfo.date) {
          try {
            const followUpDate = new Date(updatedAppointment.followUpInfo.date);
            if (!isNaN(followUpDate.getTime())) {
              if (updatedAppointment.followUpInfo.time) {
                const [hours, minutes] = updatedAppointment.followUpInfo.time.split(':');
                followUpDate.setHours(parseInt(hours, 10));
                followUpDate.setMinutes(parseInt(minutes, 10));
              }
              healthRecord.follow_up_date = followUpDate;
            }
          } catch (error) {
            console.error('Error processing follow-up date:', error);
          }
        } else if (updatedAppointment.followUpInfo.period) {
          try {
            const periodMatch = updatedAppointment.followUpInfo.period.match(/(\d+)\s*(day|week|month|year)/i);
            if (periodMatch) {
              const amount = parseInt(periodMatch[1]);
              const unit = periodMatch[2].toLowerCase();
              const followUpDate = new Date(updatedAppointment.date);
              
              switch(unit) {
                case 'day': followUpDate.setDate(followUpDate.getDate() + amount); break;
                case 'week': followUpDate.setDate(followUpDate.getDate() + (amount * 7)); break;
                case 'month': followUpDate.setMonth(followUpDate.getMonth() + amount); break;
                case 'year': followUpDate.setFullYear(followUpDate.getFullYear() + amount); break;
              }
              
              if (!isNaN(followUpDate.getTime())) {
                healthRecord.follow_up_date = followUpDate;
              }
            }
          } catch (error) {
            console.error('Error processing follow-up period:', error);
          }
        }
      }

      // Process vaccination doses - UPDATED SECTION
      if (updatedAppointment.vaccinationDoses) {
        const vaccinationRecords = [];
          // Skip if pet_id is not populated or doesn't exist
  
        const doses = updatedAppointment.vaccinationDoses instanceof Map 
          ? Object.fromEntries(updatedAppointment.vaccinationDoses.entries())
          : updatedAppointment.vaccinationDoses;

        for (const [subServiceId, doseInfo] of Object.entries(doses)) {
          const service = updatedAppointment.services.find(s => 
            s.sub_service_id && s.sub_service_id.toString() === subServiceId.toString()
          );
          
          if (service) {
            // Get vaccination details from Vaccination model instead of Service model
            const vaccination = await Vaccination.findOne({ 
              sub_service_id: subServiceId,
              service_id: service.service_id
            });
            
            if (vaccination) {
              const isFinalDose = doseInfo.selectedDose >= vaccination.doseCount;
              let nextDue = null;
              
              if (!isFinalDose) {
                if (updatedAppointment.followUpInfo?.date) {
                  try {
                    const followUpDate = new Date(updatedAppointment.followUpInfo.date);
                    if (!isNaN(followUpDate.getTime())) {
                      if (updatedAppointment.followUpInfo.time) {
                        const [hours, minutes] = updatedAppointment.followUpInfo.time.split(':');
                        followUpDate.setHours(parseInt(hours, 10));
                        followUpDate.setMinutes(parseInt(minutes, 10));
                      }
                      nextDue = followUpDate;
                    }
                  } catch (error) {
                    console.error('Error processing follow-up date for vaccination:', error);
                  }
                } else {
                  // Calculate next due date based on vaccination model's doseInterval
                  try {
                    const appointmentDate = new Date(updatedAppointment.date);
                    if (isNaN(appointmentDate.getTime())) {
                      throw new Error('Invalid appointment date');
                    }

                    // Parse interval from vaccination model (e.g., "4 weeks", "1 year")
                    const intervalParts = vaccination.doseInterval.split(' ');
                    const amount = parseInt(intervalParts[0]) || 1;
                    const unit = intervalParts[1]?.toLowerCase() || 'month';

                    nextDue = new Date(appointmentDate);
                    
                    switch(unit) {
                      case 'year':
                      case 'years':
                        nextDue.setFullYear(nextDue.getFullYear() + amount);
                        break;
                      case 'month':
                      case 'months':
                        nextDue.setMonth(nextDue.getMonth() + amount);
                        break;
                      case 'week':
                      case 'weeks':
                        nextDue.setDate(nextDue.getDate() + (amount * 7));
                        break;
                      case 'day':
                      case 'days':
                        nextDue.setDate(nextDue.getDate() + amount);
                        break;
                      default:
                        nextDue.setMonth(nextDue.getMonth() + amount);
                    }
                  } catch (error) {
                    console.error('Error calculating next due date:', error);
                  }
                }
              }
              
              // Add more detailed vaccination record using data from Vaccination model
              vaccinationRecords.push({
                name: vaccination.name,
                type: vaccination.petTypes.join(', '),
                date: new Date(updatedAppointment.date),
                next_due: nextDue,
                dose_number: doseInfo.selectedDose || 1,
                dose_count: vaccination.doseCount,
                dose_description: `First dose at ${vaccination.firstDoseAge}, then every ${vaccination.doseInterval}`,
                protects_against: vaccination.protectsAgainst,
                is_required: vaccination.isRequired,
                is_completed: isFinalDose
              });
             if (updatedAppointment.pet_id) {
                const pet = await Pet.findById(updatedAppointment.pet_id);
                pet.vaccinations.push({
                  name: vaccination.name,
                  type: vaccination.petTypes.join(', '),
                  date: new Date(updatedAppointment.date),
                  nextDue: nextDue,
                  doseNumber: doseInfo.selectedDose || 1,
                  totalDoses: vaccination.doseCount,
                  clinic: updatedAppointment.clinic_id,
                  vet: updatedAppointment.doctor_id,
                  notes: `Dose ${doseInfo.selectedDose} of ${vaccination.doseCount}`
               });
               await pet.save();
             }else{
               console.log("this appointment for not regestered pet");
             }
        
            } else {
              // Fallback to old behavior if vaccination not found in new model
              const serviceDoc = await VetService.findById(service.service_id);
              if (serviceDoc) {
                const subService = serviceDoc.subServices.find(s => 
                  s._id.toString() === subServiceId.toString()
                );
                
                if (subService) {
                  const isFinalDose = doseInfo.selectedDose >= doseInfo.doseCount;
                  let nextDue = null;
                  
                  if (!isFinalDose && doseInfo.doseInterval) {
                    // Old interval calculation logic
                    try {
                      const appointmentDate = new Date(updatedAppointment.date);
                      if (isNaN(appointmentDate.getTime())) {
                        throw new Error('Invalid appointment date');
                      }

                      if (doseInfo.doseInterval.includes('year')) {
                        const years = parseInt(doseInfo.doseInterval) || 1;
                        nextDue = new Date(appointmentDate);
                        nextDue.setFullYear(nextDue.getFullYear() + years);
                      } else if (doseInfo.doseInterval.includes('month')) {
                        const months = parseInt(doseInfo.doseInterval) || 1;
                        nextDue = new Date(appointmentDate);
                        nextDue.setMonth(nextDue.getMonth() + months);
                      } else if (doseInfo.doseInterval.includes('week')) {
                        const weeks = parseInt(doseInfo.doseInterval) || 1;
                        nextDue = new Date(appointmentDate);
                        nextDue.setDate(nextDue.getDate() + (weeks * 7));
                      }
                    } catch (error) {
                      console.error('Error calculating next due date:', error);
                    }
                  }
                  
                  vaccinationRecords.push({
                    name: doseInfo.name || subService.name,
                    type: doseInfo.type || serviceDoc.type,
                    date: new Date(updatedAppointment.date),
                    next_due: nextDue,
                    dose_number: doseInfo.selectedDose || 1,
                    dose_count: doseInfo.doseCount || 1,
                    dose_description: doseInfo.doseDescription || '',
                    is_completed: isFinalDose
                  });
                }
              }
            }
          }
        }

        healthRecord.vaccinations = vaccinationRecords;
      }

      // Final save of health record
      await healthRecord.save();
    }


    return res.json({
      success: true,
      appointment: updatedAppointment,
      healthRecord: healthRecord
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error updating appointment',
      error: error.message 
    });
  }
});



// delete
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get appointments for pet owner
router.get('/owner', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      owner_id: req.user.userId,
      petType: 'registered' // Only show registered pets
    })
    .populate('pet_id', 'name species breed img_url')
    .populate('clinic_id', 'clinicName')
    .populate('doctor_id', 'name')
    .sort({ date: 1, Time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching owner appointments', error: error.message });
  }
});

// Confirm appointment
router.put('/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('clinic_id', 'email')
      .populate('owner_id', 'fullName email phone');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.owner_id._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to confirm this appointment' });
    }

    // Status remains 'pending' as per requirements
    appointment.updatedAt = new Date();
    await appointment.save();

    // Send notification to clinic - use the same format as appointment creation
    const notificationMessage = `Owner ${appointment.owner_id.fullName} has confirmed their appointment on ${appointment.date.toDateString()} at ${appointment.Time}`;
    
    const notification = await notificationController.createNotification(
      appointment.clinic_id._id,
      notificationMessage,
      `/clinic-appointments`,
      'system',
      req.app.get('wss') // Pass the WebSocket server here
    );
  console.log("Sending confirmation notification to clinic:", appointment.clinic_id._id);
  console.log("WebSocket server available:", !!req.app.get('wss'));
    res.json({ message: 'Appointment confirmed', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Error confirming appointment', error: error.message });
  }
});

// Cancel appointment
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { cancellationReason } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('clinic_id', 'email')
      .populate('doctor_id', 'name')
      .populate('owner_id', 'fullName email phone');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.owner_id._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    // Update appointment status
    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason || 'owner_request';
    appointment.updatedAt = new Date();
    await appointment.save();

    // Send notification to clinic
    const notificationMessage = `Owner ${appointment.owner_id.fullName} has canceled their appointment on ${appointment.date} at ${appointment.Time}. Reason: ${appointment.cancellationReason}`;
    
    await notificationController.createNotification(
      appointment.clinic_id._id,
      notificationMessage,
      `/clinic-appointments`,
      'system',
      req.app.get('wss')
    );

    const doctorNotification = await notificationController.createNotification(
         appointment.doctor_id._id,
         `the Appointment for ${appointment.pet_id.name} on ${appointment.date} was canceled `,
         `/clinic-appointment`,
          'system',
          req.app.get('wss')     
    );
    res.json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling appointment', error: error.message });
    console.log(error);
  }
});

// Email notification endpoint
router.post('/send-email', authMiddleware, async (req, res) => {
  try {
    const { to, subject, ownerid , text, html } = req.body;
    console.log(ownerid);
    const notification = await notificationController.createNotification(
       ownerid,
       text,
       `/home`,
       'system',
       
    );
    req.app.get("sendNotification")(ownerid, notification.message);

    // Configure email transport
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
      },
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject,
      text,
      html
    });

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending notification', error: error.message });
  }
});



router.get('/today', authMiddleware, async (req, res) => {
  try {
    const clinicId = req.query.clinic_id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      clinic_id: clinicId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate({
      path: 'pet_id',
      select: 'name species breed img_url owner_id',
      populate: {
        path: 'owner_id',
        select: 'fullName email phone'
      }
    })
    .populate('owner_id', 'fullName email phone') 
    .populate('doctor_id', 'name specialty')
    .sort({ date: 1, Time: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching today appointments ', error: error.message });
  }
});


// Get appointments for calendar view
router.get('/:id/calendar-appointments', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const appointments = await Appointment.find({
      clinic_id: req.params.id,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: { $ne: 'cancelled' }
    }).select('date Time services expectedEndTime doctor_id status ');
    
    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching appointments',
      error: error.message 
    });
  }
});

// In your appointment routes (server-side)
router.get('/doctor-availability', authMiddleware, async (req, res) => {
  try {
    const { date, doctor_id } = req.query;
    
    // Validate required parameters
    if (!date || !doctor_id) {
      return res.status(400).json({
        message: 'Both date and doctor_id are required parameters'
      });
    }
    
    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        message: 'Invalid date format'
      });
    }
    
    const appointments = await Appointment.find({
      doctor_id,
      date: dateObj,
      status: { $ne: 'cancelled' }
    }).select('date Time expectedEndTime');
    
    res.json(appointments);
  } catch (error) {
    console.error('Error in doctor-availability:', error);
    res.status(500).json({ 
      message: 'Error checking doctor availability',
      error: error.message 
    });
  }
});


// Request reschedule
router.put('/:id/request-reschedule', authMiddleware, async (req, res) => {
  try {
    const { newDate, newTime, reason } = req.body;
    
    // Validate input
    if (!newDate || !newTime) {
      return res.status(400).json({ message: 'New date and time are required' });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('clinic_id')
      .populate('owner_id')
      .populate('doctor_id');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify the requesting user owns the appointment
    if (appointment.owner_id._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to reschedule this appointment' });
    }

    // Calculate expected end time based on services
    let totalDuration = 0;
    for (const service of appointment.services) {
      const serviceDoc = await VetService.findById(service.service_id);
      if (!serviceDoc) continue;
      
      const subService = serviceDoc.subServices.find(
        sub => sub._id.toString() === service.sub_service_id.toString()
      );
      
      if (subService) {
        totalDuration += subService.duration || 30;
        
        if (service.extra_sub_service_id) {
          const extraService = subService.extraServices.find(
            extra => extra._id.toString() === service.extra_sub_service_id.toString()
          );
          if (extraService) {
            totalDuration += extraService.duration || 15;
          }
        }
      }
    }
    
    // Add buffer time
    totalDuration += 5;
    
    // Calculate expected end time
    const [hours, minutes] = newTime.split(':').map(Number);
    const startDate = new Date(newDate);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + totalDuration * 60000);
    const expectedEndTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    // Add reschedule request
    appointment.rescheduleRequests.push({
      requestedDate: new Date(newDate),
      requestedTime: newTime,
      requestedEndTime: expectedEndTime,
      reason: reason || 'No reason provided'
    });

    await appointment.save();

    // Send notification to clinic
    const notificationMessage = `Owner ${appointment.owner_id.fullName} has requested to reschedule appointment for ${appointment.pet_id?.name || appointment.externalPet?.name} to ${new Date(newDate).toLocaleDateString()} at ${newTime}`;
    
    const notification = await notificationController.createNotification(
      appointment.clinic_id._id,
      notificationMessage,
      `/clinic-appointments`,
      'system',
      req.app.get('wss')
    );

    res.json({ 
      message: 'Reschedule request submitted', 
      appointment,
      notification 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error requesting reschedule', 
      error: error.message 
    });
  }
});

// Approve reschedule request
router.put('/:id/approve-reschedule/:requestId', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('clinic_id')
      .populate('owner_id')
      .populate('doctor_id');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify the requesting user is from the clinic
    if (appointment.clinic_id._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to approve this reschedule' });
    }

    const rescheduleRequest = appointment.rescheduleRequests.id(req.params.requestId);
    if (!rescheduleRequest) {
      return res.status(404).json({ message: 'Reschedule request not found' });
    }

    if (rescheduleRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Reschedule request already processed' });
    }

    // Update appointment details
    appointment.date = rescheduleRequest.requestedDate;
    appointment.Time = rescheduleRequest.requestedTime;
    appointment.expectedEndTime = rescheduleRequest.requestedEndTime;
    
    // Update reschedule request status
    rescheduleRequest.status = 'approved';
    rescheduleRequest.respondedAt = new Date();

    await appointment.save();

    // Send notification to owner
    const notificationMessage = `Your appointment for ${appointment.pet_id?.name || appointment.externalPet?.name} has been rescheduled to ${appointment.date.toLocaleDateString()} at ${appointment.Time}`;
    
    const notification = await notificationController.createNotification(
      appointment.owner_id._id,
      notificationMessage,
      `/appointments`,
      'system',
      req.app.get('wss')
    );

    res.json({ 
      message: 'Reschedule approved', 
      appointment,
      notification 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error approving reschedule', 
      error: error.message 
    });
  }
});

// Reject reschedule request
router.put('/:id/reject-reschedule/:requestId', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('clinic_id')
      .populate('owner_id')
      .populate('doctor_id');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Verify the requesting user is from the clinic
    if (appointment.clinic_id._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to reject this reschedule' });
    }

    const rescheduleRequest = appointment.rescheduleRequests.id(req.params.requestId);
    if (!rescheduleRequest) {
      return res.status(404).json({ message: 'Reschedule request not found' });
    }

    if (rescheduleRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Reschedule request already processed' });
    }

    // Update reschedule request status
    rescheduleRequest.status = 'rejected';
    rescheduleRequest.reason = reason || 'No reason provided';
    rescheduleRequest.respondedAt = new Date();

    await appointment.save();

    // Send notification to owner
    const notificationMessage = `Your reschedule request for ${appointment.pet_id?.name || appointment.externalPet?.name} has been rejected. ${reason ? `Reason: ${reason}` : ''}`;
    
    const notification = await notificationController.createNotification(
      appointment.owner_id._id,
      notificationMessage,
      `/appointments`,
      'system',
      req.app.get('wss')
    );

    res.json({ 
      message: 'Reschedule rejected', 
      appointment,
      notification 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error rejecting reschedule', 
      error: error.message 
    });
  }
});

router.get('/reminder-count', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      owner_id: req.user.userId,
      status: 'pending',
      'reminders.dayBeforeSent': true
    });
    
    res.json({ count: appointments.length });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointment count' });
  }
});



function setupAppointmentReminders(wss) {
  // Check every minute for appointments due in 1 day
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
            
      // Create both 24-hour and 12-hour format times for matching
      const currentTime24 = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      const currentTime12 = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });  

      console.log(`[${now.toISOString()}] Checking for upcoming appointment reminder at:`, {
        '24-hour': currentTime24,
        '12-hour': currentTime12
      });

      // Find appointments happening in exactly 24 hours
      const upcomingAppointments = await Appointment.find({
        date: {
          $gte: new Date(oneDayLater.setHours(oneDayLater.getHours(), 0, 0, 0)),
          $lt: new Date(oneDayLater.setHours(oneDayLater.getHours(), 59, 59, 999))
        },
        status: 'pending',
        'reminders.dayBeforeSent': { $ne: true }
      }).populate('owner_id').populate('pet_id');

      console.log(`Found ${upcomingAppointments.length} upcoming appointments need reminder`);
      
      
      for (const appointment of upcomingAppointments) {
          // Skip if owner_id is not populated or doesn't exist
       if (!appointment.owner_id || !appointment.owner_id._id) {
          console.warn('Skipping appointment with missing owner:', appointment._id);
          continue;
       }

          // Skip if pet_id is not populated or doesn't exist
        if (!appointment.pet_id || !appointment.pet_id.name) {
          console.warn('Skipping appointment with missing pet:', appointment._id);
           continue;
        }

        console.log(`send appointment notification for ${appointment.pet_id.name}`);
        // Send notification
        await notificationController.createNotification(
          appointment.owner_id._id,
          `Reminder: You have an appointment for ${appointment.pet_id.name} tomorrow at ${appointment.Time} Click to confirm or make changes.`,
          '/appointments-reminder',
          'system',
            wss

        );

        // Mark as sent
        appointment.reminders = appointment.reminders || {};
        appointment.reminders.dayBeforeSent = true;
        await appointment.save();
      }
    } catch (error) {
      console.error('Error in 1-day appointment reminder:', error);
    }
  });

  // Check every minute for appointments due in 1 hour
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
            
      // Create both 24-hour and 12-hour format times for matching
      const currentTime24 = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      const currentTime12 = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });  

      console.log(`[${now.toISOString()}] Checking for upcoming appointment reminder (before one hour) at:`, {
        '24-hour': currentTime24,
        '12-hour': currentTime12
      });

      // Find appointments happening in exactly 1 hour
      const upcomingAppointments = await Appointment.find({
        date: {
          $gte: new Date(oneHourLater.setHours(oneHourLater.getHours(), 0, 0, 0)),
          $lt: new Date(oneHourLater.setHours(oneHourLater.getHours(), 59, 59, 999))
        },
        status: 'pending',
        'reminders.hourBeforeSent': { $ne: true }
      }).populate('owner_id').populate('pet_id');

      for (const appointment of upcomingAppointments) {
        // Send notification
        await notificationController.createNotification(
          appointment.owner_id._id,
          `Reminder: You have an appointment for ${appointment.pet_id.name} in 1 hour at ${appointment.Time}`,
          '/appointments-reminder',
          'system',
           wss
        );

        // Mark as sent
        appointment.reminders = appointment.reminders || {};
        appointment.reminders.hourBeforeSent = true;
        await appointment.save();
      }
    } catch (error) {
      console.error('Error in 1-hour appointment reminder:', error);
    }
  });
}

exports.router = router;
exports.setupAppointmentReminders = setupAppointmentReminders;
