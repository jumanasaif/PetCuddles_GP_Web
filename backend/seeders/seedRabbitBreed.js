const mongoose = require('mongoose');
const RabbitBreed = require('../models/RabbitBreed');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/petCuddlesDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected...');
    seedRabbitBreeds();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Rabbit breeds with image paths
const rabbitBreeds = [
  { breed: "American", image: "AmericanRabbit.png" },
  { breed: "Belgian Hare", image: "BelgianHare.png" },
  { breed: "Beveren", image: "Beveren.png" },
  { breed: "Britannia Petite", image: "BritanniaPetite.png" },
  { breed: "Californian", image: "Californian.png" },
  { breed: "Champagne d'Argent", image: "ChampagneDArgent.png" },
  { breed: "Checkered Giant", image: "CheckeredGiant.png" },
  { breed: "Cinnamon", image: "Cinnamon.png" },
  { breed: "Dutch", image: "Dutch.png" },
  { breed: "English Angora", image: "EnglishAngora.png" },
  { breed: "English Lop", image: "EnglishLop.png" },
  { breed: "English Spot", image: "EnglishSpot.png" },
  { breed: "Flemish Giant", image: "FlemishGiant.png" },
  { breed: "Florida White", image: "FloridaWhite.png" },
  { breed: "French Angora", image: "FrenchAngora.png" },
  { breed: "French Lop", image: "FrenchLop.png" },
  { breed: "Giant Angora", image: "GiantAngora.png" },
  { breed: "Harlequin", image: "Harlequin.png" },
  { breed: "Havana", image: "Havana.png" },
  { breed: "Himalayan", image: "Himalayan.png" },
  { breed: "Holland Lop", image: "HollandLop.png" },
  { breed: "Hotot", image: "Hotot.png" },
  { breed: "Jersey Wooly", image: "JerseyWooly.png" },
  { breed: "Lilac", image: "Lilac.png" },
  { breed: "Lionhead", image: "Lionhead.png" },
  { breed: "Mini Lop", image: "MiniLop.png" },
  { breed: "Mini Rex", image: "MiniRex.png" },
  { breed: "Mixed", image: "Mixed.png" },
  { breed: "Netherland Dwarf", image: "NetherlandDwarf.png" },
  { breed: "New Zealand", image: "NewZealand.png" },
  { breed: "Palomino", image: "Palomino.png" },
  { breed: "Polish", image: "Polish.png" },
  { breed: "Rex", image: "Rex.png" },
  { breed: "Rhinelander", image: "Rhinelander.png" },
  { breed: "Satin", image: "Satin.png" },
  { breed: "Silver", image: "Silver.png" },
  { breed: "Silver Fox", image: "SilverFox.png" },
  { breed: "Silver Marten", image: "SilverMarten.png" },
  { breed: "Tan", image: "Tan.png" },
  { breed: "Thrianta", image: "Thrianta.png" },
  { breed: "Unknown", image: "Unknown.png" },
];

// Seed rabbit breeds into the database
const seedRabbitBreeds = async () => {
    try {
      // Clear the RabbitBreed collection
      await RabbitBreed.deleteMany({});
  
      // Insert rabbit breeds into the database
      await RabbitBreed.insertMany(rabbitBreeds);
      console.log('Rabbit breeds seeded successfully');
    } catch (error) {
      console.error('Error seeding rabbit breeds:', error);
    } finally {
      mongoose.connection.close();
    }
  };
