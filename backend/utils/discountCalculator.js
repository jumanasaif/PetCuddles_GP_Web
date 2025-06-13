// Create a new file: utils/discountCalculator.js
const calculateDiscount = async (petId, appointmentDate) => {
    const Appointment = require('../models/Appointments');
    const Pet = require('../models/Pet');
    
    const pet = await Pet.findById(petId);
    if (!pet) return { discount: 0, reason: '' };
  
    // Check if loyalty card is active
    if (pet.hasLoyaltyCard && pet.loyaltyCardEndDate >= new Date()) {
      return { discount: 15, reason: 'Loyalty card discount' };
    }
  
    // Get all completed appointments for this pet
    const appointments = await Appointment.find({
      pet_id: petId,
      status: 'completed'
    }).sort({ date: 1 });
  
    // Pattern 1: Two appointments within 30 days
    if (appointments.length >= 1) {
      const lastAppointment = appointments[appointments.length - 1];
      const daysBetween = (appointmentDate - lastAppointment.date) / (1000 * 60 * 60 * 24);
      
      if (daysBetween <= 30) {
        return { discount: 20, reason: 'Recurring visit within 30 days' };
      }
    }
  
    // Pattern 2: 3 consecutive monthly visits
    if (appointments.length >= 2) {
      let consecutiveMonths = 1;
      let currentMonth = new Date(appointmentDate).getMonth();
      let currentYear = new Date(appointmentDate).getFullYear();
      
      // Check previous months
      for (let i = appointments.length - 1; i >= 0; i--) {
        const apptMonth = new Date(appointments[i].date).getMonth();
        const apptYear = new Date(appointments[i].date).getFullYear();
        
        if ((currentYear === apptYear && currentMonth - 1 === apptMonth) ||
            (currentYear - 1 === apptYear && currentMonth === 0 && apptMonth === 11)) {
          consecutiveMonths++;
          currentMonth = apptMonth;
          currentYear = apptYear;
        } else {
          break;
        }
        
        if (consecutiveMonths >= 3) {
          // Update pet with loyalty card
          const startDate = new Date(appointmentDate);
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 6);
          
          await Pet.findByIdAndUpdate(petId, {
            hasLoyaltyCard: true,
            loyaltyCardStartDate: startDate,
            loyaltyCardEndDate: endDate,
            consecutiveMonthsVisited: 0
          });
          
          return { discount: 15, reason: 'Loyalty card earned (3 consecutive months)' };
        }
      }
    }
  
    return { discount: 0, reason: '' };
  };
  
  module.exports = { calculateDiscount };
