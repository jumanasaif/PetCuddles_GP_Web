const mongoose = require('mongoose');
const Pet = require('../models/Pet'); 

// MongoDB connection (replace with your own connection string)
mongoose.connect('mongodb://127.0.0.1:27017/petCuddlesDB', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected...');
        seedPets();
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

const seedPets = async () => {
    try {
        // Pet owner ID from the API response
        const petOwnerId = "67c464e03a8485e8be3ba6a8"; 

        // Sample pets to insert with the local image URL
        const pets = [
            {
                owner_id: petOwnerId,
                name: "Buddy",
                species: "dog",
                breed: "Golden Retriever",
                birth_date: "2020-03-15",
                weight: 30,
                gender: "male",
                health_status: "Healthy",
                img_url: "http://localhost:3000/images/cat1.jpg"  // Reference to the locally served image
            },
            {
                owner_id: petOwnerId,
                name: "Whiskers",
                species: "cat",
                breed: "Persian",
                birth_date: "2019-07-22",
                weight: 10,
                gender: "female",
                health_status: "Healthy",
                img_url: "http://localhost:3000/images/cat1.jpg"
            },
            {
                owner_id: petOwnerId,
                name: "Tweety",
                species: "bird",
                breed: "Canary",
                birth_date: "2021-01-05",
                weight: 0.1,
                gender: "male",
                health_status: "Healthy",
                img_url: "http://localhost:3000/images/cat1.jpg"
            },
            {
                owner_id: petOwnerId,
                name: "Bella",
                species: "dog",
                breed: "Bulldog",
                birth_date: "2021-08-12",
                weight: 20,
                gender: "female",
                health_status: "Healthy",
                img_url: "http://localhost:3000/images/cat1.jpg"
            },
            {
                owner_id: petOwnerId,
                name: "Luna",
                species: "cat",
                breed: "Siamese",
                birth_date: "2020-11-23",
                weight: 8,
                gender: "female",
                health_status: "Healthy",
                img_url: "http://localhost:3000/images/cat1.jpg"
            }
        ];

        // Insert pets into the database
        await Pet.insertMany(pets);
        console.log('Pets seeded successfully');
        
        // Close the connection
        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding pets:', err);
        mongoose.connection.close();
    }
};
