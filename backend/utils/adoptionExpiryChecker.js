const Pet = require('../models/Pet');
const Notification = require('../models/Notifications');
const User = require('../models/User');
const cron = require('node-cron');
const mongoose = require('mongoose');
const notificationController = require("../controllers/notificationController");


function generateToastMessage(message) {
  return {
    type: 'notification', // Make sure this matches your frontend check
    message,
    options: {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'light' // Add this to identify adoption notifications
    }
  };
}



const scheduleExpirationCheck = async (petId, endDate) => {
  try {
    const now = new Date();
    const timeRemaining = new Date(endDate) - now;
    
    if (timeRemaining <= 0) {
      await checkAndHandleExpiration(petId);
      return;
    }

    const pet = await Pet.findById(petId);
    if (!pet) return;

    const startDate = new Date(pet.temporaryCaretaker.startDate);
    const totalDays = Math.ceil((new Date(endDate) - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

    console.log(`[DEBUG] Pet ${petId}: Total days: ${totalDays}, Days remaining: ${daysRemaining}`);

    // Schedule last-day notification and expiration
    setTimeout(async () => {
      await sendLastDayNotification(petId);
      setTimeout(async () => {
        await checkAndHandleExpiration(petId);
      }, 1000 * 60 * 60); // 1 hour later
    }, timeRemaining);

    // New warning logic: Always warn 1 day before, and 2 days before if possible
    const warningTimes = [];
    if (daysRemaining >= 1) warningTimes.push(1); // Warn 1 day before
    if (daysRemaining >= 2) warningTimes.push(2); // Warn 2 days before if possible
    if (daysRemaining >= 3) warningTimes.push(3); // Warn 3 days before if possible

    for (const daysBefore of warningTimes) {
      const warningTime = timeRemaining - (daysBefore * 24 * 60 * 60 * 1000);
      if (warningTime > 0) {
        setTimeout(async () => {
          console.log(`[DEBUG] Sending ${daysBefore}-day warning for pet ${petId}`);
          await sendExtensionWarning(petId, daysBefore);
        }, warningTime);
      }
    }
  } catch (error) {
    console.error('Error in scheduleExpirationCheck:', error);
  }
};


async function sendLastDayNotification(petId) {
  try {
    const pet = await Pet.findById(petId)
      .populate('owner_id')
      .populate('temporaryCaretaker.userId');
    
    if (!pet || pet.temporaryCaretaker.status !== 'active') return;

    const ownerMsg = `Today is the last day of the temporary adoption period for ${pet.name}. The adoption will end automatically.`;
    const caretakerMsg = `Today is the last day of your temporary care period for ${pet.name}.`;



    await notificationController.createNotification(
        pet.owner_id._id,
        `Today is the last day of the temporary adoption period for ${pet.name}. The adoption will end automatically.`  ,     
        `/${pet._id}/extend-adoption`,
        'adoption',
        
     );
    

 
  

    

  } catch (error) {
    console.error(`[ERROR] Failed to send last-day notification for pet ${petId}:`, error);
  }
}


async function checkAndHandleExpiration(petId) {
  const pet = await Pet.findById(petId)
    .populate('owner_id')
    .populate('temporaryCaretaker.userId');

  if (!pet || pet.temporaryCaretaker.status !== 'active') return;

  // Check if there's at least one extension request
  const hasExtensionRequests = pet.extensionRequests.length > 0;
  
  // Get the most recent extension request (if any)
  const lastExtensionRequest = hasExtensionRequests 
    ? pet.extensionRequests[pet.extensionRequests.length - 1]
    : null;

  // Determine if the last request was rejected
  const hadRejectedRequest = lastExtensionRequest?.status === 'rejected';

  // Prepare notifications based on whether there was a rejected request
  let ownerMsg;
  if (hadRejectedRequest) {
    ownerMsg = `The temporary adoption period for ${pet.name} has ended. Would you like to put ${pet.name} up for adoption again or find a vet for temporary care?`;
  } else {
    ownerMsg = `The temporary adoption period for ${pet.name} has ended. Would you like to put ${pet.name} up for adoption again or find a vet for temporary care?`;
  }

  const caretakerMsg = `Your temporary care period for ${pet.name} has officially ended.`;

  // Create notifications
  const notifications = await Notification.create([
    {
      userId: pet.owner_id._id,
      message: ownerMsg,
      type: 'adoption',
      link: `/${pet._id}/post-adoption-options`,
      read: false
    },
    {
      userId: pet.temporaryCaretaker.userId._id,
      message: caretakerMsg,
      type: 'adoption',
      read: false
    }
  ]);

  // Update pet status
  pet.temporaryCaretaker.status = 'completed';
  pet.temporaryCaretaker.userId = null;
  pet.temporaryCaretaker.startDate = null;
  pet.temporaryCaretaker.endDate = null;
  pet.adoption_status = 'notAvailable';
  await pet.save();

  return {
    ownerNotification: notifications[0],
    caretakerNotification: notifications[1]
  };
}



async function sendExtensionWarning(petId, daysBefore) {
  try {
    const pet = await Pet.findById(petId)
      .populate('owner_id')
      .populate('temporaryCaretaker.userId');
    
    if (!pet || pet.temporaryCaretaker.status !== 'active') return;

    const ownerMsg = `Tomorrow is the last day in the temporary adoption period for ${pet.name} . Would you like to extend it?`;
    const caretakerMsg = `Tomorrow is the last day for your temporary care period for ${pet.name}.`;

    // Create notifications in database
    const [ownerNotification, caretakerNotification] = await Notification.create([
      {
        userId: pet.owner_id._id,
        message: ownerMsg,
        link: `/${pet._id}/extend-adoption`,
        type: 'adoption',
        read: false
      },
      {
        userId: pet.temporaryCaretaker.userId._id,
        message: caretakerMsg,
        type: 'adoption',
        read: false
      }
    ]);

    console.log(`[SUCCESS] Sent ${daysBefore}-day warning for pet ${pet.name}`);

    return {
      ownerNotification,
      caretakerNotification
    };
    
  } catch (error) {
    console.error(`[ERROR] Failed to send warning for pet ${petId}:`, error);
  }
}


// Daily checker as a backup system
function setupDailyExpirationChecker() {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      console.log(`[CRON] Running at ${now}`);

      const pets = await Pet.find({
        'temporaryCaretaker.status': 'active',
        'temporaryCaretaker.endDate': { $exists: true }
      }).populate('owner_id').populate('temporaryCaretaker.userId');

      console.log(`[CRON] Found ${pets.length} pets to check.`);

      // Process pets in parallel but handle notifications sequentially
      await Promise.all(pets.map(async (pet) => {
        try {
          const endDate = new Date(pet.temporaryCaretaker.endDate);
          console.log(`endDate is : ${endDate}`);

          const timeRemaining = endDate - now;
          console.log(`timeRemaining is : ${timeRemaining}`);

          const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
          console.log(`daysRemaining is : ${daysRemaining}`);

          console.log(`Processing pet ${pet.name}: ${daysRemaining} days remaining`);

          if (daysRemaining > 1) {
            await checkAndHandleExpiration(pet._id);
          } else if (daysRemaining === 1) {
            await sendLastDayNotification(pet._id);
          } else if (timeRemaining === 2) {
            await sendExtensionWarning(pet._id,2)
          }

        } catch (error) {
          console.error(`Error processing pet ${pet._id}:`, error);
        }
      }));
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });
}


module.exports={
  setupDailyExpirationChecker,
  scheduleExpirationCheck,
  sendExtensionWarning
};