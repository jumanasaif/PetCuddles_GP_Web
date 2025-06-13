const express = require('express');
const router = express.Router();
const stripe = require('stripe')('sk_test_51RIbAR4CVrHa7X9FbfpOePCnA9rtSPDWD9AA65h9eAJltnQYfh3PCmkFWwCRxPGPdyoJ67NixHMwHesFzwYMxeav00nbbiit6x');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const User = require('../models/User');

const Product = require('../models/Product');

const Coupon = require('../models/Coupon');
const authMiddleware = require('../middleware/authMiddleware');
const axios = require('axios');

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
}



// Create payment intent for order
router.post('/create-payment-intent', authMiddleware, async (req, res) => {
  try {
    const { shopId, items, deliveryAddress, appliedCoupons } = req.body;
    
    // Validate request
    if (!shopId || !items || !items.length) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    // Get shop and validate delivery settings
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ 
        success: false,
        message: 'Shop not found' 
      });
    }

    // Calculate order amounts
    const subtotal = items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);
    let discount = 0;
    
    // Calculate discount from coupons (you would implement this logic)
    // ...

    // Calculate delivery cost
    let deliveryCost = 0;
    if (deliveryAddress && shop.deliverySettings) {
      deliveryCost = shop.deliverySettings.cost || 0;
      
      // Check for free delivery threshold
      if (shop.deliverySettings.freeDeliveryThreshold > 0 && 
          subtotal >= shop.deliverySettings.freeDeliveryThreshold) {
        deliveryCost = 0;
      }
    }

    const totalAmount = subtotal - discount + deliveryCost;

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Amount in cents
      currency: 'usd',
      metadata: {
        shopId,
        userId: req.user.userId,
        orderType: 'shop_order'
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount
    });

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Payment processing failed',
      error: error.message 
    });
  }
});

router.post('/process-payment', authMiddleware, async (req, res) => {
  try {
    const { 
      shopId, 
      items, 
      deliveryAddress, 
      appliedCoupons, 
      paymentMethod,
      paymentMethodId
    } = req.body;

    // Validate request
    if (!shopId || !items || !items.length || !paymentMethod) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields' 
      });
    }

    // Get shop details
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ 
        success: false,
        message: 'Shop not found' 
      });
    }

    // Calculate order amounts
    const subtotal = items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);
    let discount = 0;
    
    // Calculate discount from coupons if provided
    if (appliedCoupons && appliedCoupons.length > 0) {
      const couponDocs = await Coupon.find({ _id: { $in: appliedCoupons } });
      discount = couponDocs.reduce((total, coupon) => {
        if (coupon.discountType === 'percentage') {
          return total + (subtotal * (coupon.discountAmount / 100));
        } else {
          return total + coupon.discountAmount;
        }
      }, 0);
    }

    // Calculate delivery cost
    let deliveryCost = 0;
    let estimatedDeliveryDays = shop.deliverySettings?.estimatedDays || 3;
    
    if (deliveryAddress && shop.deliverySettings) {
      deliveryCost = shop.deliverySettings.cost || 0;
      
      // Check for free delivery threshold
      if (shop.deliverySettings.freeDeliveryThreshold > 0 && 
          subtotal >= shop.deliverySettings.freeDeliveryThreshold) {
        deliveryCost = 0;
      }
    }

    const totalAmount = subtotal - discount + deliveryCost;

    // Initialize payment variables with default values
    let stripePaymentId = null;
    let paymentStatus = paymentMethod === 'credit_card' ? 'pending' : 'pending';

    // For credit card payments, confirm with Stripe first
    if (paymentMethod === 'credit_card') {
      if (!paymentMethodId) {
        return res.status(400).json({
          success: false,
          message: 'Payment method ID is required for credit card payments'
        });
      }

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalAmount * 100),
          currency: 'usd',
          payment_method: paymentMethodId,
          confirm: true,
          metadata: {
            shopId,
            userId: req.user.userId,
            orderType: 'shop_order'
          },
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never'
          }
        });

        stripePaymentId = paymentIntent.id;
        paymentStatus = 'paid';
      } catch (stripeError) {
        console.error('Stripe confirmation error:', stripeError);
        return res.status(400).json({
          success: false,
          message: 'Payment processing failed',
          error: stripeError.message
        });
      }
    }

    // Convert delivery address to coordinates if provided
    let deliveryCoordinates = null;
    if (deliveryAddress) {
      deliveryCoordinates = await getCoordinates(
        deliveryAddress.city, 
        deliveryAddress.village
      );
    }

    // Create order
    const order = new Order({
      customerId: req.user.userId,
      shopId,
      items,
      subtotal,
      discount,
      deliveryCost,
      totalAmount,
      deliveryAddress: deliveryAddress ? {
        ...deliveryAddress,
        coordinates: deliveryCoordinates
      } : null,
      estimatedDeliveryDays,
      paymentMethod,
      appliedCoupons,
      paymentStatus: paymentStatus,
      stripePaymentId: stripePaymentId
    });

    await order.save();

    // Update product stocks
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    res.status(201).json({ 
      success: true,
      message: 'Order created successfully',
      order 
    });

  } catch (error) {
    console.error('Order processing error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error processing order',
      error: error.message 
    });
  }
});

module.exports = router;