const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { login, forgotPassword, resetPassword } = require('../controllers/authController');
const { updateOwnerProfile } = require('../controllers/ownerProfileController');
const User = require('../models/User');
const Clinic = require('../models/Clinic');
const bcrypt = require('bcrypt');
const opencage = require('opencage-api-client');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const AdminNotification = require('../models/AdminNotification');
const Shop = require('../models/Shop');
const Doctor = require('../models/Doctor');



const getCoordinates = async (city, village) => {
  // Determine the location string
  const location = village && village.trim() !== "" 
    ? `${village}, Palestinian Territory`
    : city && city.trim() !== "" 
      ? `${city}, Palestinian Territory` 
      : null;

  // Handle missing location
  if (!location) {
    console.warn("No valid location provided, skipping geocoding.");
    return { lat: null, lng: null };
  }

  try {
    const encodedLocation = encodeURIComponent(location);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'PetCuddles (jumana@gmail.com)' // Replace with your app name/email
      }
    });

    const data = response.data;

    if (data.length > 0) {
      const { lat, lon } = data[0];
      return { lat: parseFloat(lat), lng: parseFloat(lon) };
    } else {
      console.warn("Coordinates not found for location:", location);
      return { lat: null, lng: null };
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error.message);
    return { lat: null, lng: null };
  }
};


const tempUploadDir = path.join(__dirname, '../uploads/license-temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Configure multer storage
const licenseStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/clinic-licenses'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadLicense = multer({ 
  storage: licenseStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
  }
});



// Configure multer for temporary uploads
const upload = multer({ 
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, tempUploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
  }
});



// Update the verify-license route to use Python service
router.post('/verify-license', uploadLicense.single('licenseImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No license image provided' });
    }

    const formData = new FormData();
    formData.append('licenseImage', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const pythonServiceUrl = process.env.PYTHON_LICENSE_SERVICE || 'http://localhost:5001/verify-license';
    const verification = await axios.post(pythonServiceUrl, formData, {
      headers: formData.getHeaders()
    });

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      isValid: verification.data.isValid,
      message: verification.data.message
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('License Verification Error:', error);
    res.status(500).json({ 
      message: error.response?.data?.message || 'Error verifying license',
      error: error.message 
    });
  }
});


// Pet Owner Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, phone, password, city, village } = req.body;

    if (!fullName || !email || !phone || !password || !city) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get user's coordinates based on village (if provided) or city
    const coordinates = await getCoordinates(city, village);

    // Create a new user
    const newUser = new User({
      fullName,
      email,
      phone,
      password: hashedPassword,
      city,
      village,
      coordinates,
      role: 'pet_owner', // Default role
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Vet Signup Route
router.post('/vet/signup', upload.single('clinicLicenseImage'), async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phone, 
      password, 
      clinicName, 
      city, 
      village,
      workingHours 
    } = req.body;

    // Required fields validation
    if (!fullName || !email || !phone || !password || !clinicName || !city) {
      return res.status(400).json({ message: 'All required fields are missing' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'License image is required' });
    }

    // Check if email or phone already exists
    const existingVet = await Clinic.findOne({ $or: [{ email }, { phone }] });
    if (existingVet) {
      return res.status(400).json({ message: 'Email or phone number already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    days.forEach(day => {
      workingHours[day] = {
        closed: req.body[`workingHours[${day}][closed]`] === 'true',
        open: req.body[`workingHours[${day}][open]`] || '',
        close: req.body[`workingHours[${day}][close]`] || ''
      };
    });

    // Get coordinates (implement your getCoordinates function)
    const coordinates = await getCoordinates(city, village);

    // Create new vet
    const newVet = new Clinic({
      fullName,
      email,
      phone,
      password: hashedPassword,
      clinicName,
      clinicLicense: {
        imageUrl: `/uploads/clinic-licenses/${req.file.filename}`
      },
      isVerified: false, // License verification status (from Python service)
      isActive: false,   // Account activation status (from admin)
      city,
      village,
      coordinates,
      workingHours,
      role: 'vet'
    });

    await newVet.save();

        // Create admin notification for approval
        const notification = new AdminNotification({
          type: 'vet_approval',
          vetId: newVet._id,
          vetName: fullName,
          clinicName,
          licenseImage: `/uploads/clinic-licenses/${req.file.filename}`,
          status: 'pending',
          createdAt: new Date()
        });
    
        await notification.save();
    
        res.status(201).json({ 
          message: 'Veterinarian registration submitted for admin approval',
          vetId: newVet._id
        });
    


  } catch (error) {
    console.error('Vet Signup Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// shop sign up:
router.post('/shop/signup', upload.single('profileImage'), async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phone, 
      password, 
      shopName, 
      city, 
      village,
      DeliveryProvide,
    } = req.body;

    if (!fullName || !email || !phone || !password || !shopName || !city) {
      return res.status(400).json({ message: 'All required fields are missing' });
    }

    const existingShop = await Shop.findOne({ $or: [{ email }, { phone }] });
    if (existingShop) {
      return res.status(400).json({ message: 'Email or phone number already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const coordinates = await getCoordinates(city, village);
    const workingHours = JSON.parse(req.body.workingHours);

    const newShop = new Shop({
      fullName,
      email,
      phone,
      password: hashedPassword,
      shopName,
      city,
      village,
      coordinates,
      workingHours,
      DeliveryProvide: DeliveryProvide === 'true',
      role: 'shop',
      profileImage: req.file ? `/uploads/shop-profiles/${req.file.filename}` : '',
      isActive: false // Account not active until payment
    });

    await newShop.save();

    res.status(201).json({ 
      message: 'Shop registered successfully. Please complete subscription payment.',
      shopId: newShop._id,
      requiresPayment: true
    });

  } catch (error) {
    console.error('Shop Signup Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});




// Login Route
router.post('/login', login);
// In your auth routes file (routes/auth.js), add:
router.options('/login', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});
// Forgot Password Route
router.post('/forgot-password', forgotPassword);

// Reset Password Route
router.post('/reset-password', resetPassword);
// Save FCM Token

router.get('/validate', authMiddleware, (req, res) => {
  res.json({ user: req.user }); // Return user data from validated token
});



module.exports = router;

