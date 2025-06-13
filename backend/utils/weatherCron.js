// utils/weatherCron.js
const axios = require('axios');
const TemperatureAlert = require('../models/TemperatureAlert');
const User = require('../models/User');
const UserAlert = require('../models/UserAlert');
const Notification = require('../models/Notifications');
require('dotenv').config();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

async function checkWeatherAndCreateAlerts() {
  try {
    const citiesToMonitor = ['Gaza', 'Ramallah', 'Hebron', 'Nablus', 'Jenin'];
    
    const weatherChecks = await Promise.all(
      citiesToMonitor.map(async (city) => {
        try {
          const response = await axios.get(WEATHER_API_URL, {
            params: {
              q: city,
              appid: WEATHER_API_KEY,
              units: 'metric'
            }
          });
          
          return {
            city,
            temp: response.data.main.temp,
            conditions: response.data.weather[0].main
          };
        } catch (error) {
          console.error(`Error fetching weather for ${city}:`, error.message);
          return null;
        }
      })
    );

    const validChecks = weatherChecks.filter(check => check !== null);
    
    // Check against thresholds and create alerts if needed
    const highTempThreshold = 30; // Example threshold
    const lowTempThreshold = 5;   // Example threshold
    
    const alertsCreated = [];
    
    for (const check of validChecks) {
      if (check.temp >= highTempThreshold) {
        const alert = new TemperatureAlert({
          thresholdType: 'high',
          temperature: check.temp,
          severity: check.temp > 35 ? 'extreme' : check.temp > 30 ? 'danger' : 'warning',
          affectedSpecies: ['dog', 'cat'], // Default affected species
          regions: [check.city],
          message: `High temperature warning for ${check.city}: ${check.temp}°C`,
          createdBy: null // System-generated
        });
        
        await alert.save();
        await notifyAffectedUsers(alert);
        alertsCreated.push(alert);
      }
      
      if (check.temp <= lowTempThreshold) {
        const alert = new TemperatureAlert({
          thresholdType: 'low',
          temperature: check.temp,
          severity: check.temp < 0 ? 'extreme' : check.temp < 5 ? 'danger' : 'warning',
          affectedSpecies: ['dog', 'cat'], // Default affected species
          regions: [check.city],
          message: `Low temperature warning for ${check.city}: ${check.temp}°C`,
          createdBy: null // System-generated
        });
        
        await alert.save();
        await notifyAffectedUsers(alert);
        alertsCreated.push(alert);
      }
    }

    console.log(`Weather check completed. Created ${alertsCreated.length} alerts.`);
    return alertsCreated;
  } catch (error) {
    console.error('Error in weather check cron job:', error);
    return [];
  }
}

async function notifyAffectedUsers(alert) {
  try {
    // Find users in affected regions with pets of affected species
    const users = await User.find({
      $or: [
        { city: { $in: alert.regions } },
        { village: { $in: alert.regions } }
      ],
      pets: {
        $elemMatch: {
          species: { $in: alert.affectedSpecies }
        }
      }
    }).populate('pets');

    // Create notifications for each user
    for (const user of users) {
      const affectedPets = user.pets.filter(pet => 
        alert.affectedSpecies.includes(pet.species)
      );
      
      // Create a notification for each affected pet
      for (const pet of affectedPets) {
        const notification = new Notification({
          userId: user._id,
          petId: pet._id,
          message: alert.message || 
            `${alert.thresholdType === 'high' ? 'High' : 'Low'} temperature warning (${alert.temperature}°C) - ${pet.name} may be affected`,
          type: 'weather-alert',
          severity: alert.severity,
          link: '/current-weather-alerts'
        });

        await notification.save();

        // Send real-time notification via WebSocket
        const io = req.app.get('io');
        if (io && activeConnections[user._id.toString()]) {
          io.to(user._id.toString()).emit('notification', {
            type: 'weather-alert',
            message: notification.message,
            severity: notification.severity,
            petId: notification.petId,
            createdAt: notification.createdAt
          });
        }
      }
    }

    console.log(`Sent weather alerts to ${users.length} users`);
  } catch (error) {
    console.error('Error notifying users:', error);
  }
}

module.exports = { checkWeatherAndCreateAlerts };