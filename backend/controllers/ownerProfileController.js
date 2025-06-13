const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Clinic = require('../models/Clinic');
const Shop = require('../models/Shop');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');


const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId; 
    const userRole=req.user.role;
    if(userRole=='user'){
      const user = await User.findById(userId).select('-password');
      res.status(200).json(user);
    }
    else if(userRole=='clinic'){
      const user = await Clinic.findById(userId).select('-password');
      res.status(200).json(user);
    }
    else if(userRole=='shop'){
      const user = await Shop.findById(userId).select('-password');
      res.status(200).json(user);
    }
    else if(userRole=='doctor'){
      const user = await Doctor.findById(userId).select('-password');
      res.status(200).json(user);
    }else{
      const user = await Admin.findById(userId).select('-password');
      res.status(200).json(user);
    }
  

    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }};

  
const opencage = require('opencage-api-client');


const getCoordinates = async (village) => {
  // If no village is provided, return null coordinates immediately (NO API CALL)
  if (!village || village.trim() === "") {
    console.warn("No village provided, skipping geocoding.");
    return { lat: null, lng: null };
  }

  try {
    const location = `${village}, Palestinian Territory`;

    const data = await opencage.geocode({
      q: location,
      key: "cacecb571f164a8db0ae758f1c41800f", // Replace with your actual API key
    });

    if (data.status.code === 200 && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      return { lat, lng };
    } else {
      console.warn("Coordinates not found for location:", location);
      return { lat: null, lng: null };
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return { lat: null, lng: null };
  }
};


  const updateOwnerProfile = async (req, res) => {
  try {
    const { fullName, email, city, phone, password, profileImage,village } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.fullName = fullName || user.fullName;
    user.city = city || user.city;
    user.phone = phone || user.phone;
    if (profileImage) user.profileImage = profileImage; // Store Base64 string
    user.village= village || user.village;
    const coordinates = await getCoordinates(village);
    user.coordinates= coordinates || user.coordinates;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ success: true, message: "Profile updated successfully", profileImage: user.profileImage });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


module.exports = { getUserProfile, updateOwnerProfile };

