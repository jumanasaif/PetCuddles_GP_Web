const express = require("express");
const router = express.Router();
const Pet = require("../models/Pet"); // Import Pet model
const LostPet = require('../models/LostPet'); 
const RabbitBreed = require('../models/RabbitBreed');
const SheepBreed = require('../models/SheepBreed');
const CowBreed = require('../models/CowBreed');
const Adoption = require("../models/Adoption");
const FoundPet = require("../models/FoundPet");
const AdoptionQuestion = require("../models/AdoptionQuestions");
const AdoptionRequest = require("../models/AdoptionRequest");
const notificationController = require("../controllers/notificationController");
const adoptionController = require('../controllers/AdoptionController');
const authMiddleware = require("../middleware/authMiddleware"); // Import auth middleware
const User = require("../models/User");
const Post = require("../models/Post");
const healthRecordController = require('../controllers/pethealthRecord');
const upload = require('../config/multer');
const UserAlert = require('../models/UserAlert');
const TemperatureAlert = require('../models/TemperatureAlert');
const Notification = require('../models/Notifications');



router.get('/current-weather-alerts', authMiddleware, async (req, res) => {
  try {
    // Get user basic info
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userLocations = [user.city].filter(Boolean);

    // Get the user's pets manually
    const pets = await Pet.find({
      $or: [
        { owner_id: req.user.userId },
        { 'temporaryCaretaker.userId': req.user.userId }
      ]
    });

    const petSpecies = pets.map(pet => pet.species);

    // Now use locations and pet species to find active alerts
    const activeAlerts = await TemperatureAlert.find({
      isActive: true,
      $or: [
        { regions: { $in: userLocations } },
        { affectedSpecies: { $in: petSpecies } }
      ]
    }).sort({ severity: -1, createdAt: -1 });

    res.json(activeAlerts);
  } catch (error) {
    console.error('Error in /current-weather-alerts:', error);
    res.status(500).json({ message: 'Error fetching current alerts' });
  }
});

// Get weather alerts for user
router.get('/weather-alerts/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.userId,
      type: 'weather-alert'
    })
    .sort({ createdAt: -1 })
    .populate('petId', 'name species img_url');
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching weather alerts' });
  }
});

