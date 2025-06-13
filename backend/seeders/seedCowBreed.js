const mongoose = require('mongoose');
const CowBreed = require('../models/CowBreed'); 
// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/petCuddlesDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected...');
    seedCowBreeds();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Cow breeds with image paths
const cowBreeds = [
  // Dairy Breeds
  { breed: "Holstein", image: "HolsteinCow.png", type: "dairy" },
  { breed: "Jersey", image: "JerseyCow.png", type: "dairy" },
  { breed: "Brown Swiss", image: "BrownSwissCow.png", type: "dairy" },
  { breed: "Guernsey", image: "GuernseyCow.png", type: "dairy" },
  { breed: "Ayrshire", image: "AyrshireCow.png", type: "dairy" },
  
  // Beef Breeds
  { breed: "Angus", image: "AngusCow.png", type: "beef" },
  { breed: "Hereford", image: "HerefordCow.png", type: "beef" },
  { breed: "Brahman", image: "BrahmanCow.png", type: "beef" },
  { breed: "Simmental", image: "SimmentalCow.png", type: "beef" },
  { breed: "Limousin", image: "LimousinCow.png", type: "beef" },
  { breed: "Charolais", image: "CharolaisCow.png", type: "beef" },
  { breed: "Shorthorn", image: "ShorthornCow.png", type: "beef" },
  
  // Dual-Purpose Breeds
  { breed: "Red Poll", image: "RedPollCow.png", type: "dual" },
  { breed: "Dexter", image: "DexterCow.png", type: "dual" },
  { breed: "Pinzgauer", image: "PinzgauerCow.png", type: "dual" },
  { breed: "Normande", image: "NormandeCow.png", type: "dual" },
  
  // Heritage Breeds
  { breed: "Highland", image: "HighlandCow.png", type: "heritage" },
  { breed: "Longhorn", image: "LonghornCow.png", type: "heritage" },
  { breed: "Belted Galloway", image: "BeltedGallowayCow.png", type: "heritage" },
  
  // Tropical/Adaptable Breeds
  { breed: "Sahiwal", image: "SahiwalCow.png", type: "tropical" },
  { breed: "Gyr", image: "GyrCow.png", type: "tropical" },
  
  // Miscellaneous
  { breed: "Mixed", image: "MixedCow.png", type: "other" },
  { breed: "Unknown", image: "UnknownCow.png", type: "other" }
];

// Seed cow breeds into the database
const seedCowBreeds = async () => {
  try {
    // Clear the CowBreed collection
    await CowBreed.deleteMany({});

    // Insert cow breeds into the database
    await CowBreed.insertMany(cowBreeds);
    console.log('Cow breeds seeded successfully');
  } catch (error) {
    console.error('Error seeding cow breeds:', error);
  } finally {
    mongoose.connection.close();
  }
};
