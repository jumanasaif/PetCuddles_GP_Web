const express = require('express');
const router = express.Router();
const LibraryCategory = require('../models/LibraryCategory');
const LibraryItem = require('../models/LibraryItem');
const UserBookmark = require('../models/UserBookmark');
const Pet = require('../models/Pet');
const authMiddleware = require('../middleware/authMiddleware');
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


// Get all categories with item counts
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await LibraryCategory.aggregate([
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
          description: 1,
          icon: 1,
          color: 1,
          itemCount: { $size: '$items' }
        }
      },
      { $sort: { name: 1 } }
    ]);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get library items with filters
router.get('/items', authMiddleware, async (req, res) => {
  try {
    console.log('Received query params:', req.query); // Log the incoming query
    
    const { category, petType, search, difficulty, type, limit } = req.query;
    const query = {};
    
    if (category) query.categories = category;
    if (petType) query.petTypes = petType;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Constructed query:', query); // Log the MongoDB query
    
    const options = {
      populate: 'categories',
      sort: { isFeatured: -1, createdAt: -1 }
    };
    
    if (limit) options.limit = parseInt(limit);
    
    const items = await LibraryItem.find(query, null, options);
    console.log('Found items:', items.length); // Log how many items were found
    
    const formattedItems = items.map(item => formatFilePaths(item.toObject()));

    const bookmarks = await UserBookmark.find({ userId: req.user.userId });
    const bookmarkedIds = bookmarks.map(b => b.itemId.toString());
    
    const itemsWithBookmarks = formattedItems.map(item => ({
      ...item,
      isBookmarked: bookmarkedIds.includes(item._id.toString())
    }));
    
    res.json(itemsWithBookmarks);
  } catch (error) {
    console.error('Error in /items route:', error); // Detailed error logging
    res.status(500).json({ 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.get('/items/:id', authMiddleware, async (req, res) => {
  try {
    const item = await LibraryItem.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('categories');
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    const formattedItem = formatFilePaths(item.toObject());
    
    const bookmark = await UserBookmark.findOne({
      userId: req.user.userId,
      itemId: item._id
    });
    
    res.json({
      ...formattedItem,
      isBookmarked: !!bookmark
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle bookmark
router.post('/items/:id/bookmark', authMiddleware, async (req, res) => {
  try {
    const bookmark = await UserBookmark.findOneAndDelete({
      userId: req.user.userId,
      itemId: req.params.id
    });
    
    if (!bookmark) {
      const newBookmark = new UserBookmark({
        userId: req.user.userId,
        itemId: req.params.id
      });
      await newBookmark.save();
      return res.json({ bookmarked: true });
    }
    
    res.json({ bookmarked: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user bookmarks
router.get('/bookmarks', authMiddleware, async (req, res) => {
  try {
    const bookmarks = await UserBookmark.find({ userId: req.user.userId })
      .populate({
        path: 'itemId',
        populate: { path: 'categories' }
      })
      .sort({ createdAt: -1 });
      
    res.json(bookmarks.map(b => ({
      ...b.itemId.toObject(),
      isBookmarked: true
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get recommended items based on user's pets
router.get('/recommended', authMiddleware, async (req, res) => {
  try {
    const pets = await Pet.find({
      $or: [
        { owner_id: req.user.userId },
        { 'temporaryCaretaker.userId': req.user.userId }
      ]
    });
    
    const petTypes = [...new Set(pets.map(p => p.species))];
    
    if (petTypes.length === 0) {
      return res.json([]);
    }
    
    const recommended = await LibraryItem.find({
      petTypes: { $in: petTypes },
      isFeatured: true
    })
    .limit(6)
    .populate('categories');
    
    // Check bookmarks
    const bookmarks = await UserBookmark.find({ userId: req.user.userId });
    const bookmarkedIds = bookmarks.map(b => b.itemId.toString());
    
    const itemsWithBookmarks = recommended.map(item => ({
      ...item.toObject(),
      isBookmarked: bookmarkedIds.includes(item._id.toString())
    }));
    
    res.json(itemsWithBookmarks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;