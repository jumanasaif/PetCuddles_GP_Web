const mongoose = require('mongoose');
const SheepBreed = require('../models/SheepBreed');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/petCuddlesDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected...');
    seedSheepBreeds();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Sheep breeds with image paths
const sheepBreeds = [
  // Meat Sheep Breeds
  { breed: "Suffolk", image: "SuffolkSheep.png" },
  { breed: "Dorset Horn", image: "DorsetSheep.png" },
  { breed: "Hampshire", image: "HampshireSheep.png" },
  { breed: "Texel", image: "TexelSheep.png" },
  { breed: "Southdown", image: "SouthdownSheep.png" },

  // Wool Sheep Breeds
  { breed: "Merino", image: "MerinoSheep.png" },
  { breed: "Rambouillet", image: "RambouilletSheep.png" },
  { breed: "Lincoln", image: "LincolnSheep.png" },
  { breed: "Romney", image: "RomneySheep.png" },
  { breed: "Corriedale", image: "CorriedaleSheep.png" },

  // Dairy Sheep Breeds
  { breed: "East Friesian", image: "EastFriesianSheep.png" },
  { breed: "Lacaune", image: "LacauneSheep.png" },
  { breed: "Awassi", image: "AwassiSheep.png" },
  { breed: "Sarda", image: "SardaSheep.png" },

  // Dual-Purpose Breeds
  { breed: "Border Leicester", image: "BorderLeicesterSheep.png" },
  { breed: "Columbia", image: "ColumbiaSheep.png" },
  { breed: "Polypay", image: "PolypaySheep.png" },
  { breed: "Targhee", image: "TargheeSheep.png" },

  // Heritage & Rare Breeds
  { breed: "Shetland", image: "ShetlandSheep.png" },
  { breed: "Jacob", image: "JacobSheep.png" },
  { breed: "Karakul", image: "KarakulSheep.png" },
  { breed: "Icelandic", image: "IcelandicSheep.png" },

  // Adaptable & Hardy Breeds
  { breed: "Katahdin", image: "KatahdinSheep.png" },
  { breed: "Dorper", image: "DorperSheep.png" },
  { breed: "St. Croix", image: "StCroixSheep.png" },

  // Miscellaneous
  { breed: "Mixed", image: "MixedSheep.png" },
  { breed: "Unknown", image: "UnknownSheep.png" }
];

// Seed sheep breeds into the database
const seedSheepBreeds = async () => {
  try {
    // Clear the SheepBreed collection
    await SheepBreed.deleteMany({});

    // Insert sheep breeds into the database
    await SheepBreed.insertMany(sheepBreeds);
    console.log('Sheep breeds seeded successfully');
  } catch (error) {
    console.error('Error seeding sheep breeds:', error);
  } finally {
    mongoose.connection.close();
  }
};