const mongoose = require('mongoose');
const Post = require('../models/Post'); // Adjust the path if needed
const User = require('../models/User'); // Assuming you have a User model

mongoose.connect('mongodb://127.0.0.1:27017/petCuddlesDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB for Seeding"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

const seedData = async () => {
  try {
    await Post.deleteMany({}); // Clear existing posts

    // Creating sample users if they don't already exist
    const existingUsers = await User.find();
    const userMap = new Map(existingUsers.map(user => [user.email, user]));

    const usersToInsert = [
        { 
          fullName: 'JoJo Doe', 
          email: 'jojo@gmail.com', 
          phone: '1234567890', 
          password: '123456', 
          role: 'pet_owner', // Choose an appropriate role
          city: 'New York',
          img_url: 'https://example.com/john.jpg'
        },
        { 
          fullName: 'Jane Smith', 
          email: 'jane@gmail.com', 
          phone: '0987654321', 
          password: '123456', 
          role: 'pet_owner', // Choose an appropriate role
          city: 'Los Angeles',
          img_url: 'https://example.com/jane.jpg'
        },
        { 
          fullName: 'Malak Saif', 
          email: 'jumanaevent@gmail.com', 
          phone: '0599339519', 
          password: 'pass123', 
          role: 'pet_owner', // Choose an appropriate role
          city: 'Nablus',
          img_url: 'https://example.com/jane.jpg'
        }
      ].filter(user => !userMap.has(user.email));
      
    const newUsers = await User.insertMany(usersToInsert);
    const allUsers = [...existingUsers, ...newUsers];

    // Creating sample posts
    const posts = await Post.insertMany([
      {
        content: 'This is my first post!',
        user: allUsers[0]._id,
        img_url: 'https://example.com/image1.jpg',
        likes: [allUsers[1]._id],
        comments: [
          { user: allUsers[1]._id, content: 'Great post!' }
        ]
      },
      {
        content: 'Hello world!',
        user: allUsers[1]._id,
        img_url: '',
        likes: [allUsers[0]._id],
        comments: [
          { user: allUsers[0]._id, content: 'Nice one!' }
        ]
      }
      ,
      {
        content: 'Hello world iam malak!',
        user: allUsers[3]._id,
        img_url: '',
        likes: [allUsers[1]._id],
        comments: [
          { user: allUsers[1]._id, content: 'Nice!' }
        ]
      }
    ]);

    console.log('Seeding completed');
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error);
    mongoose.connection.close();
  }
};

seedData();

