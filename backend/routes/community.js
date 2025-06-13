const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const authMiddleware = require("../middleware/authMiddleware");
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ✅ Extract hashtags without the `#` symbol
const extractHashtags = (content) => {
  const hashtagRegex = /#(\w+)/g; // capture the word without #
  const matches = content.matchAll(hashtagRegex);
  return [...matches].map(match => match[1]); // match[1] = captured word (no #)
};

// Create post
router.post('/posts', authMiddleware, upload.single('file'), async (req, res) => {
  const { content, isImage } = req.body;
  const userId = req.user.userId;
  const userRole = req.user.role;

  try {
    const filePath = req.file ? `uploads/${req.file.filename}` : null;
    const hashtags = extractHashtags(content);
    
    // Determine the correct model reference
    let userModel;
    switch(userRole) {
      case 'pet_owner': userModel = 'User'; break;
      case 'user': userModel = 'User'; break;
      case 'clinic': userModel = 'Clinic'; break;
      case 'vet': userModel = 'Clinic'; break;
      case 'doctor': userModel = 'Doctor'; break;
      case 'shop': userModel = 'Shop'; break;
      case 'admin': userModel = 'Admin'; break;
      default: throw new Error('Invalid user role');
    }

    const newPost = new Post({
      content,
      user: userId,
      userModel,
      img_url: isImage ? filePath : null,
      video_url: !isImage ? filePath : null,
      hashtags,
      likes: [], // Explicitly initialize
      likesModel: [] // Explicitly initialize as array
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Error creating post' });
  }
});

// Get all posts with dynamic population
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate([
        {
          path: 'user',
          select: 'fullName profileImage clinicName shopName name', // Remove role from select
          options: { strictPopulate: false }
        },
        {
          path: 'comments.user',
          select: 'fullName profileImage clinicName shopName name', // Remove role from select
          options: { strictPopulate: false }
        }
      ])
      .sort({ createdAt: -1 });

  const postsWithRoles = posts.map(post => {
  const userWithRole = {
    ...post.user?._doc,
    role: post.userModel?.toLowerCase() || 'unknown'
  };

  const commentsWithRoles = post.comments.map(comment => {
    return {
      ...comment._doc,
      user: {
        ...comment.user?._doc,
        role: comment.userModel?.toLowerCase() || 'unknown'
      }
    };
  });

  return {
    ...post._doc,
    user: userWithRole,
    comments: commentsWithRoles
  };
});

    res.status(200).json(postsWithRoles);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Get user posts count (works for all roles)
router.get('/user-posts', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const userRole = req.user.role;

  try {
    // Determine the correct model reference for query
    let userModel;
    switch(userRole) {
     case 'pet_owner': userModel = 'User'; break;
      case 'user': userModel = 'User'; break;
      case 'clinic': userModel = 'Clinic'; break;
      case 'vet': userModel = 'Clinic'; break;
      case 'doctor': userModel = 'Doctor'; break;
      case 'shop': userModel = 'Shop'; break;
      case 'admin': userModel = 'Admin'; break;
      default: throw new Error('Invalid user role');
    }

    const postCount = await Post.countDocuments({ 
      user: userId,
      userModel 
    });

    const commentCount = await Post.aggregate([
      { $unwind: "$comments" },
      { $match: { 
        "comments.user": new mongoose.Types.ObjectId(userId),
        "comments.userModel": userModel
      }},
      { $count: "commentCount" }
    ]);

    const likeCount = await Post.aggregate([
      { $unwind: "$likes" },
      { $match: { 
        likes: new mongoose.Types.ObjectId(userId),
        likesModel: userModel
      }},
      { $count: "likeCount" }
    ]);

    res.status(200).json({
      postCount,
      CommentCount: commentCount.length > 0 ? commentCount[0].commentCount : 0,
      LikeCount: likeCount.length > 0 ? likeCount[0].likeCount : 0
    });
  } catch (error) {
    console.error('Error fetching post count:', error);
    res.status(500).json({ message: 'Error fetching post count' });
  }
});

// Like/Unlike post
router.post('/posts/:postId/like', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Initialize arrays if they don't exist
    if (!post.likes) post.likes = [];
    if (!post.likesModel) post.likesModel = [];

    // Determine the correct model reference
    let userModel;
    switch(userRole) {
      case 'pet_owner': userModel = 'User'; break;
      case 'user': userModel = 'User'; break;
      case 'clinic': userModel = 'Clinic'; break;
      case 'vet': userModel = 'Clinic'; break;
      case 'doctor': userModel = 'Doctor'; break;
      case 'shop': userModel = 'Shop'; break;
      case 'admin': userModel = 'Admin'; break;
      default: throw new Error('Invalid user role');
    }

    // Check if user already liked the post
    const likeIndex = post.likes.findIndex(
      (like, index) => like.toString() === userId && post.likesModel[index] === userModel
    );

    if (likeIndex === -1) {
      post.likes.push(userId);
      post.likesModel.push(userModel); // Push to the array
    } else {
      post.likes.splice(likeIndex, 1);
      post.likesModel.splice(likeIndex, 1);
    }

    await post.save();
    res.json({ likes: post.likes.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating likes' });
  }
});

// Get like details
router.get('/posts/:postId/likes', async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId)
      .populate([
        {
          path: 'likes',
          select: 'fullName profileImage role clinicName shopName name',
          options: { strictPopulate: false }
        }
      ]);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json(post.likes);
  } catch (error) {
    console.error('Error fetching like details:', error);
    res.status(500).json({ message: 'Error fetching like details' });
  }
});

// Add comment
router.post('/posts/:postId/comments', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user.userId;
  const userRole = req.user.role;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Determine the correct model reference
    let userModel;
    switch(userRole) {
      case 'pet_owner': userModel = 'User'; break;
      case 'user': userModel = 'User'; break;
      case 'clinic': userModel = 'Clinic'; break;
      case 'vet': userModel = 'Clinic'; break;
      case 'doctor': userModel = 'Doctor'; break;
      case 'shop': userModel = 'Shop'; break;
      case 'admin': userModel = 'Admin'; break;
      default: throw new Error('Invalid user role');
    }

    post.comments.push({
      user: userId,
      userModel,
      content
    });

    await post.save();

    const populatedPost = await Post.findById(postId)
      .populate([
        {
          path: 'comments.user',
          select: 'fullName profileImage role clinicName shopName name',
          options: { strictPopulate: false }
        }
      ]);

    res.status(201).json(populatedPost.comments);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Delete post
router.delete('/posts/:postId', authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check if user is owner or admin
    const isOwner = post.user.toString() === userId && post.userModel === 
      (userRole === 'clinic' ? 'Clinic' : 
       userRole === 'doctor' ? 'Doctor' : 
       userRole === 'shop' ? 'Shop' : 
       userRole === 'admin' ? 'Admin' : 'User');

    if (!isOwner && userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
});

module.exports = router;
