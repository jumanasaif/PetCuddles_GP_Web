const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');
const notificationController = require("../controllers/notificationController");
const adminMiddleware = require('../middleware/adminMiddleware');


const checkStockAfterOrder = async (order) => {
  try {
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      
      if (product.stock <= product.threshold) {
       const notification = await notificationController.createNotification(
         order.shopId,
         `Low stock alert: ${product.name} is below threshold (${product.stock}/${product.threshold})`,
         `/shop/products/${product._id}`,
         'system',
         req.app.get('wss')          
       );

      }
      
      if (product.stock === 0) {
       const notification = await notificationController.createNotification(
         order.shopId,
         `Out of stock: ${product.name} is now sold out`,
         `/shop/products/${product._id}`,
         'system',
         req.app.get('wss')          
       );
     
      }
    }
  } catch (error) {
    console.error('Post-order stock check error:', error);
  }
};


// Create new order
router.post('/', authMiddleware, async (req, res) => {
   try {
    const { 
      shopId, 
      items, 
      subtotal,
      discount,
      deliveryCost,
      totalAmount,
      paymentMethod 
    } = req.body;
    
    // Calculate subtotal if not provided
    const calculatedSubtotal = subtotal !== undefined ? subtotal : 
      items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);

    // Calculate discount if not provided
    const calculatedDiscount = discount !== undefined ? discount : 0;

    // Calculate delivery cost if not provided
    const calculatedDeliveryCost = deliveryCost !== undefined ? deliveryCost : 0;

    // Calculate total if not provided
    const calculatedTotal = totalAmount !== undefined ? totalAmount : 
      calculatedSubtotal - calculatedDiscount + calculatedDeliveryCost;

    // Validate all required fields
    if (!shopId || !items || !items.length || isNaN(calculatedSubtotal) || 
        isNaN(calculatedDiscount) || isNaN(calculatedDeliveryCost) || 
        isNaN(calculatedTotal) || !paymentMethod) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing or invalid required fields' 
      });
    }

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ 
        success: false,
        message: 'Shop not found' 
      });
    }

    // Validate products and stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          success: false,
          message: `Product ${item.productId} not found` 
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false,
          message: `Not enough stock for ${product.name}` 
        });
      }
    }

    // Create order with all required fields
    const order = new Order({
      customerId: req.user.userId,
      shopId,
      items,
      subtotal,
      discount,
      deliveryCost,
      totalAmount,
      paymentMethod,
      status: 'pending'
    });

    await order.save();
    

    // Update product stocks
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    await checkStockAfterOrder(order);

    const notification = await notificationController.createNotification(
       shopId,
        `New Order placed now click to see it !`,
       `/shop/orders`,
        'system',
         req.app.get('wss')
                
    );

    res.status(201).json({ 
      success: true,
      message: 'Order created successfully',
      order 
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Get user orders
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.userId })
      .populate('shopId', 'shopName')
      .populate('items.productId', 'name images');

    res.json({ 
      success: true,
      orders 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Get shop orders
router.get('/shop', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'shop') {
      return res.status(403).json({ 
        success: false,
        message: 'Access forbidden' 
      });
    }

    const orders = await Order.find({ shopId: req.user.userId })
      .populate('customerId', 'fullName phone email city village')
      .populate('items.productId', 'name images');

    res.json({ 
      success: true,
      orders 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Update order status
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status' 
      });
    }

    // Check if order exists and belongs to the shop
    const order = await Order.findOne({ 
      _id: orderId,
      shopId: req.user.userId 
    });

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Update status
    order.status = status;
    await order.save();

    res.json({ 
      success: true,
      message: 'Order status updated',
      order 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
     
    });
     console.log(error);
  }
});


router.get('/admin/shop/:shopId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { shopId: req.params.shopId };
    if (status) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('customerId', 'fullName email phone')
        .populate('items.productId', 'name images'),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shop orders',
      error: error.message
    });
  }
});

module.exports = router;