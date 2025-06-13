// middleware/vaccinationSync.js
const Vaccination = require('../models/Vaccination');
const VetService = require('../models/VetService');

const syncVaccinations = async (service) => {
  if (service.type !== 'vaccination') return;

  try {
    // Find existing vaccinations for this service
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

module.exports = { syncVaccinations };