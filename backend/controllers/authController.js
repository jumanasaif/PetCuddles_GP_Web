const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Shop = require('../models/Shop');
const Doctor = require('../models/Doctor');

const Clinic = require('../models/Clinic');
const crypto = require('crypto');
require('dotenv').config();
const nodemailer = require('nodemailer'); // Add email functionality for forgot password



exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({ fullName, email, phone, password });

    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Server error' });
  }
};


// Login function
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user in parallel across all collections
    const [user, admin, clinic, shop, doctor] = await Promise.all([
      User.findOne({ email }).select('+password'),
      Admin.findOne({ email }).select('+password'),
      Clinic.findOne({ email }).select('+password'),
      Shop.findOne({ email }).select('+password'),
      Doctor.findOne({ email }).select('+password')
    ]);

    let authenticatedUser = null;
    let userType = null;

    // Admin check
    if (email === 'admin@vetconnect.com') {
      if (!admin) {
        const defaultAdmin = await Admin.getAdmin();
        authenticatedUser = defaultAdmin;
      } else {
        authenticatedUser = admin;
      }
      userType = 'admin';
    } else if (user) {
      authenticatedUser = user;
      userType = 'user';
    } else if (clinic) {
      authenticatedUser = clinic;
      userType = 'clinic';
    } else if (doctor) {
      authenticatedUser = doctor;
      userType = 'doctor';
    } else if (shop) {
      authenticatedUser = shop;
      userType = 'shop';
    } else {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!authenticatedUser.password) {
      return res.status(400).json({ message: "Invalid password" });
    }

    


    // Base response
    const response = {
      userType,
      userData: {
        id: authenticatedUser._id,
        email: authenticatedUser.email,
        role: authenticatedUser.role || userType
      }
    };

    // Token & data for each type
    switch (userType) {
      case 'user':
        response.token = jwt.sign(
          { userId: authenticatedUser._id, role: 'user' },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        response.userData.fullName = authenticatedUser.fullName;
        response.userData.city = authenticatedUser.city;
        response.userData.phone = authenticatedUser.phone;
        break;

      case 'clinic':
        response.token = jwt.sign(
          { userId: authenticatedUser._id, role: 'clinic' },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        response.userData.fullName = authenticatedUser.fullName;
        response.userData.clinicName = authenticatedUser.clinicName;
        response.userData.clinicLicense = authenticatedUser.clinicLicense;
        response.userData.city = authenticatedUser.city;
        response.userData.village = authenticatedUser.village || " ";
        response.userData.phone = authenticatedUser.phone;
        response.userData.workingHours = authenticatedUser.workingHours;
        break;

      case 'shop':
        response.token = jwt.sign(
          { userId: authenticatedUser._id, role: 'shop' },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        response.userData.fullName = authenticatedUser.fullName;
        response.userData.shopName = authenticatedUser.shopName;
        response.userData.city = authenticatedUser.city;
        response.userData.village = authenticatedUser.village || " ";
        response.userData.phone = authenticatedUser.phone;
        response.userData.workingHours = authenticatedUser.workingHours;
        break;

      case 'doctor':
        response.token = authenticatedUser.generateAuthToken();
        response.userData.name = authenticatedUser.name;
        response.userData.gender = authenticatedUser.gender;
        response.userData.phone = authenticatedUser.phone;
        response.userData.specialty = authenticatedUser.specialty;
        response.userData.status = authenticatedUser.status;
        response.userData.clinicId = authenticatedUser.clinic;
        break;

      case 'admin':
        response.token = authenticatedUser.generateAuthToken();
        response.userData.isAdmin = true;
        break;
    }

    res.json(response);

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: error.message 
    });
  }
};



// Forgot Password Function
exports.forgotPassword = async (req, res) => {
  try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) return res.status(404).json({ message: "User not found" });

      // Generate a random token (plain text)
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Save plain token in DB (No hashing)
      user.resetToken = resetToken;
      user.tokenExpiry = Date.now() + 3600000; // 1 hour expiry

      await user.save();
    
      // Send email with reset link
      const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
      console.log("Send this reset link:", resetURL);
        // Configure email transport
        let transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
              user: process.env.EMAIL,
              pass: process.env.EMAIL_PASSWORD
          },
      });

      await transporter.sendMail({
          from: process.env.EMAIL,
          to: user.email,
          subject: "Password Reset",
          text: `Click the link to reset your password: ${resetURL}`,
      });

      res.json({ message: "Reset link sent to email" });
     } catch (error) {
      console.error("Forgot Password Error:", error);
      res.status(500).json({ message: "Server error" });
   }

};


// Reset Password Function

exports.resetPassword = async (req, res) => {
  try {
      const { token, newPassword } = req.body;

      // Find user with this token
      const user = await User.findOne({ resetToken: token });

      if (!user) {
          return res.status(400).json({ message: "Invalid or expired token" });
      }

      //  Hash new password before saving
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user password and clear reset token
      user.password = hashedPassword;
      user.resetToken = null;
      user.tokenExpiry = null;

      await user.save();

      res.json({ message: "Password successfully reset! You can now log in." });

  } catch (error) {
      res.status(500).json({ message: "Server error" });
  }
};
