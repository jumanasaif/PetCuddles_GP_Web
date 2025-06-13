const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Import User model

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/petCuddlesDB', {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => console.log("✅ Connected to MongoDB for Seeding"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));
  
// Seed Users Data
const seedUsers = async () => {
    try {
        // Clear the existing collection (Optional)
        await User.deleteMany();

        // Hash passwords
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Sample users with city field
        const users = [
            {
                fullName: "John Doe",
                email: "john@example.com",
                phone: "123456789",
                password: hashedPassword,
                role: "pet_owner",
                city: "New York"  // Add city
            },
            {
                fullName: "Dr. Smith",
                email: "smith@example.com",
                phone: "987654321",
                password: hashedPassword,
                role: "doctor",
                city: "Los Angeles"  // Add city
            },
            {
                fullName: "Jane Vet",
                email: "jane@example.com",
                phone: "555666777",
                password: hashedPassword,
                role: "vet",
                city: "Chicago"  // Add city
            }
        ];

        // Insert users
        await User.insertMany(users);
        console.log("✅ Users Seeded Successfully!");
        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error Seeding Users:", error);
        mongoose.connection.close();
    }
};

// Run the Seeder
seedUsers();

