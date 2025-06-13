const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Coupon = require('../models/Coupon');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Generate a random coupon code
const generateCouponCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create a new coupon
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      discountType = 'amount', 
      discountAmount, 
      isPetCuddles = false,
      conditions, 
      isActive = true 
    } = req.body;
    
    // Validate discount amount based on type
    if (discountType === 'percentage' && (discountAmount < 0 || discountAmount > 100)) {
      return res.status(400).json({ message: 'Percentage discount must be between 0 and 100' });
    }
    
    // Generate a unique coupon code
    let code;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 5) {
      code = generateCouponCode();
      const exists = await Coupon.findOne({ code });
      if (!exists) isUnique = true;
      attempts++;
    }
    
    if (!isUnique) {
      return res.status(400).json({ message: 'Failed to generate unique coupon code' });
    }
    
    // For Pet Cuddles coupons, set default 15% discount if not provided
    const finalDiscountAmount = isPetCuddles && !discountAmount ? 15 : discountAmount;
    
    const coupon = new Coupon({
      shopId: req.user.userId,
      code,
      discountType,
      discountAmount: finalDiscountAmount,
      isPetCuddles,
      conditions: {
        minPurchase: conditions?.minPurchase || 0,
        validUntil: isPetCuddles ? null : new Date(conditions?.validUntil || Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days if not Pet Cuddles
        firstOrderOnly: conditions?.firstOrderOnly || false,
        specificProducts: conditions?.specificProducts || [],
        categories: conditions?.categories || [],
        subcategories: conditions?.subcategories || []
      },
      isActive
    });
    
    await coupon.save();
    
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all coupons for a shop
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, activeOnly } = req.query;
    const query = { shopId: req.user.userId };
    
    if (activeOnly === 'true') {
      query.isActive = true;
      // For Pet Cuddles coupons, we don't check validUntil
      query.$or = [
        { isPetCuddles: true },
        { 'conditions.validUntil': { $gte: new Date() } }
      ];
    }
    
    const coupons = await Coupon.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .populate('conditions.specificProducts', 'name price images category subcategory');
    
    const count = await Coupon.countDocuments(query);
    
    res.json({
      coupons,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a single coupon
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      _id: req.params.id,
      shopId: req.user.userId
    }).populate('conditions.specificProducts', 'name price images category subcategory');
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a coupon
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { 
      discountType, 
      discountAmount, 
      isPetCuddles,
      conditions, 
      isActive 
    } = req.body;
    
    // Validate discount amount based on type
    if (discountType === 'percentage' && (discountAmount < 0 || discountAmount > 100)) {
      return res.status(400).json({ message: 'Percentage discount must be between 0 and 100' });
    }
    
    // For Pet Cuddles coupons, set default 15% discount if not provided
    const finalDiscountAmount = isPetCuddles && !discountAmount ? 15 : discountAmount;
    
    const updateData = {
      discountType,
      discountAmount: finalDiscountAmount,
      isPetCuddles,
      isActive,
      conditions: {
        minPurchase: conditions?.minPurchase || 0,
        firstOrderOnly: conditions?.firstOrderOnly || false,
        specificProducts: conditions?.specificProducts || [],
        categories: conditions?.categories || [],
        subcategories: conditions?.subcategories || []
      }
    };
    
    // Only update validUntil if not a Pet Cuddles coupon
    if (!isPetCuddles && conditions?.validUntil) {
      updateData.conditions.validUntil = new Date(conditions.validUntil);
    }
    
    const coupon = await Coupon.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user.userId },
      updateData,
      { new: true }
    ).populate('conditions.specificProducts', 'name price images category subcategory');
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a coupon
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndDelete({
      _id: req.params.id,
      shopId: req.user.userId
    });
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Validate a coupon (public endpoint)
router.post('/validate', async (req, res) => {
  try {
    const { code, shopId, userId, orderTotal, productIds = [], isPetCuddlesUser = false } = req.body;
    
    // First check for Pet Cuddles coupon if user is from platform
    if (isPetCuddlesUser) {
      const petCuddlesCoupon = await Coupon.findOne({ 
        shopId,
        isPetCuddles: true,
        isActive: true
      });
      
      if (petCuddlesCoupon) {
        return res.json({
          valid: true,
          coupon: {
            _id: petCuddlesCoupon._id,
            code: petCuddlesCoupon.code,
            discountAmount: petCuddlesCoupon.discountAmount,
            discountType: petCuddlesCoupon.discountType,
            isPetCuddles: true
          }
        });
      }
    }
    
    // Then check for regular coupon if code is provided
    if (!code) {
      return res.status(400).json({ 
        valid: false,
        message: 'Coupon code is required' 
      });
    }
    
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      shopId,
      isActive: true
    }).populate('conditions.specificProducts', '_id category subcategory');
    
    if (!coupon) {
      return res.status(404).json({ 
        valid: false,
        message: 'Coupon not found or expired' 
      });
    }
    
    // Skip validation for Pet Cuddles coupons
    if (!coupon.isPetCuddles) {
      // Check if coupon is still valid
      if (coupon.conditions.validUntil && new Date(coupon.conditions.validUntil) < new Date()) {
        return res.status(400).json({ 
          valid: false,
          message: 'Coupon has expired' 
        });
      }
      
      // Check minimum purchase amount
      if (coupon.conditions.minPurchase > 0 && orderTotal < coupon.conditions.minPurchase) {
        return res.status(400).json({ 
          valid: false,
          message: `Minimum purchase of $${coupon.conditions.minPurchase} required for this coupon` 
        });
      }
      
      // Check if first order only
      if (coupon.conditions.firstOrderOnly) {
        const orderCount = await Order.countDocuments({ userId });
        if (orderCount > 0) {
          return res.status(400).json({ 
            valid: false,
            message: 'Coupon is only valid for first order' 
          });
        }
      }
      
      // Check product restrictions
      const hasProductRestrictions = 
        coupon.conditions.specificProducts?.length > 0 || 
        coupon.conditions.categories?.length > 0 || 
        coupon.conditions.subcategories?.length > 0;
      
      if (hasProductRestrictions && productIds.length === 0) {
        return res.status(400).json({ 
          valid: false,
          message: 'This coupon requires specific products in your cart' 
        });
      }
      
      if (hasProductRestrictions) {
        // Get product details for all products in cart
        const products = await Product.find({ 
          _id: { $in: productIds },
          shopId
        });
        
        // Check specific products
        if (coupon.conditions.specificProducts?.length > 0) {
          const specificProductIds = coupon.conditions.specificProducts.map(p => p._id.toString());
          const hasMatchingProduct = products.some(p => specificProductIds.includes(p._id.toString()));
          
          if (!hasMatchingProduct) {
            return res.status(400).json({ 
              valid: false,
              message: 'Coupon is not valid for any products in your cart' 
            });
          }
        }
        
        // Check categories
        if (coupon.conditions.categories?.length > 0) {
          const hasMatchingCategory = products.some(p => 
            coupon.conditions.categories.includes(p.category)
          );
          
          if (!hasMatchingCategory) {
            return res.status(400).json({ 
              valid: false,
              message: 'Coupon is not valid for any product categories in your cart' 
            });
          }
        }
        
        // Check subcategories
        if (coupon.conditions.subcategories?.length > 0) {
          const hasMatchingSubcategory = products.some(p => 
            p.subcategory && coupon.conditions.subcategories.includes(p.subcategory)
          );
          
          if (!hasMatchingSubcategory) {
            return res.status(400).json({ 
              valid: false,
              message: 'Coupon is not valid for any product subcategories in your cart' 
            });
          }
        }
      }
    }
    
    res.json({
      valid: true,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountAmount: coupon.discountAmount,
        discountType: coupon.discountType,
        isPetCuddles: coupon.isPetCuddles
      }
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/shop/:shopId', async (req, res) => {
  try {
    const coupons = await Coupon.find({ 
      shopId: req.params.shopId,
      isActive: true,
      $or: [
        { isPetCuddles: true },
        { 'conditions.validUntil': { $gte: new Date() } }
      ]
    }).select('code discountType discountAmount isPetCuddles conditions');

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.post('/validate-order-coupons', async (req, res) => {
  try {
    const { shopId, userId, orderItems, couponCodes } = req.body;
    
    // Get all products in the order
    const productIds = orderItems.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    
    // Get all coupons being applied
    const coupons = await Coupon.find({ 
      code: { $in: couponCodes },
      shopId,
      isActive: true
    }).populate('conditions.specificProducts');
    
    // Validate each coupon
    const validCoupons = [];
    const errors = [];
    
    for (const coupon of coupons) {
      let isValid = true;
      let errorMessage = '';
      
      // Check expiration
      if (!coupon.isPetCuddles && coupon.conditions.validUntil && new Date(coupon.conditions.validUntil) < new Date()) {
        isValid = false;
        errorMessage = 'Coupon has expired';
      }
      
      // Check minimum purchase
      if (isValid && coupon.conditions.minPurchase > 0) {
        const subtotal = orderItems.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);
        if (subtotal < coupon.conditions.minPurchase) {
          isValid = false;
          errorMessage = `Minimum purchase of $${coupon.conditions.minPurchase} required`;
        }
      }
      
      // Check first order only
      if (isValid && coupon.conditions.firstOrderOnly && userId) {
        const orderCount = await Order.countDocuments({ userId });
        if (orderCount > 0) {
          isValid = false;
          errorMessage = 'Coupon only valid for first order';
        }
      }
      
      // Check product restrictions
      if (isValid) {
        const hasProductRestrictions = 
          coupon.conditions.specificProducts?.length > 0 || 
          coupon.conditions.categories?.length > 0 || 
          coupon.conditions.subcategories?.length > 0;
        
        if (hasProductRestrictions) {
          let hasMatchingProduct = false;
          
          // Check specific products
          if (coupon.conditions.specificProducts?.length > 0) {
            const specificProductIds = coupon.conditions.specificProducts.map(p => p._id.toString());
            hasMatchingProduct = products.some(p => specificProductIds.includes(p._id.toString()));
          }
          
          // Check categories
          if (!hasMatchingProduct && coupon.conditions.categories?.length > 0) {
            hasMatchingProduct = products.some(p => 
              coupon.conditions.categories.includes(p.category)
            );
          }
          
          // Check subcategories
          if (!hasMatchingProduct && coupon.conditions.subcategories?.length > 0) {
            hasMatchingProduct = products.some(p => 
              p.subcategory && coupon.conditions.subcategories.includes(p.subcategory)
            );
          }
          
          if (!hasMatchingProduct) {
            isValid = false;
            errorMessage = 'Coupon not valid for any products in your cart';
          }
        }
      }
      
      if (isValid) {
        validCoupons.push({
          _id: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountAmount: coupon.discountAmount,
          isPetCuddles: coupon.isPetCuddles
        });
      } else {
        errors.push({
          code: coupon.code,
          message: errorMessage
        });
      }
    }
    
    res.json({
      success: true,
      validCoupons,
      errors
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating coupons',
      error: error.message
    });
  }
});


module.exports = router;
