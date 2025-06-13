const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middleware/authMiddleware');
const TravelGuide = require('../models/TravelGuide');

// Overpass API endpoint
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

// Helper function to compare coordinates with tolerance
const areCoordinatesSimilar = (coord1, coord2, tolerance = 0.001) => {
  return Math.abs(coord1.lat - coord2.lat) < tolerance && 
         Math.abs(coord1.lng - coord2.lng) < tolerance;
};

// Get or create travel guide for location
router.get('/location/guide', authMiddleware, async (req, res) => {
  try {
    const { city, lat, lng } = req.query;
    const coordinates = {
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };

    // Find existing guides with similar coordinates
    const guides = await TravelGuide.find({}).lean();
    let guide = guides.find(g => 
      g.location.coordinates && 
      areCoordinatesSimilar(g.location.coordinates, coordinates)
    );

    if (!guide) {
      guide = await TravelGuide.create({
        location: {
          city: city || 'Unknown',
          coordinates: coordinates
        },
        userTrials: []
      });
    }

    // Populate user data in trials
    const populatedGuide = await TravelGuide.findById(guide._id)
      .populate('userTrials.user', 'fullName email')
      .lean();

    res.json(populatedGuide);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get travel guide', error: error.message });
  }
});

// Add user travel trial
router.post('/:id/trials', authMiddleware, async (req, res) => {
  try {
    const { experience, tips, rating, photos } = req.body;
    
    const guide = await TravelGuide.findById(req.params.id);
    if (!guide) {
      return res.status(404).json({ message: 'Travel guide not found' });
    }
    
    const newTrial = {
      user: req.user.userId,
      experience,
      tips: tips || '',
      rating: rating || 5,
      photos: photos || []
    };
    
    guide.userTrials.push(newTrial);
    await guide.save();
    
    // Return the newly added trial with populated user data
    const populatedGuide = await TravelGuide.findById(guide._id)
      .populate('userTrials.user', 'fullName email')
      .lean();
      
    const addedTrial = populatedGuide.userTrials.find(t => 
      t.user._id.toString() === req.user.userId.toString() &&
      t.experience === experience
    );
    
    res.status(201).json(addedTrial);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add travel trial', error: error.message });
    console.log(error);
  }
});


// Get pet-friendly locations for a city or coordinates
router.get('/location', async (req, res) => {
  try {
    const { city, lat: initialLat, lng: initialLng } = req.query;
    let lat = parseFloat(initialLat);
    let lng = parseFloat(initialLng);

    // If coordinates not provided, geocode the city name
    if (!lat || !lng) {
      const nominatimRes = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json`);
      if (nominatimRes.data.length === 0) {
        return res.status(404).json({ message: 'Location not found' });
      }
      lat = parseFloat(nominatimRes.data[0].lat);
      lng = parseFloat(nominatimRes.data[0].lon);
    }

    // Define bounding box (0.1 degree ≈ 11km)
    const south = lat - 0.1;
    const west = lng - 0.1;
    const north = lat + 0.1;
    const east = lng + 0.1;

    if (south >= north || west >= east) {
      return res.status(400).json({ message: 'Invalid bounding box coordinates' });
    }

    // Overpass QL query for pet-related places
    const overpassQuery = `
[out:json][timeout:25];
(
  // Veterinary clinics and pet services
  node["amenity"="veterinary"](${south},${west},${north},${east});
  way["amenity"="veterinary"](${south},${west},${north},${east});
  relation["amenity"="veterinary"](${south},${west},${north},${east});
  
  node["shop"="pet"](${south},${west},${north},${east});
  way["shop"="pet"](${south},${west},${north},${east});
  relation["shop"="pet"](${south},${west},${north},${east});
  
  // Shelters and boarding
  node["amenity"~"animal_shelter|animal_boarding"](${south},${west},${north},${east});
  way["amenity"~"animal_shelter|animal_boarding"](${south},${west},${north},${east});
  relation["amenity"~"animal_shelter|animal_boarding"](${south},${west},${north},${east});
  
  // Pet grooming and breeding
  node["shop"~"pet_grooming|animal_breeding"](${south},${west},${north},${east});
  way["shop"~"pet_grooming|animal_breeding"](${south},${west},${north},${east});
  relation["shop"~"pet_grooming|animal_breeding"](${south},${west},${north},${east});
  
  // Dog parks and pet-friendly parks
  node["leisure"="dog_park"](${south},${west},${north},${east});
  way["leisure"="dog_park"](${south},${west},${north},${east});
  
  node["leisure"="park"]["dog"="yes"](${south},${west},${north},${east});
  way["leisure"="park"]["dog"="yes"](${south},${west},${north},${east});
  
  // General parks (might allow pets)
  node["leisure"="park"](${south},${west},${north},${east});
  way["leisure"="park"](${south},${west},${north},${east});
  
  // Pet-friendly trails
  node["route"="hiking"]["dog"="yes"](${south},${west},${north},${east});
  way["route"="hiking"]["dog"="yes"](${south},${west},${north},${east});
  
  // Pet-friendly restaurants and cafes
  node["amenity"~"restaurant|cafe"]["dog"="yes"](${south},${west},${north},${east});
  way["amenity"~"restaurant|cafe"]["dog"="yes"](${south},${west},${north},${east});
  
  // Pet pharmacies
  node["amenity"="pharmacy"]["dispensing"~"vet|animal"](${south},${west},${north},${east});
  way["amenity"="pharmacy"]["dispensing"~"vet|animal"](${south},${west},${north},${east});
);
out center;
`;

    const response = await axios.post(
      OVERPASS_API,
      overpassQuery,
      { headers: { 'Content-Type': 'text/plain' } }
    );

    // Process the response data
    const elements = response.data.elements || [];
    const processedData = elements.map(element => {
      // Handle different element types (node, way, relation)
      if (element.type === 'node') {
        return {
          type: 'node',
          id: element.id,
          lat: element.lat,
          lon: element.lon,
          tags: element.tags || {}
        };
      } else if (element.type === 'way' || element.type === 'relation') {
        return {
          type: element.type,
          id: element.id,
          lat: element.center?.lat,
          lon: element.center?.lon,
          tags: element.tags || {}
        };
      }
      return null;
    }).filter(Boolean);

    res.json({
      location: {
        city: city || 'Unknown',
        coordinates: { lat, lng }
      },
      overpassData: processedData
    });

  } catch (error) {
    console.error('Travel Guide Error:', error);
    res.status(500).json({ 
      message: 'Failed to get travel guide', 
      error: error.message,
      details: error.response?.data 
    });
  }
});





module.exports = router;