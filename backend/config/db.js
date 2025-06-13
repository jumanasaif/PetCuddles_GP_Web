const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/petCuddlesDB');


const db = mongoose.connection;
db.on('error', console.error.bind(console, '❌ MongoDB Connection Error:'));
db.once('open', () => {
    console.log('✅ MongoDB Connected to petCuddlesDB');
});