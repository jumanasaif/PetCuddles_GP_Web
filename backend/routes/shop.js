const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const multer = require('multer');
const path = require('path');

// Activate shop after payment
router.put('/:shopId/activate', authMiddleware, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    shop.isActive = true;
    shop.subscription = {
      plan: req.body.plan || 'monthly',
      startDate: new Date(),
      endDate: calculateEndDate(req.body.plan),
      isActive: true
    };

    await shop.save();
    res.json({ message: 'Shop activated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Configure multer for shop profile image uploads
const shopUpload = multer({ 
  dest: 'uploads/shop-profiles/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png) are allowed!'));
  }
});

// Get Shop Profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    const shop = await Shop.findById(req.user.userId)
      .select('-password -__v -createdAt -updatedAt');

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Get shop statistics
    const productCount = await Product.countDocuments({ shopId: req.user.userId });
    const pendingOrders = await Order.countDocuments({ 
      shopId: req.user.userId, 
      status: 'pending' 
    });
    const completedOrders = await Order.countDocuments({ 
      shopId: req.user.userId, 
      status: 'delivered' 
    });

    res.json({
      ...shop.toObject(),
      stats: {
        productCount,
        pendingOrders,
        completedOrders
      }
    });
  } catch (error) {
    console.error('Error fetching shop profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Shop Name (for welcome section)
router.get('/name', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    const shop = await Shop.findById(req.user.userId).select('shopName');
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    res.json({ 
      shopName: shop.shopName,
      fullName: shop.fullName 
    });
  } catch (error) {
    console.error('Error fetching shop name:', error);
    res.status(500).json({ message: 'Error fetching shop name', error: error.message });
  }
});

// Get Public Shop Profile
router.get('/public-profile/:shopId', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId)
      .select('-password -__v -createdAt -updatedAt');

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    
    // Convert to object and process image URLs
    const shopObj = shop.toObject();
    
    // Process shop profile image
    if (shopObj.profileImage && !shopObj.profileImage.startsWith('http')) {
      shopObj.profileImage = `${req.protocol}://${req.get('host')}${shopObj.profileImage}`;
    }

    // Get top products
    const products = await Product.find({ shopId: shop._id, stock: { $gt: 0 } })
      .limit(8)
      .select('name price images category');

    res.json({
      ...shopObj,
      products
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get shop working hours
router.get('/:id/working-hours', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).select('workingHours');
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    res.json({
      success: true,
      workingHours: shop.workingHours
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching working hours',
      error: error.message 
    });
  }
});

// Update Shop Profile
router.put('/profile', authMiddleware, shopUpload.single('profileImage'), async (req, res) => {
  try {
    if (req.user.role !== 'shop') {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    const { shopName, fullName, email, phone, city, village, DeliveryProvide, workingHours } = req.body;
    const updateData = { 
      shopName, 
      fullName, 
      email, 
      phone, 
      city, 
      village, 
      DeliveryProvide: DeliveryProvide === 'true' 
    };

    // Parse working hours if provided
    if (workingHours) {
      try {
        updateData.workingHours = JSON.parse(workingHours);
      } catch (err) {
        console.error('Error parsing working hours:', err);
      }
    }

    // Handle profile image upload
    if (req.file) {
      updateData.profileImage = `/uploads/shop-profiles/${req.file.filename}`;
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.json({
      message: 'Shop profile updated successfully',
      shop: updatedShop
    });
  } catch (error) {
    console.error('Error updating shop profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, city, sortByDistance, lat, lng } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { shopName: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    if (city) {
      query.city = city;
    }

    let shops = await Shop.find(query).select('-password -__v');

    // Process shops to include full image URLs
    shops = shops.map(shop => {
      const shopObj = shop.toObject();
      
      // If profileImage exists and doesn't already have the full URL, prepend the base URL
      if (shopObj.profileImage && !shopObj.profileImage.startsWith('http')) {
        shopObj.profileImage = `${req.protocol}://${req.get('host')}${shopObj.profileImage}`;
      }
      
      return shopObj;
    });

    // Sort by distance if coordinates provided
    if (sortByDistance === 'true' && lat && lng) {
      shops = shops.map(shop => {
        if (shop.coordinates && shop.coordinates.lat && shop.coordinates.lng) {
          const distance = geolib.getDistance(
            { latitude: lat, longitude: lng },
            { latitude: shop.coordinates.lat, longitude: shop.coordinates.lng }
          );
          return { ...shop, distance };
        }
        return { ...shop, distance: null };
      }).filter(shop => shop.distance !== null)
        .sort((a, b) => a.distance - b.distance);
    }

    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get shop products
router.get('/:shopId/products', async (req, res) => {
  try {
    const products = await Product.find({ 
      shopId: req.params.shopId,
      stock: { $gt: 0 } 
    }).select('name price images petTypes category');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single product details
router.get('/products/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate('shopId', 'shopName city village');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;