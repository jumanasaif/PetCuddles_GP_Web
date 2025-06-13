const mongoose = require('mongoose');
const AdoptionQuestion = require('../models/AdoptionQuestions'); // Adjust the path based on your project structure

// MongoDB connection (replace with your actual connection string)
mongoose.connect('mongodb://127.0.0.1:27017/petCuddlesDB', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected...');
        seedAdoptionQuestions();
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

const seedAdoptionQuestions = async () => {
    try {
        // Check if questions already exist to prevent duplicates
        const existingQuestions = await AdoptionQuestion.countDocuments();
        if (existingQuestions > 0) {
            console.log('Adoption questions already exist. Skipping seeding.');
            mongoose.connection.close();
            return;
        }

        // Adoption questions to insert
        const questions = [
            { question: 'Have you owned pets before?' },
            { question: 'Do you currently have any other pets?' },
            { question: 'Do you live in a house or an apartment?' },
            { question: 'Are you prepared for the financial responsibility of pet ownership (food, vet bills, etc.)?' }
        ];

        // Insert questions into the database
        await AdoptionQuestion.insertMany(questions);
        console.log('Adoption questions seeded successfully');

        // Close the connection
        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding adoption questions:', err);
        mongoose.connection.close();
    }
};
