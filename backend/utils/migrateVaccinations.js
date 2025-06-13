// scripts/migrateVaccinations.js
const mongoose = require('mongoose');
const VetService = require('../models/VetService');
const Vaccination = require('../models/Vaccination');
require('dotenv').config();

const migrateVaccinations = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/petCuddlesDB');
    
    const vaccinationServices = await VetService.find({ type: 'vaccination' });
    
    for (const service of vaccinationServices) {
      console.log(`Processing service: ${service._id}`);
      
      // Check if vaccinations already exist for this service
      const existingCount = await Vaccination.countDocuments({ service_id: service._id });
      if (existingCount > 0) {
        console.log(`- Skipping, already has ${existingCount} vaccinations`);
        continue;
      }
      
      // Create vaccination entries for each sub-service
      for (const subService of service.subServices) {
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
        
        console.log(`- Created vaccination for sub-service: ${subService.name}`);
      }
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateVaccinations();
