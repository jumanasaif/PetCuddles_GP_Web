const cron = require('node-cron');
const Pet = require('../models/Pet');
const Notification = require('../models/Notifications'); // Make sure this is imported
const WebSocket = require('ws'); // Import WebSocket if needed

async function sendFeedingReminder(pet, meal, recipientId, io) {
    try {
        // Defensive check to avoid crashing if invalid inputs
        if (!pet || !meal || !recipientId) {
            console.error('Invalid parameters passed to sendFeedingReminder');
            return;
        }

        // Build meal description safely
        const mealDescriptionParts = [];
        if (meal.portionSize) mealDescriptionParts.push(`${meal.portionSize}`);
        if (meal.calories) mealDescriptionParts.push(`${meal.calories} kcal`);
        mealDescriptionParts.push(meal.foodType ? `of ${meal.foodType}` : 'of food');

        const mealDescription = mealDescriptionParts.join(' ');

        const message = `Time to feed ${pet.name}! Give ${mealDescription}.`;

        // Send WebSocket notification if io is available
        if (io && typeof io.get === 'function') {
            try {
                io.get("sendNotification")(recipientId, message, {
                    link: `/pet-profile/${pet._id}`,
                    type: "feeding-reminder",
                    petId: pet._id,
                    mealTime: meal.time
                });
            } catch (wsError) {
                console.error('WebSocket error in sendFeedingReminder:', wsError);
            }
        }

        // Save notification to database
        try {
            const notification = await Notification.create({
                userId: recipientId,
                message: message,
                link: `/pet-profile/${pet._id}`,
                type: 'feeding',
                read: false
            });

            return notification;
        } catch (dbError) {
            console.error('Database notification error:', dbError);
            throw dbError;
        }

    } catch (error) {
        console.error('Error in sendFeedingReminder:', error);
        throw error;
    }
}

function scheduleFeedingReminders(io) {
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            // Create both 24-hour and 12-hour format times for matching
            const currentTime24 = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            const currentTime12 = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            
            console.log(`[${now.toISOString()}] Checking for meals at:`, {
                '24-hour': currentTime24,
                '12-hour': currentTime12
            });

            // Find pets with current meal time (matching either format)
            const pets = await Pet.find({
                $or: [
                    { 'feedingSchedule.mealTimes.time': currentTime24 },
                    { 'feedingSchedule.mealTimes.time': currentTime12 }
                ],
                'feedingSchedule.remindersEnabled': true,
          
            }).populate('owner_id').populate('temporaryCaretaker.userId');
            
            console.log(`Found ${pets.length} pets needing feeding reminders`);

            for (const pet of pets) {
                try {
                    // Try both time formats when finding the meal
                    const meal = pet.feedingSchedule.mealTimes.find(m => 
                        m.time === currentTime24 || m.time === currentTime12
                    );
                    
                    if (!meal) {
                        console.log(`No matching meal found for ${pet.name}`);
                        continue;
                    }

                    // Check if meal was already given today
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    
                    const alreadyGiven = pet.feedingHistory.some(entry => {
                        const entryTime = entry.mealTime;
                        const matchesTime = entryTime === currentTime24 || entryTime === currentTime12;
                        return matchesTime && entry.status === 'given' && new Date(entry.date) >= todayStart;
                    });

                    if (!alreadyGiven) {
                        console.log(`Sending reminder for ${pet.name} at ${currentTime24}`);

                        // Determine recipient
                        let recipientId;
                        if (pet.adoption_status === 'temporarilyAdopted' && 
                            pet.temporaryCaretaker?.userId?._id &&
                            pet.temporaryCaretaker.status === 'active') {
                            recipientId = pet.temporaryCaretaker.userId._id;
                        } else {
                            recipientId = pet.owner_id._id;
                        }

                        // Send notification
                        await sendFeedingReminder(pet, meal, recipientId, io);
                        console.log(`Notification sent to ${recipientId}`);

                        // Update pet record
                        pet.feedingHistory.push({
                            mealTime: currentTime24, // Store in 24-hour format for consistency
                            status: 'pending',
                            date: now,
                            notes: 'Meal reminder sent'
                        });

                        pet.feedingSchedule.lastNotificationSent = now;
                        await pet.save();
                    } else {
                        console.log(`Meal already given to ${pet.name} at ${currentTime24}`);
                    }
                } catch (petError) {
                    console.error(`Error processing pet ${pet._id}:`, petError);
                }
            }
        } catch (mainError) {
            console.error('Error in scheduleFeedingReminders:', mainError);
        }
    });
}

// Daily check for skipped meals
function checkSkippedMeals(io) {
    cron.schedule('0 0 * * *', async () => { // Runs at midnight every day
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Find pets with feeding history from yesterday
            const pets = await Pet.find({
                'feedingSchedule.remindersEnabled': true,
                'feedingHistory': {
                    $elemMatch: {
                        date: { $gte: yesterday, $lt: today }
                    }
                }
            }).populate('owner_id').populate('temporaryCaretaker.userId');

            for (const pet of pets) {
                try {
                    // Count skipped meals yesterday
                    const skippedMeals = pet.feedingHistory.filter(entry => 
                        new Date(entry.date) >= yesterday && 
                        new Date(entry.date) < today &&
                        entry.status === 'skipped'
                    ).length;

                    const totalMeals = pet.feedingSchedule.mealTimes.length;
                    
                    // If more than half of meals were skipped
                    if (skippedMeals > totalMeals / 2) {
                        // Determine recipient based on adoption status
                        let recipientId;
                        let recipientType = 'owner';
                        
                        if (pet.adoption_status === 'temporarilyAdopted' && 
                            pet.temporaryCaretaker?.userId?._id &&
                            pet.temporaryCaretaker.status === 'active') {
                            recipientId = pet.temporaryCaretaker.userId._id;
                            recipientType = 'temporary caretaker';
                        } else {
                            recipientId = pet.owner_id._id;
                        }

                        // Send notification
                        const message = `Warning: ${pet.name} missed ${skippedMeals} of ${totalMeals} meals yesterday!`;
                        
                        try {
                            const notification = await Notification.create({
                                userId: recipientId,
                                message: message,
                                link: `/pet-profile/${pet._id}`,
                                type: 'warning',
                                read: false
                            });

                            console.log(`Skipped meals notification sent to ${recipientType} (${recipientId})`);

                            // Send via WebSocket if available
                            if (io && io.clients) {
                                io.clients.forEach(client => {
                                    if (client.userId === recipientId.toString() && client.readyState === WebSocket.OPEN) {
                                        client.send(JSON.stringify({
                                            type: "warning",
                                            message: message,
                                            link: `/pet-profile/${pet._id}`,
                                            petId: pet._id
                                        }));
                                    }
                                });
                            }
                        } catch (notificationError) {
                            console.error(`Failed to send skipped meals notification to ${recipientType} (${recipientId}):`, notificationError);
                        }
                    }
                } catch (petError) {
                    console.error(`Error processing pet ${pet._id}:`, petError);
                }
            }
        } catch (mainError) {
            console.error('Error in checkSkippedMeals:', mainError);
        }
    });
}

module.exports = {
    scheduleFeedingReminders,
    checkSkippedMeals,
    sendFeedingReminder
};
