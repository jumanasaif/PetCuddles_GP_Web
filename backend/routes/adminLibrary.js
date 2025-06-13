const express = require('express');
const router = express.Router();
const LibraryCategory = require('../models/LibraryCategory');
const LibraryItem = require('../models/LibraryItem');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../config/multer');
const path = require('path');


const formatFilePaths = (item) => {
  if (item.thumbnail) {
    item.thumbnail = item.thumbnail.replace(/\\/g, '/').replace(/.*uploads[\\/]/, '/uploads/');
  }
  if (item.articleFile) {
    item.articleFile = item.articleFile.replace(/\\/g, '/').replace(/.*uploads[\\/]/, '/uploads/');
  }
  if (item.videoFile) {
    item.videoFile = item.videoFile.replace(/\\/g, '/').replace(/.*uploads[\\/]/, '/uploads/');
  }
  if (item.images && item.images.length > 0) {
    item.images = item.images.map(img => 
      img.replace(/\\/g, '/').replace(/.*uploads[\\/]/, '/uploads/')
    );
  }
  return item;
};


// Create category
router.post('/categories', adminMiddleware, async (req, res) => {
  try {
    const category = new LibraryCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all categories
router.get('/categories', adminMiddleware, async (req, res) => {
  try {
    const categories = await LibraryCategory.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Use multiple upload middleware
const uploadMiddleware = upload.fields([
  { name: 'articleFile', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

// Create new item
router.post('/items', adminMiddleware, uploadMiddleware, async (req, res) => {
  try {
    const itemData = req.body;
    
    // Set the type explicitly
    if (!itemData.type) {
      if (itemData.articleContent || itemData.articleFile) itemData.type = 'article';
      else if (itemData.videoUrl || itemData.videoFile) itemData.type = 'video';
      else if (itemData.interactiveTool) itemData.type = 'interactive';
    }

    
    // Handle uploaded files
    if (req.files) {
      if (req.files.articleFile) {
        itemData.articleFile = req.files.articleFile[0].path;
      }
      if (req.files.videoFile) {
        itemData.videoFile = req.files.videoFile[0].path;
      }
      if (req.files.thumbnail) {
        itemData.thumbnail = req.files.thumbnail[0].path;
      }
      if (req.files.images) {
        itemData.images = req.files.images.map(file => file.path);
      }
    }
    
    const item = new LibraryItem(itemData);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update library item
router.put('/items/:id', adminMiddleware, uploadMiddleware, async (req, res) => {
  try {
    const itemData = req.body;
    
    // Handle uploaded files
    if (req.files) {
      if (req.files.articleFile) {
        itemData.articleFile = req.files.articleFile[0].path;
        // Clear content if file is uploaded
        if (itemData.articleContent) delete itemData.articleContent;
      }
      if (req.files.videoFile) {
        itemData.videoFile = req.files.videoFile[0].path;
        // Clear URL if file is uploaded
        if (itemData.videoUrl) delete itemData.videoUrl;
      }
      if (req.files.thumbnail) {
        itemData.thumbnail = req.files.thumbnail[0].path;
      }
      if (req.files.images) {
        // Keep existing images and add new ones
        const existingItem = await LibraryItem.findById(req.params.id);
        const existingImages = existingItem.images || [];
        itemData.images = [
          ...existingImages,
          ...req.files.images.map(file => file.path)
        ];
      }
    }
    
    itemData.updatedAt = new Date();
    
    const item = await LibraryItem.findByIdAndUpdate(
      req.params.id, 
      itemData, 
      { new: true }
    );
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all library items with filters
router.get('/items', adminMiddleware, async (req, res) => {
  try {
    const { category, petType, search, featured, type } = req.query;
    const query = {};
    
    if (category) query.categories = category;
    if (petType) query.petTypes = petType;
    if (featured) query.isFeatured = featured === 'true';
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const items = await LibraryItem.find(query)
      .populate('categories')
      .sort({ createdAt: -1 });
      
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single item
router.get('/items/:id', adminMiddleware, async (req, res) => {
  try {
    const item = await LibraryItem.findById(req.params.id).populate('categories');
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete library item
router.delete('/items/:id', adminMiddleware, async (req, res) => {
  try {
    await LibraryItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get library item analytics
router.get('/analytics', adminMiddleware, async (req, res) => {
  try {
    const [totalItems, totalCategories, mostViewed, popularCategories] = await Promise.all([
      LibraryItem.countDocuments(),
      LibraryCategory.countDocuments(),
      LibraryItem.find().sort({ views: -1 }).limit(5),
      LibraryCategory.aggregate([
        {
          $lookup: {
            from: 'libraryitems',
            localField: '_id',
            foreignField: 'categories',
            as: 'items'
          }
        },
        {
          $project: {
            name: 1,
            itemCount: { $size: '$items' }
          }
        },
        { $sort: { itemCount: -1 } },
        { $limit: 5 }
      ])
    ]);
    
    res.json({
      totalItems,
      totalCategories,
      mostViewed,
      popularCategories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
