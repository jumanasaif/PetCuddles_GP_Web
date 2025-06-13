const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const notificationController = require("../controllers/notificationController");
const fs = require('fs');
const path = require('path');
const multer = require('multer');



const deleteImages = (imageUrls) => {
  if (!imageUrls || !Array.isArray(imageUrls)) return;

  imageUrls.forEach(imageUrl => {
    try {
      if (typeof imageUrl === 'string') {
        // Remove base URL if present
        const cleanUrl = imageUrl.replace(/^https?:\/\/[^/]+/, '');
        const filePath = path.join(__dirname, '..', cleanUrl);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Deleted image:', filePath);
        }
      }
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  });
};


// Image upload endpoint
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const { images } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'No images were provided' });
    }

    // Validate Base64 images
    const validImages = images.filter(img => {
      return typeof img === 'string' && img.startsWith('data:image/');
    });

    res.status(200).json({
      success: true,
      images: validImages
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to process images',
      error: error.message 
    });
  }
});


// Get all products for a shop
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, petType, search } = req.query;
    const query = { shopId: req.user.userId };

    if (category) query.category = category;
    if (petType) query.petTypes = petType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get product statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const shopId = req.user.userId;
    
    const stats = await Product.aggregate([
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                totalStock: { $sum: '$stock' },
                totalStockValue: { $sum: { $multiply: ['$price', '$stock'] } }
              }
            }
          ],
          lowStock: [
            { 
              $match: { 
                $expr: {
                  $and: [
                    { $gt: ['$stock', 0] },
                    { $lte: ['$stock', '$threshold'] }
                  ]
                }
              } 
            },
            { $count: 'count' }
          ],
          outOfStock: [
            { $match: { stock: 0 } },
            { $count: 'count' }
          ]
        }
      },
      {
        $project: {
          totalProducts: { $ifNull: [{ $arrayElemAt: ['$summary.totalProducts', 0] }, 0] },
          totalStock: { $ifNull: [{ $arrayElemAt: ['$summary.totalStock', 0] }, 0] },
          totalStockValue: { $ifNull: [{ $arrayElemAt: ['$summary.totalStockValue', 0] }, 0] },
          lowStockCount: { $ifNull: [{ $arrayElemAt: ['$lowStock.count', 0] }, 0] },
          outOfStockCount: { $ifNull: [{ $arrayElemAt: ['$outOfStock.count', 0] }, 0] }
        }
      }
    ]);

    const result = stats[0] || {
      totalProducts: 0,
      totalStock: 0,
      totalStockValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product statistics',
      error: error.message
    });
  }
});
// Get low stock products
router.get('/low-stock', authMiddleware, async (req, res) => {
  try {
    const shopId =req.user.userId;
    
    const products = await Product.find({
      shopId: shopId,
      stock: { $gt: 0 },
      $where: function() {
        return this.stock <= this.threshold;
      }
    }).sort({ stock: 1 });

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products',
      error: error.message
    });
  }
});

// Get out of stock products
router.get('/out-of-stock', authMiddleware, async (req, res) => {
  try {
    const shopId = req.user.userId;
    
    const products = await Product.find({
      shopId: shopId,
      stock: 0
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Out of stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch out of stock products',
      error: error.message
    });
  }
});


// Create product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { images, ...productData } = req.body;

    const product = await Product.create({
      ...productData,
      shopId: req.user.userId,
      images: Array.isArray(images) ? images : [],
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock),
      threshold: parseInt(productData.threshold),
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});



// Get single product
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      shopId: req.user.userId
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Convert to plain object and format images consistently
    const productData = product.toObject();
    productData.images = productData.images.map(img => {
      if (typeof img === 'string') {
        return {
          data: img.startsWith('http') ? img : `http://localhost:5000${img}`,
          contentType: 'image/jpeg'
        };
      }
      return img; // if it's already an object
    });

    res.json(productData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Middleware to check stock after product updates
const checkStockAfterUpdate = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return next();
    
    const newStock = parseInt(req.body.stock) || product.stock;
    const threshold = parseInt(req.body.threshold) || product.threshold;
    
    // Check if stock crossed threshold
    if (product.stock > product.threshold && newStock <= threshold) {

      // Stock just went below threshold
      const notification = await notificationController.createNotification(
        product.shopId?._id,
        `Low stock alert: ${product.name} is below threshold (${newStock}/${threshold})`,
        `/shop/products/${product._id}`,
        'system',
        req.app.get('wss')
      );
    }


    // Check if stock went to 0
    if (product.stock > 0 && newStock === 0) {
      const notification = await notificationController.createNotification(
        product.shopId?._id,
        `Out of stock: ${product.name} is now sold out`,
        `/shop/products/${product._id}`,
        'system',
        req.app.get('wss')
      );
    }
 

    next();
  } catch (error) {
    console.error('Stock check error:', error);
    next();
  }
};



// Update product
router.put('/:id', authMiddleware,checkStockAfterUpdate,async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user.userId },
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});



// Delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      shopId: req.user.userId
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete associated images if needed
    if (product.images && product.images.length > 0) {
      deleteImages(product.images);
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;