// Mark weather alert as read
router.put('/weather-alerts/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});




router.get('/rabbit-breeds', async (req, res) => {
    try {
        const breeds = await RabbitBreed.find({});
        res.json(breeds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/sheep-breeds', async (req, res) => {
  try {
      const breeds = await SheepBreed.find({});
      res.json(breeds);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


router.get('/cow-breeds', async (req, res) => {
  try {
      const breeds = await CowBreed.find({});
      res.json(breeds);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


router.put('/:id/weight', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Always create a new history entry
    pet.weight_history.push({
      weight: req.body.weight,
      notes: req.body.notes || `Weight updated to ${req.body.weight}kg`
    });

    // Update current weight
    pet.weight = req.body.weight;

    const updatedPet = await pet.save();
    res.json({ pet: updatedPet });
  } catch (error) {
    res.status(500).json({ message: 'Error updating pet weight', error: error.message });
  }
});



// Secure route to get pets for the logged-in user
router.get('/user-pets', authMiddleware, async (req, res) => {
  try {
    const pets = await Pet.find({
      $or: [
        { owner_id: req.user.userId },
        { 'temporaryCaretaker.userId': req.user.userId }
      ]
    });
    res.json({ pets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// get temporary care pets
router.get('/temporary-care', authMiddleware, async (req, res) => {
  try {
    const pets = await Pet.find({
      'temporaryCaretaker.userId': req.user.userId,
      'temporaryCaretaker.status': 'active'
    }).populate('owner_id', 'fullName email');
    
    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




// Route to add a new pet
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { name, species, breed, birth_date, age, weight, gender, health_status, img_url } = req.body;
        
        // Get the owner's ID from the authenticated token
        const owner_id = req.user.userId;
        
        // Create a new pet instance
        const newPet = new Pet({
            owner_id,
            name,
            species,
            breed,
            birth_date,
            age,
            weight,
            gender,
            health_status,
            img_url,
            
        });

        // Save pet to database
        await newPet.save();

        res.status(201).json({ success: true, message: "Pet added successfully!", pet: newPet });
    } catch (error) {
        console.error("Error adding pet:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});


// Route to delete a pet
router.delete("/:petId", authMiddleware, async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user.userId; // Get user ID from token

        // Find pet by ID
        const pet = await Pet.findById(petId);

        if (!pet) {
            return res.status(404).json({ message: "Pet not found" });
        }

        // Check if the logged-in user is the owner of the pet
        if (pet.owner_id.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized to delete this pet" });
        }

        // Delete pet from database
        await Pet.findByIdAndDelete(petId);

        res.status(200).json({ message: "Pet deleted successfully" });
    } catch (error) {
        console.error("Error deleting pet:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Route to update a pet's details
router.put("/:petId", authMiddleware, async (req, res) => {
    try {
        const { petId } = req.params;
        const userId = req.user.userId; // Get user ID from token
        const updateData = req.body; // New pet data

        // Find pet by ID
        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({ message: "Pet not found" });
        }

        // Check if the logged-in user is the owner of the pet
        if (pet.owner_id.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized to update this pet" });
        }

        // Update pet details
        const updatedPet = await Pet.findByIdAndUpdate(petId, updateData, { new: true });

        res.status(200).json({ message: "Pet updated successfully", pet: updatedPet });
    } catch (error) {
        console.error("Error updating pet:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Route to get a specific pet by petId
router.get("/id/:petId", authMiddleware, async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.user.userId;

    // Find pet where user is either owner or temporary caretaker
    let pet = await Pet.findOne({
      _id: petId,
      $or: [
        { owner_id: userId },
        { 'temporaryCaretaker.userId': userId }
      ]
    }).populate('owner_id');

    if (!pet) {
      return res.status(404).json({ message: "Pet not found or unauthorized" });
    }

    // Initialize feedingSchedule if it doesn't exist
    if (!pet.feedingSchedule) {
      pet.feedingSchedule = {
        mealsPerDay: 2, // Default value
        mealTimes: [],
        remindersEnabled: true,
        lastNotificationSent: null
      };
      await pet.save();
    }

    const adoptionRequest = await AdoptionRequest.findOne({ 
      pet_id: petId,
      status: 'approved'
    });

    res.status(200).json({ 
      pet,
      AdoptionType: adoptionRequest?.adoption_type 
    });
  } catch (error) {
    console.error("Error fetching pet data:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Route to report a lost pet
router.post('/lostpets', authMiddleware, async (req, res) => {
  const { pet_id, last_seen_location, last_seen_date, last_seen_time, distinctive_features, reward, additional_details } = req.body;
  const owner_id = req.user.userId;
  const userRole = req.user.role; // Get the user's role from the token

  try {
      // Fetch the pet and owner details
      const pet = await Pet.findById(pet_id);
      const owner = await User.findById(owner_id);

      if (!pet || !owner) {
          return res.status(404).json({ message: 'Pet or owner not found' });
      }

      // Determine the correct user model reference
      let userModel;
      switch(userRole) {
          case 'pet_owner': userModel = 'User'; break;
          case 'user': userModel = 'User'; break;
          case 'clinic': userModel = 'Clinic'; break;
          case 'vet': userModel = 'Clinic'; break;
          case 'doctor': userModel = 'Doctor'; break;
          case 'shop': userModel = 'Shop'; break;
          case 'admin': userModel = 'Admin'; break;
          default: throw new Error('Invalid user role');
      }

      // Create the post content
      const postContent = `
          <h2>🚨 LOST PET ALERT 🚨</h2>
          <p><strong>Name:</strong> ${pet.name}</p>
          <p><strong>Last Seen Location:</strong> ${last_seen_location}</p>
          <p><strong>Last Seen Date:</strong> ${new Date(last_seen_date).toLocaleDateString()}</p>
          <p><strong>Last Seen Time:</strong> ${last_seen_time}</p>
          <p><strong>Distinctive Features:</strong> ${distinctive_features}</p>
          <p><strong>Reward:</strong> ${reward ? reward : 'No reward'}</p>
          #lost
      `;

      // Create the post with the new model structure
      const newPost = new Post({
          content: postContent,
          user: owner_id,
          userModel: userModel,
          img_url: pet.img_url || null,
          hashtags: ['lost'],
          likes: [],
          likesModel: [],
          comments: []
      });
      
      const savedPost = await newPost.save();

      // Create the lost pet report
      const lostPet = new LostPet({
          pet_id,
          owner_id,
          last_seen_location,
          last_seen_date,
          last_seen_time,
          distinctive_features,
          reward,
          additional_details,
          status: 'lost',
          postId: savedPost._id,
      });
      
      const savedLostPet = await lostPet.save();
       
      res.status(201).json({ 
          lostPet: savedLostPet, 
          post: savedPost, 
          postId: savedPost._id 
      });
  } catch (error) {
      console.error('Error reporting lost pet:', error);
      res.status(500).json({ message: 'Error reporting lost pet' });
  }
});

// Route to check if pet is currently marked as lost
router.get('/lostpets/:petId', authMiddleware, async (req, res) => {
  const { petId } = req.params;

  try {
      const lostPet = await LostPet.findOne({ pet_id: petId });
      if (lostPet) {
          res.status(200).json({ lostPet });
      } else {
          res.status(200).json({ message: 'Pet is not marked as lost' });
      }
  } catch (error) {
      console.error('Error checking if pet is lost:', error);
      res.status(500).json({ message: 'Error checking if pet is lost' });
  }
});

// Route to mark pet as found and delete the post
router.delete('/lostpets/:petId', authMiddleware, async (req, res) => {
  const { petId } = req.params;

  try {
      const lostPet = await LostPet.findOneAndDelete({ pet_id: petId });
      if (lostPet) {
          await Post.findByIdAndDelete(lostPet.postId);
          res.status(200).json({ message: 'Pet marked as found and post deleted' });
      } else {
          res.status(404).json({ message: 'Pet is not marked as lost' });
      }
  } catch (error) {
      console.error('Error marking pet as found:', error);
      res.status(500).json({ message: 'Error marking pet as found' });
  }
});

router.put("/:petId/adopt", authMiddleware, async (req, res) => {
    const { petId } = req.params;
    const { adoption_type, start_date, end_date, delivery_place, aboutPet, questions } = req.body;
    const userId = req.user.userId;
  
    try {
      const pet = await Pet.findById(petId);
      if (!pet) {
        return res.status(404).json({ error: "Pet not found" });
      }
  
      if (pet.owner_id.toString() !== userId) {
        return res.status(403).json({ error: "You are not the owner of this pet" });
      }
  
      if (pet.adoption_status === "available") {
        return res.status(400).json({ error: "Pet is already up for adoption" });
      }
  
      let adoptionRecord = await Adoption.findOne({ pet_id: petId });
      if (!adoptionRecord) {
        adoptionRecord = new Adoption({
          pet_id: petId,
          current_owner_id: pet.owner_id,
          adoption_type,
          start_date: adoption_type === 'temporary' ? start_date : null,
          end_date: adoption_type === 'temporary' ? end_date : null,
          delivery_place,
          aboutPet,
          questions: questions || [], // Store the questions if they exist
        });
      } else {
        adoptionRecord.adoption_type = adoption_type;
        adoptionRecord.start_date = adoption_type === 'temporary' ? start_date : null;
        adoptionRecord.end_date = adoption_type === 'temporary' ? end_date : null;
        adoptionRecord.delivery_place = delivery_place;
        adoptionRecord.aboutPet = aboutPet;
        adoptionRecord.questions = questions || []; // Update the questions
      }
  
      await adoptionRecord.save();
  
      pet.adoption_status = "available"; // Update pet's adoption status
      await pet.save();
  
      res.json({ pet: pet, adoptionRecord: adoptionRecord });
    } catch (error) {
      console.error("Error updating adoption:", error);
      res.status(500).json({ error: "Server error" });
    }
  });
  

router.post("/:petId/apply", authMiddleware, async (req, res) => {
    const { petId } = req.params;
    const userId = req.user.userId;

    try {
        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({ error: "Pet not found" });
        }

        if (pet.owner_id.toString() === userId) {
            return res.status(403).json({ error: "You cannot apply to adopt your own pet" });
        }

        if (pet.adoption_status !== 'available') {
            return res.status(400).json({ error: "Pet is not available for adoption" });
        }

        const adoptionRecord = await Adoption.findOne({ pet_id: petId });
        if (!adoptionRecord) {
            return res.status(404).json({ error: "Adoption record not found" });
        }

        const existingRequest = await AdoptionRequest.findOne({
            adoption_id: adoptionRecord._id,
            adopter_id: userId
        });

        if (existingRequest) {
            return res.status(400).json({ error: "You have already applied for this pet." });
        }

        const adoptionRequest = new AdoptionRequest({
            adoption_id: adoptionRecord._id,
            adopter_id: userId,
            status: 'pending'
        });

        await adoptionRequest.save();

        res.status(200).json({ message: "Adoption application submitted successfully!", adoptionRequest });
    } catch (error) {
        console.error("Error submitting adoption application:", error);
        res.status(500).json({ error: "Error submitting adoption application", details: error.message });
    }
});



// Function to calculate distance using Haversine formula
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Radius of Earth in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};


// Route to fetch pets available for adoption from the Adoption table
// Update your adoption routes
router.get('/adopt/available', async (req, res) => {
  try {
    // Get regular pet adoptions
    const petAdoptions = await Adoption.find({ status: 'notadopted' })
      .populate({ path: 'pet_id', model: 'Pet' })
      .populate({ path: 'current_owner_id', model: 'User', select: 'fullName city village profileImage' });

    // Get found pet adoptions
    const foundPets = await FoundPet.find({ 
      adoptionStatus: 'available',
      status: { $in: ['in_clinic', 'fostered'] } // Only available found pets
    }).populate('clinic', 'name');

    // Combine and format the results
    const availablePets = [
      ...petAdoptions.map(adoption => ({
        _id: adoption.pet_id._id,
        type: 'pet',
        name: adoption.pet_id.name,
        species: adoption.pet_id.species,
        breed: adoption.pet_id.breed,
        age: adoption.pet_id.age,
        gender: adoption.pet_id.gender,
        img_url: adoption.pet_id.img_url,
        delivery_place: adoption.delivery_place,
        owner: {
          _id: adoption.current_owner_id._id,
          fullName: adoption.current_owner_id.fullName,
          city: adoption.current_owner_id.city,
          village: adoption.current_owner_id.village,
          profileImage: adoption.current_owner_id.profileImage
        },
        adoption_type: adoption.adoption_type,
        aboutPet: adoption.aboutPet
      })),
      ...foundPets.map(pet => ({
        _id: pet._id,
        type: 'foundPet',
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        age: pet.estimatedAge,
        gender: pet.gender,
        img_url: pet.img_url,
        delivery_place: pet.foundLocation,
        owner: {
          _id: pet.clinic._id,
          fullName: pet.clinic.name,
          city: pet.clinic.city,
          profileImage: pet.clinic.logo
        },
        adoption_type: 'lifetime', // Found pets are always lifetime
        aboutPet: pet.adoptionDetails?.aboutPet || '',
        isFoundPet: true
      }))
    ];

    res.status(200).json(availablePets);
  } catch (error) {
    console.error('Error fetching available pets:', error);
    res.status(500).json({ message: 'Error fetching available pets' });
  }
});

  const opencage = require('opencage-api-client');
  
  
  const getCoordinates = async (deliveryPlace) => {
    if (!deliveryPlace || deliveryPlace.trim() === "") {
        console.warn("No valid location provided, skipping geocoding.");
        return { lat: null, lng: null };
    }

    try {
        // Split by commas and remove extra spaces
        const parts = deliveryPlace.split(",").map(part => part.trim());

        let village = "";
        let city = "";

        if (parts.length === 1) {
            village = parts[0]; // Only one part, treat as village
        } else if (parts.length === 2) {
            village = parts[0]; // First part is village
            city = parts[1];    // Second part is city
        } else {
            village = parts[parts.length - 2]; // Always pick second-to-last as village
            city = parts[parts.length - 1];    // Last part is city
        }

        // Use village if available, otherwise use city
        const location = village || city;
        if (!location) {
            console.warn("No valid village or city found in deliveryPlace.");
            return { lat: null, lng: null };
        }

        console.log(`Geocoding for: ${location}, Palestinian Territory`);
         
        const data = await opencage.geocode({
            q: `${location}, Palestinian Territory`,
            key: "cacecb571f164a8db0ae758f1c41800f", // Replace with your actual API key
        });

        if (data.status.code === 200 && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry;
            return { lat, lng };

        }
         else {
            console.warn("Coordinates not found for:", location);
            return { lat: null, lng: null };
        }
    } catch (error) {
        console.error("Error fetching coordinates:", error);
        return { lat: null, lng: null };
    }


};


  // Route to get adoptable pets sorted by distance
  const MAX_DISTANCE_KM = 30; // Adjust as needed

  router.get('/adopt/nearby', authMiddleware, async (req, res) => {
      try {
         const userId = req.user.userId;
  
          // Get user location
          const user = await User.findById(userId);
          if (!user || !user.coordinates.lat || !user.coordinates.lng) {
              return res.status(400).json({ message: "User location not found" });
          }
  
          const userLat = user.coordinates.lat;
          const userLng = user.coordinates.lng;
  
          // Get adoptable pets and their delivery places
          const adoptions = await Adoption.find({ status: 'notadopted' })
              .populate({ path: 'pet_id', model: 'Pet' });
  
          // Process each adoption entry to get the distance
          const sortedPets = await Promise.all(
              adoptions.map(async (adoption) => {
                  if (!adoption.delivery_place) return null;
  
                  // Get village/city name and convert it into coordinates
                  const { lat, lng } = await getCoordinates(adoption.delivery_place);
                  if (!lat || !lng) return null;
  
                  const distance = haversineDistance(userLat, userLng, lat, lng);
  
                  // Only include pets within MAX_DISTANCE_KM
                  if (distance > MAX_DISTANCE_KM) return null;
  
                  return {
                      _id: adoption.pet_id._id,
                      name: adoption.pet_id.name,
                      species: adoption.pet_id.species,
                      breed: adoption.pet_id.breed,
                      age: adoption.pet_id.age,
                      gender: adoption.pet_id.gender,
                      img_url: adoption.pet_id.img_url,
                      delivery_place: adoption.delivery_place,
                      distance: distance,
                  };
              })
          );
  
          // Filter out null values and sort by distance
          const nearbyPets = sortedPets.filter(pet => pet !== null).sort((a, b) => a.distance - b.distance);
  
          res.status(200).json(nearbyPets);
      } catch (error) {
          console.error("Error fetching nearby adoptable pets:", error);
          res.status(500).json({ message: "Error fetching nearby adoptable pets" });
      }
  });
  


  router.delete("/:petId/cancel-adoption", async (req, res) => {
    try {
        const { petId } = req.params;
        
        // Check pet status
        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({ error: "Pet not found." });
        }
        

        // Remove from adoption table
        await Adoption.deleteOne({ pet_id: petId });

        // Update pet status to not available
        const updatedPet = await Pet.findByIdAndUpdate(
            petId, 
            { adoption_status: "notAvailable" },
            { new: true }
        );

        res.json({ 
            message: "Adoption listing canceled successfully.",
            pet: updatedPet
        });
    } catch (error) {
        res.status(500).json({ error: "Error canceling adoption listing." });
    }
});

router.get('/adoptdetailes/:petId', async (req, res) => {
    try {
      const { petId } = req.params;
  
      // Find adoption record by pet_id and populate pet and owner data
      const adoption = await Adoption.findOne({ pet_id: petId })
        .populate('pet_id')            // Get pet details
        .populate('current_owner_id')   // Get owner details
        .exec();
  
      if (!adoption) {
        return res.status(404).json({ message: 'Adoption record not found' });
      }
      // Fetch general adoption questions
     const generalQuestions = await AdoptionQuestion.find({});

    // Combine general questions with pet-specific questions
    const combinedQuestions = [
      ...generalQuestions.map((q) => q.question),
      ...(adoption.questions || []),
     ]; 
  
      res.status(200).json({
        pet: adoption.pet_id,
        owner: adoption.current_owner_id,
        adoption: {
          adoption_type: adoption.adoption_type,
          delivery_place: adoption.delivery_place,
          aboutPet: adoption.aboutPet,
          status: adoption.status,
          questions: combinedQuestions,
          start_date: adoption.start_date,
          end_date: adoption.end_date,
        },
      });
    } catch (error) {
      console.error('Error fetching pet details:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // Submit an adoption request
  router.post("/adoption/submitRequest", authMiddleware, async (req, res) => {
    try {
      const { pet_id, owner_id, requester_id, questionsAndAnswers, adoption_type } = req.body;
  
      // Validate pet exists
      const pet = await Pet.findById(pet_id);
      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }
  
      if (pet.adoption_status !== 'available') {
        return res.status(400).json({ message: 'This pet is not available for adoption' });
      }
  
      // Validate adoption_type
      const validAdoptionTypes = ['lifetime', 'temporary'];
      const validatedAdoptionType = validAdoptionTypes.includes(adoption_type) 
        ? adoption_type 
        : 'lifetime';
  
      const request = new AdoptionRequest({
        pet_id,
        pet_type: 'Pet',
        owner_id,
        requester_id,
        questionsAndAnswers,
        adoption_type: validatedAdoptionType,
        status: 'pending'
      });
  
      await request.save();
  
      // Create and save the notification
      const notification = await notificationController.createNotification(
        owner_id,
        `${pet.name} has a new adoption request!`,
        '/adoption/requests',
        'adoption',
        req.app.get('wss')
      );
    
      res.status(201).json({
        message: "Adoption request submitted successfully.",
        adoptionRequest: request, // Fixed variable name
      });
    } catch (error) {
      console.error("Error submitting adoption request:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  });

  // In your adoption routes file
router.get('/adoption/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await AdoptionRequest.find({ owner_id: req.user.userId })
      .populate('pet_id')
      .populate('requester_id');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

  // In your adoption routes file
router.get("/adoption/requests/:id", authMiddleware, async (req, res) => {
    try {
      const request = await AdoptionRequest.findById(req.params.id)
        .populate('pet_id')
        .populate('requester_id');
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });



  router.get('/extensions/requests', authMiddleware, async (req, res) => {
    try {
      const requests = await Pet.find({
        'extensionRequests.caretaker_id': req.user.userId,
        'extensionRequests.status': 'pending'
      })
      .select('name img_url temporaryCaretaker extensionRequests')
      .populate('owner_id', 'name')
      .populate('extensionRequests.caretaker_id', 'name');
  
      res.json(requests.map(pet => ({
        pet_id: pet._id,
        pet_name: pet.name,
        pet_image: pet.img_url,
        owner_name: pet.owner_id.name,
        requests: pet.extensionRequests.map(req => ({
          _id: req._id,
          requestedEndDate: req.requestedEndDate,
          requestedAt: req.requestedAt,
          currentEndDate: pet.temporaryCaretaker.endDate
        }))
      })));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get extension request details
  router.get('/extensions/:requestId', async (req, res) => {
    try {
      const pet = await Pet.findOne({
        'extensionRequests._id': req.params.requestId
      })
      .select('name temporaryCaretaker extensionRequests')
      .populate('owner_id', 'name')
      .populate('extensionRequests.caretaker_id', 'name');
  
      if (!pet) {
        return res.status(404).json({ message: 'Request not found' });
      }
  
      const request = pet.extensionRequests.id(req.params.requestId);
      
      res.json({
        _id: request._id,
        pet_id: { _id: pet._id, name: pet.name },
        owner_id: pet.owner_id._id,
        owner_name: pet.owner_id.name,
        caretaker_id: request.caretaker_id,
        currentStartDate: pet.temporaryCaretaker.startDate,
        currentEndDate: pet.temporaryCaretaker.endDate,
        requestedEndDate: request.requestedEndDate,
        requestedAt: request.requestedAt,
        status: request.status,
        respondedAt: request.respondedAt
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  


  router.post('/extensions/respond/:requestId', authMiddleware, async (req, res) => {
    try {
      const { response } = req.body;
      const pet = await Pet.findOne({
        'extensionRequests._id': req.params.requestId
      }).populate('owner_id temporaryCaretaker.userId');
  
      if (!pet) {
        return res.status(404).json({ message: 'Request not found' });
      }
  
      const request = pet.extensionRequests.id(req.params.requestId);
      
      // Update request status instead of pulling it
      request.status = response === 'approve' ? 'approved' : 'rejected';
      request.respondedAt = new Date();
      
      if (response === 'approve') {
        pet.temporaryCaretaker.endDate = new Date(request.requestedEndDate);
        
        const notification = await notificationController.createNotification(
          pet.owner_id._id,
          `Your extension request for ${pet.name} has been approved. The care period is now extended until ${new Date(request.requestedEndDate).toDateString()}.`,
          '/ownerpets',
          'adoption'
        );
        req.app.get("sendNotification")(pet.owner_id._id, notification.message);
  
        const caretakerNotif = await notificationController.createNotification(
          pet.temporaryCaretaker.userId._id,
          `You approved the extension for ${pet.name}. Your care period is now until ${new Date(request.requestedEndDate).toDateString()}.`,
          '/home',
          'adoption'
        );
        req.app.get("sendNotification")(pet.temporaryCaretaker.userId._id, caretakerNotif.message);
      } else {
        const rejectNotif = await notificationController.createNotification(
          pet.owner_id._id,
          `Your extension request for ${pet.name} has been rejected. The current care period will end as scheduled on ${new Date(pet.temporaryCaretaker.endDate).toDateString()}.`,
          'adoption'
        );
        req.app.get("sendNotification")(pet.owner_id._id, rejectNotif.message);
  
      
      }
  
      await pet.save();
  
      res.json({
        message: `Extension request ${response === 'approve' ? 'approved' : 'rejected'}`,
        status: request.status,
        newEndDate: response === 'approve' ? pet.temporaryCaretaker.endDate : null
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });



// Submit extension request
router.post('/:petId/extend-adoption', authMiddleware, async (req, res) => {
  try {
    const { newEndDate, keepCaretaker } = req.body;
    const pet = await Pet.findById(req.params.petId)
      .populate('owner_id')
      .populate('temporaryCaretaker.userId');

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    if (req.user.userId !== pet.owner_id._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to perform this action' });
    }

    if (keepCaretaker === 'no') {
      pet.temporaryCaretaker.status = 'completed';
      pet.temporaryCaretaker.userId = null;
      pet.temporaryCaretaker.startDate = null;
      pet.temporaryCaretaker.endDate = null;
      pet.adoption_status = 'available';

      await pet.save();

      return res.json({
        message: 'Pet has been made available for new adoption',
        status: 'available'
      });
    }

    const { _id: caretaker_id } = pet.temporaryCaretaker.userId;

    const newRequest = {
      caretaker_id,
      requestedEndDate: new Date(newEndDate),
      status: 'pending'
    };

    pet.extensionRequests.push(newRequest);
    await pet.save();

    const newRequestId = pet.extensionRequests[pet.extensionRequests.length - 1]._id;
    const displayDate = new Date(newEndDate).toDateString();

    const notification = await notificationController.createNotification(
      caretaker_id,
      `The owner has requested to extend the care period for ${pet.name} until ${displayDate}. Do you accept?`,
      `/extensions/respond/${newRequestId}`,
      'adoption'
    );
    req.app.get("sendNotification")(caretaker_id, notification.message);

    res.json({
      message: 'Extension request sent to caretaker',
      requestId: newRequestId,
      status: 'pending'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});




  // Check extension status
router.get('/extensions/status/:requestId', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findOne({
      'extensionRequests._id': req.params.requestId
    });
    
    if (!pet) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const request = pet.extensionRequests.id(req.params.requestId);
    res.json({
      status: request.status || 'pending',
      requestedEndDate: request.requestedEndDate
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Generate QR info
router.get('/pet-qr-info/:petId', authMiddleware,async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId)
      .populate('owner_id')
      .populate('temporaryCaretaker.userId');

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Determine contact info based on adoption status
    let contactName, contactPhone;
    const isTemporarilyAdopted = pet.adoption_status === 'temporarilyAdopted' && 
                                pet.temporaryCaretaker && 
                                pet.temporaryCaretaker.status === 'active';

    if (isTemporarilyAdopted) {
      contactName = pet.temporaryCaretaker.userId.fullName;
      contactPhone = pet.temporaryCaretaker.userId.phone;
    } else {
      contactName = pet.owner_id.fullName;
      contactPhone = pet.owner_id.phone;
    }

    const qrInfo = {
      petName: pet.name,
      petImage: pet.img_url,
      species: pet.species,
      breed: pet.breed,
      contactName,
      contactPhone,
      message: `If you find this pet lost, please contact ${contactName} at ${contactPhone}. This pet is  ${isTemporarilyAdopted ? 'under temporary care' : 'owned'} by this person.`
    };

    res.json(qrInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




router.put('/save-qr/:petId', authMiddleware, async (req, res) => {
  try {
    const { qrCodeUrl } = req.body;
    
    if (!qrCodeUrl) {
      return res.status(400).json({ message: 'QR code URL is required' });
    }

    const pet = await Pet.findByIdAndUpdate(
      req.params.petId,
      { qrCodeUrl },
      { new: true }
    );

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    res.json({
      success: true,
      pet: pet
    });
  } catch (error) {
    console.error('Error saving QR code:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to save QR code',
      error: error.message 
    });
  }
});


// POST /api/pets/:petId/nutrition
router.post('/:petId/nutrition', authMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId);
    if (!pet) return res.status(404).send('Pet not found');

    const nutritionData = {
      ...req.body,
      date: new Date()
    };

    pet.nutritionAnalysis.push(nutritionData);
    await pet.save();

    res.send({ 
      message: 'Nutrition analysis saved successfully',
      nutritionAnalysis: nutritionData
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// Health Records routes
router.post('/:petId/health-records', 
  authMiddleware,
  upload.array('images', 5), 
  healthRecordController.addHealthRecord
);

router.get('/:petId/health-records', 
  authMiddleware,
  healthRecordController.getHealthRecords
);







module.exports = router;




