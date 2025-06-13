const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Clinic = require('../models/Clinic');
const Admin = require('../models/Admin');
const AdminNotification = require('../models/AdminNotification');
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const Pet = require('../models/Pet');
const Shop = require('../models/Shop');
const Doctor = require('../models/Doctor');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ShopPayment = require('../models/ShopPayment');
const Notification = require('../models/Notifications');
const SkinConditionDetection = require('../models/SkinConditionDetection');
const PetBehaviorLog = require('../models/PetBehaviorLog');
const nodemailer = require('nodemailer');
const TemperatureAlert = require('../models/TemperatureAlert');
const notificationController = require('../controllers/notificationController');
const DiseaseAlert = require('../models/DiseaseAlert');
const UserAlert = require('../models/UserAlert');
const axios = require('axios');

router.get('/get-admin', async (req, res) => {
  try {
    const admin = await Admin.getAdmin();
    res.json({ admin: { _id: admin._id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching admin' });
  }
});


// Get pending vet approvals
router.get('/pending-vets',adminMiddleware, async (req, res) => {
  try {
    const pendingVets = await AdminNotification.find({
      type: 'vet_approval',
      status: 'pending'
    }).populate({
      path: 'vetId',
      select: 'fullName clinicName email phone city clinicLicense createdAt',
      model: 'Clinic'
    });

    res.json({
      success: true,
      data: pendingVets.map(notification => ({
        ...notification.toObject(),
        vetId: notification.vetId, // Ensure vetId is populated
        licenseImage: notification.licenseImage || (notification.vetId && notification.vetId.clinicLicense.imageUrl)
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending veterinarians'
    });
  }
});

// Approve vet
router.post('/approve-vet/:vetId',adminMiddleware, async (req, res) => {
  try {
    const { vetId } = req.params;
    const vet = await Clinic.findByIdAndUpdate(vetId, {
      isVerified: true,
      isActive: true,
      verificationDate: new Date()
    }, { new: true });

    await AdminNotification.findOneAndUpdate(
      { vetId, type: 'vet_approval' },
      { status: 'approved', resolvedAt: new Date() }
    );
    
    if (!vet.email) {
      console.warn(`No email found for vet ${vetId}`);
      return res.json({ 
        success: true, 
        data: vet,
        warning: 'Approval succeeded but no email was sent (no email on record)'
      });
    }
     // Send email with reset link

          const resetURL = `http://localhost:3000/subscriptions/vet/${vetId}`;
          console.log("Send this reset link:", resetURL);
          console.log(`Preparing to send subscription email to: ${vet.email}`);

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
              to: vet.email,
              subject: "Vet Subscription",
              text: `Click the link to make your Subscription in Pet Cuddles !: ${resetURL}`,
          });
    
     
    res.json({ success: true, data: vet });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving veterinarian'
    });
  }
});

// Reject vet
router.post('/reject-vet/:vetId',adminMiddleware,async (req, res) => {
  try {
    const { vetId } = req.params;
    
    await AdminNotification.findOneAndUpdate(
      { vetId, type: 'vet_approval' },
      { status: 'rejected', resolvedAt: new Date() }
    );

     // Send email with reset link
     const resetURL = `http://localhost:3000/subscriptions/vet/${vetId}`;
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
         to: vetId.email,
         subject: "Vet Subscription",
         text: "You're Request to Join Pet Cuddles was Rejected",
     });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting veterinarian'
    });
  }
});


// Get total counts for dashboard : api/admin/:
router.get('/dashboard-stats', adminMiddleware, async (req, res) => {
  try {
    // Get counts in parallel for better performance
    const [
      usersCount,
      petsCount,
      clinicsCount,
      shopsCount,
      doctorsCount,
      clinicPaymentsSum,
      shopPaymentsSum,
      pendingApprovalsCount,
      alertsCount
    ] = await Promise.all([
      User.countDocuments({ role: 'pet_owner' }),
      Pet.countDocuments(),
      Clinic.countDocuments(),
      Shop.countDocuments(),
      Doctor.countDocuments(),
      // Sum of successful clinic payments
      Payment.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: "$adminAmount" } } }
      ]),
      // Sum of successful shop payments
      ShopPayment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: "$adminAmount" } } }
      ]),
      // Pending approvals (clinics + shops)
      Promise.all([
        Clinic.countDocuments({ approved: false }),
        Shop.countDocuments({ approved: false })
      ]).then(([clinics, shops]) => clinics + shops),
    
    ]);

    // Calculate total revenue from both payment types
    const totalRevenue = (clinicPaymentsSum[0]?.total || 0) + (shopPaymentsSum[0]?.total || 0);

    res.json({
      users: usersCount,
      pets: petsCount,
      clinics: clinicsCount,
      shops: shopsCount,
      doctors: doctorsCount,
      revenue: totalRevenue,
      pendingApprovals: pendingApprovalsCount,
      aiModels: 3, // Hardcoded as in your frontend
      alerts: 4
    });
  } catch (error) {
    console.error('Error fetching dashboard counts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

router.get('/recent-payments', adminMiddleware, async (req, res) => {
  try {
    const [clinicPayments, shopPayments] = await Promise.all([
      Payment.find({ status: 'succeeded' })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('vet', 'clinicName'),
      ShopPayment.find({ status: 'completed' })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('shop', 'shopName')
    ]);

    // Combine and format the payments for the frontend
    const formattedPayments = [
      ...clinicPayments.map(p => ({
        _id: p._id,
        type: 'clinic',
        amount: p.adminAmount,
        status: p.status,
        createdAt: p.createdAt,
        name: p.vet?.clinicName || 'Unknown Clinic'
      })),
      ...shopPayments.map(p => ({
        _id: p._id,
        type: 'shop',
        amount: p.adminAmount,
        status: p.status,
        createdAt: p.createdAt,
        name: p.shop?.shopName || 'Unknown Shop'
      }))
    ].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

    res.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent payments'
    });
  }
});


// Get all pet owners
router.get('/pet-owners', adminMiddleware, async (req, res) => {
  try {
    const owners = await User.find({ role: 'pet_owner' })
      .select('fullName email phone city village profileImage createdAt');
    res.json(owners);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pet owners' });
  }
});

// Get pets for a specific owner (both owned and temporary)
router.get('/owner-pets/:ownerId', adminMiddleware, async (req, res) => {
  try {
    const ownedPets = await Pet.countDocuments({ owner_id: req.params.ownerId });
    const temporaryPets = await Pet.countDocuments({ 
      'temporaryCaretaker.userId': req.params.ownerId,
      'temporaryCaretaker.status': 'active'
    });
    
    res.json({
      ownedPets,
      temporaryPets
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching owner pets' });
  }
});

// Suspend owner account
router.put('/suspend-owner/:ownerId', adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.ownerId, { isSuspended: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error suspending owner' });
  }
});

// Delete owner account
router.delete('/delete-owner/:ownerId', adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.ownerId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting owner' });
  }
});

// Get all pets with owner details
router.get('/all-pets', adminMiddleware, async (req, res) => {
  try {
    const pets = await Pet.find()
      .populate('owner_id', 'fullName email')
      .populate('temporaryCaretaker.userId', 'fullName');
    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pets' });
  }
});

// Delete pet
router.delete('/pets/:petId', adminMiddleware, async (req, res) => {
  try {
    await Pet.findByIdAndDelete(req.params.petId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting pet' });
  }
});

// Get pet details with all relationships
router.get('/pets/:petId', adminMiddleware, async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.petId)
      .populate('owner_id', 'fullName email phone')
      .populate('temporaryCaretaker.userId', 'fullName email phone')
      .populate('healthRecords.createdBy', 'fullName')
      .populate('vaccinations.vet', 'fullName')
      .populate('vaccinations.clinic', 'name');
      
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }
    
    res.json(pet);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pet details' });
  }
});



// Get all clinics (vets)
router.get('/clinics', adminMiddleware, async (req, res) => {
  try {
    const clinics = await Clinic.find()
      .select('clinicName fullName email phone city village profileImage isVerified isActive createdAt');
    res.json(clinics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clinics' });
  }
});

// Get clinic details
router.get('/clinics/:clinicId', adminMiddleware, async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.clinicId)
      .populate('doctors', 'name specialty status')
      .populate('payments', 'amount status createdAt');
      
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }
    
    res.json(clinic);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clinic details' });
  }
});

// Suspend clinic
router.put('/suspend-clinic/:clinicId', adminMiddleware, async (req, res) => {
  try {
    await Clinic.findByIdAndUpdate(req.params.clinicId, { isActive: false });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error suspending clinic' });
  }
});

// Delete clinic
router.delete('/delete-clinic/:clinicId', adminMiddleware, async (req, res) => {
  try {
    await Clinic.findByIdAndDelete(req.params.clinicId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting clinic' });
  }
});

// Get all shops
router.get('/shops', adminMiddleware, async (req, res) => {
  try {
    const shops = await Shop.find()
      .select('shopName fullName email phone city village profileImage isActive createdAt');
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shops' });
  }
});

// Get shop details
router.get('/shops/:shopId', adminMiddleware, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.shopId)
      .populate('payments', 'amount status createdAt');
      
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shop details' });
  }
});

// Suspend shop
router.put('/suspend-shop/:shopId', adminMiddleware, async (req, res) => {
  try {
    await Shop.findByIdAndUpdate(req.params.shopId, { isActive: false });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error suspending shop' });
  }
});

// Delete shop
router.delete('/delete-shop/:shopId', adminMiddleware, async (req, res) => {
  try {
    await Shop.findByIdAndDelete(req.params.shopId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting shop' });
  }
});

// Get all doctors
router.get('/doctors', adminMiddleware, async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('clinic', 'clinicName')
      .select('name email phone specialty status profileImage clinic createdAt');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors' });
  }
});

// Get doctor details
router.get('/doctors/:doctorId', adminMiddleware, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId)
      .populate('clinic', 'clinicName fullName email phone');
      
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctor details' });
  }
});

// Suspend doctor
router.put('/suspend-doctor/:doctorId', adminMiddleware, async (req, res) => {
  try {
    await Doctor.findByIdAndUpdate(req.params.doctorId, { status: 'inactive' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error suspending doctor' });
  }
});

// Delete doctor
router.delete('/delete-doctor/:doctorId', adminMiddleware, async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.doctorId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting doctor' });
  }
});


// Get products for a specific shop (admin version)
router.get('/shops/:shopId/products', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = { 
      shopId: req.params.shopId,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ]
    };

    const [products, total] = await Promise.all([
      Product.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .select('name price images category stock createdAt'),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: products,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching shop products',
      error: error.message 
    });
  }
});


// Get all payments with filtering options
router.get('/payments', adminMiddleware, async (req, res) => {
  try {
    const { type, status, startDate, endDate } = req.query;
    
    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const [clinicPayments, shopPayments] = await Promise.all([
      Payment.find({ ...query, status: 'succeeded' })
        .populate('vet', 'clinicName'),
      ShopPayment.find({ ...query, status: 'completed' })
        .populate('shop', 'shopName')
    ]);

    // Combine and format the payments
    const formattedPayments = [
      ...clinicPayments.map(p => ({
        _id: p._id,
        type: 'clinic',
        amount: p.adminAmount,
        status: p.status,
        createdAt: p.createdAt,
        name: p.vet?.clinicName || 'Unknown Clinic'
      })),
      ...shopPayments.map(p => ({
        _id: p._id,
        type: 'shop',
        amount: p.adminAmount,
        status: p.status,
        createdAt: p.createdAt,
        name: p.shop?.shopName || 'Unknown Shop'
      }))
    ];

    res.json(formattedPayments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments'
    });
  }
});

// Get payment statistics
router.get('/payment-stats', adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const [
      clinicPaymentsSum,
      shopPaymentsSum,
      thisMonthClinicPayments,
      thisMonthShopPayments,
      lastMonthClinicPayments,
      lastMonthShopPayments
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: "$adminAmount" } } }
      ]),
      ShopPayment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: "$adminAmount" } } }
      ]),
      Payment.aggregate([
        { 
          $match: { 
            status: 'succeeded',
            createdAt: { $gte: thisMonthStart }
          } 
        },
        { $group: { _id: null, total: { $sum: "$adminAmount" } } }
      ]),
      ShopPayment.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: thisMonthStart }
          } 
        },
        { $group: { _id: null, total: { $sum: "$adminAmount" } } }
      ]),
      Payment.aggregate([
        { 
          $match: { 
            status: 'succeeded',
            createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
          } 
        },
        { $group: { _id: null, total: { $sum: "$adminAmount" } } }
      ]),
      ShopPayment.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
          } 
        },
        { $group: { _id: null, total: { $sum: "$adminAmount" } } }
      ])
    ]);

    const totalRevenue = (clinicPaymentsSum[0]?.total || 0) + (shopPaymentsSum[0]?.total || 0);
    const vetPayments = clinicPaymentsSum[0]?.total || 0;
    const shopPayments = shopPaymentsSum[0]?.total || 0;
    const thisMonth = (thisMonthClinicPayments[0]?.total || 0) + (thisMonthShopPayments[0]?.total || 0);
    const lastMonth = (lastMonthClinicPayments[0]?.total || 0) + (lastMonthShopPayments[0]?.total || 0);

    res.json({
      totalRevenue,
      vetPayments,
      shopPayments,
      thisMonth,
      lastMonth
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment statistics'
    });
  }
});


// Get data for charts
router.get('/payment-chart-data', adminMiddleware, async (req, res) => {
  try {
    // Get data for the last 12 months
    const months = [];
    const vetData = [];
    const shopData = [];
    
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      months.push(`${monthName} ${date.getFullYear()}`);
      
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const [vetSum, shopSum] = await Promise.all([
        Payment.aggregate([
          { 
            $match: { 
              status: 'succeeded',
              createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            } 
          },
          { $group: { _id: null, total: { $sum: "$adminAmount" } } }
        ]),
        ShopPayment.aggregate([
          { 
            $match: { 
              status: 'completed',
              createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            } 
          },
          { $group: { _id: null, total: { $sum: "$adminAmount" } } }
        ])
      ]);
      
      vetData.push(vetSum[0]?.total || 0);
      shopData.push(shopSum[0]?.total || 0);
    }
    
    // Get total by type
    const [typeDistribution] = await Promise.all([
      Promise.all([
        Payment.aggregate([
          { $match: { status: 'succeeded' } },
          { $group: { _id: null, total: { $sum: "$adminAmount" } } }
        ]),
        ShopPayment.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: "$adminAmount" } } }
        ])
      ])
    ]);
    
    // Revenue comparison (this year vs last year)
    const currentYear = new Date().getFullYear();
    const revenueComparison = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      data: []
    };
    
    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date(currentYear, month, 1);
      const endOfMonth = new Date(currentYear, month + 1, 0);
      
      const [monthSum] = await Promise.all([
        Promise.all([
          Payment.aggregate([
            { 
              $match: { 
                status: 'succeeded',
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
              } 
            },
            { $group: { _id: null, total: { $sum: "$adminAmount" } } }
          ]),
          ShopPayment.aggregate([
            { 
              $match: { 
                status: 'completed',
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
              } 
            },
            { $group: { _id: null, total: { $sum: "$adminAmount" } } }
          ])
        ])
      ]);
      
      const total = (monthSum[0][0]?.total || 0) + (monthSum[1][0]?.total || 0);
      revenueComparison.data.push(total);
    }
    
    res.json({
      monthlyTrends: {
        labels: months,
        vetData,
        shopData
      },
      typeDistribution: {
        vet: typeDistribution[0][0]?.total || 0,
        shop: typeDistribution[1][0]?.total || 0
      },
      revenueComparison
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chart data'
    });
  }
});





// Get overall pet statistics
router.get('/pet-stats', adminMiddleware, async (req, res) => {
  try {
    const [
      totalPets,
      petsWithQR,
      petsWithNutrition,
      petsWithAIDetection,
      speciesDistribution,
      adoptionStatus
    ] = await Promise.all([
      Pet.countDocuments(),
      Pet.countDocuments({ qrCodeUrl: { $exists: true, $ne: null } }),
      Pet.countDocuments({ 'nutritionAnalysis.0': { $exists: true } }),
      Pet.aggregate([
        {
          $lookup: {
            from: 'skinconditiondetections',
            localField: '_id',
            foreignField: 'pet_id',
            as: 'detections'
          }
        },
        {
          $match: {
            'detections.0': { $exists: true }
          }
        },
        {
          $count: 'count'
        }
      ]),
      Pet.aggregate([
        {
          $group: {
            _id: '$species',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]),
      Pet.aggregate([
        {
          $group: {
            _id: '$adoption_status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      totalPets,
      petsWithQR: petsWithQR || 0,
      petsWithNutrition: petsWithNutrition || 0,
      petsWithAIDetection: petsWithAIDetection[0]?.count || 0,
      speciesDistribution: speciesDistribution || [],
      adoptionStatus: adoptionStatus || []
    });
  } catch (error) {
    console.error('Error fetching pet stats:', error);
    res.status(500).json({ message: 'Error fetching pet statistics' });
  }
});

// Get health detection analytics
router.get('/health-detections', adminMiddleware, async (req, res) => {
  try {
    const detections = await SkinConditionDetection.aggregate([
      {
        $group: {
          _id: '$prediction',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const confidenceTrend = await SkinConditionDetection.aggregate([
      {
        $project: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
          confidence: 1
        }
      },
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          avgConfidence: { $avg: '$confidence' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      topDetections: detections,
      confidenceTrend
    });
  } catch (error) {
    console.error('Error fetching health detections:', error);
    res.status(500).json({ message: 'Error fetching health detection data' });
  }
});

// Get behavior analysis data
router.get('/behavior-analysis', adminMiddleware, async (req, res) => {
  try {
    const [topBehaviors, behaviorTrends, solutionEffectiveness] = await Promise.all([
      PetBehaviorLog.aggregate([
        {
          $lookup: {
            from: 'behaviorpatterns',
            localField: 'behavior_pattern_id',
            foreignField: '_id',
            as: 'pattern'
          }
        },
        { $unwind: '$pattern' },
        {
          $group: {
            _id: '$pattern.name',
            count: { $sum: 1 },
            avgIntensity: { $avg: '$intensity' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      PetBehaviorLog.aggregate([
        {
          $project: {
            month: { $month: '$date_observed' },
            year: { $year: '$date_observed' }
          }
        },
        {
          $group: {
            _id: { month: '$month', year: '$year' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      PetBehaviorLog.aggregate([
  { $match: { 'solutions_tried.0': { $exists: true } } }, // Ensure at least one solution exists
  { $match: { 'solutions_tried.effectiveness': { $exists: true, $type: 'number' } } },
  { $unwind: '$solutions_tried' },
  { $match: { 'solutions_tried.effectiveness': { $exists: true, $type: 'number' } } },
  {
    $group: {
      _id: '$solutions_tried.solution',
      avgEffectiveness: { $avg: '$solutions_tried.effectiveness' },
      count: { $sum: 1 }
    }
  },
  { $sort: { avgEffectiveness: -1 } },
  { $limit: 5 }
])
    ]);

    res.json({
      topBehaviors,
      behaviorTrends,
      solutionEffectiveness
    });
  } catch (error) {
    console.error('Error fetching behavior analysis:', error);
    res.status(500).json({ message: 'Error fetching behavior analysis data' });
  }
});

// Get pet health records overview
router.get('/health-records', adminMiddleware, async (req, res) => {
  try {
    const records = await Pet.aggregate([
      { $unwind: '$healthRecords' },
      {
        $group: {
          _id: '$healthRecords.type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const vaccinationStatus = await Pet.aggregate([
      {
        $project: {
          // First check if vaccinations exists and is an array
          hasVaccinations: {
            $cond: [
              { 
                $and: [
                  { $isArray: "$vaccinations" },
                  { $gt: [{ $size: "$vaccinations" }, 0] }
                ]
              }, 
              1, 
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          vaccinated: { $sum: '$hasVaccinations' },
          total: { $sum: 1 }
        }
      }
    ]);

    res.json({
      recordTypes: records,
      vaccinationStatus: vaccinationStatus[0] || { vaccinated: 0, total: 0 }
    });
  } catch (error) {
    console.error('Error fetching health records:', error);
    res.status(500).json({ message: 'Error fetching health records data' });
  }
});



// Weather API configuration
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Get current weather alerts
router.get('/weather-alerts', adminMiddleware, async (req, res) => {
  try {
    const alerts = await TemperatureAlert.find()
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching weather alerts' });
  }
});

// Create a new weather alert
router.post('/weather-alerts', adminMiddleware, async (req, res) => {
  try {
    const { thresholdType, temperature, severity, affectedSpecies, regions, message, durationHours } = req.body;
    
    const endTime = durationHours ? 
      new Date(Date.now() + durationHours * 60 * 60 * 1000) : 
      null;

    const alert = new TemperatureAlert({
      thresholdType,
      temperature,
      severity,
      affectedSpecies,
      regions,
      message,
      endTime,
      createdBy: req.admin._id
    });

    await alert.save();

    // Notify affected users using the helper function
    const wss = req.app.get('wss');
   await notifyAffectedUsers(alert, wss);


    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error creating weather alert' });
  }
});

// Update a weather alert
router.put('/weather-alerts/:alertId', adminMiddleware, async (req, res) => {
  try {
    const alert = await TemperatureAlert.findByIdAndUpdate(
      req.params.alertId,
      req.body,
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error updating weather alert' });
  }
});

// Delete a weather alert
router.delete('/weather-alerts/:alertId', adminMiddleware, async (req, res) => {
  try {
    await TemperatureAlert.findByIdAndDelete(req.params.alertId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting weather alert' });
  }
});

// Check weather for alerts (cron job endpoint)
router.get('/check-weather', adminMiddleware, async (req, res) => {
  try {
    // This would typically be called by a cron job, not directly
    const citiesToMonitor = ['Gaza', 'Ramallah', 'Hebron', 'Nablus', 'Jenin'];
    
    const weatherChecks = await Promise.all(
      citiesToMonitor.map(async (city) => {
        try {
          const response = await axios.get(WEATHER_API_URL, {
            params: {
              q: city,
              appid: WEATHER_API_KEY,
              units: 'metric'
            }
          });
          
          return {
            city,
            temp: response.data.main.temp,
            conditions: response.data.weather[0].main
          };
        } catch (error) {
          console.error(`Error fetching weather for ${city}:`, error.message);
          return null;
        }
      })
    );

    const validChecks = weatherChecks.filter(check => check !== null);
    
    // Check against thresholds and create alerts if needed
    const highTempThreshold = 30; // Example threshold
    const lowTempThreshold = 5;   // Example threshold
    
    const alertsCreated = [];
    
    for (const check of validChecks) {
      if (check.temp >= highTempThreshold) {
        const alert = new TemperatureAlert({
          thresholdType: 'high',
          temperature: check.temp,
          severity: check.temp > 35 ? 'extreme' : check.temp > 30 ? 'danger' : 'warning',
          affectedSpecies: ['dog', 'cat'], // Default affected species
          regions: [check.city],
          message: `High temperature warning for ${check.city}: ${check.temp}°C`,
          createdBy: req.admin._id
        });
        
        await alert.save();
        await notifyAffectedUsers(alert);
        alertsCreated.push(alert);
      }
      
      if (check.temp <= lowTempThreshold) {
        const alert = new TemperatureAlert({
          thresholdType: 'low',
          temperature: check.temp,
          severity: check.temp < 0 ? 'extreme' : check.temp < 5 ? 'danger' : 'warning',
          affectedSpecies: ['dog', 'cat'], // Default affected species
          regions: [check.city],
          message: `Low temperature warning for ${check.city}: ${check.temp}°C`,
          createdBy: req.admin._id
        });
        
        await alert.save();
        await notifyAffectedUsers(alert);
        alertsCreated.push(alert);
      }
    }

    res.json({
      weatherChecks: validChecks,
      alertsCreated
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking weather' });
  }
});



// Get all disease alerts
router.get('/disease-alert', adminMiddleware, async (req, res) => {
  try {
    const alerts = await DiseaseAlert.find()
      .sort({ isActive: -1, severity: -1, createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching disease alerts' });
  }
});

// Get disease alert statistics
router.get('/disease-alert-stats', adminMiddleware, async (req, res) => {
  try {
    // Monthly counts
    const monthlyCounts = await DiseaseAlert.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Top diseases
    const topDiseases = await DiseaseAlert.aggregate([
      {
        $group: {
          _id: "$disease",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Species distribution
    const speciesDistribution = await DiseaseAlert.aggregate([
      {
        $group: {
          _id: "$species",
          count: { $sum: 1 }
        }
      }
    ]);

    // Regional distribution
    const regionalDistribution = await DiseaseAlert.aggregate([
      { $unwind: "$regions" },
      {
        $group: {
          _id: {
            city: "$regions.city",
            village: "$regions.village"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      monthlyCounts,
      topDiseases,
      speciesDistribution,
      regionalDistribution
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Update alert status
router.put('/disease-alert/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { isActive } = req.body;
    const alert = await DiseaseAlert.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error updating alert status' });
  }
});

// Add manual disease alert
router.post('/disease-alert', adminMiddleware, async (req, res) => {
  try {
    const { disease, species, regions, severity, message, recommendations } = req.body;
    
    const alert = new DiseaseAlert({
      disease,
      species,
      regions,
      severity,
      message,
      recommendations,
      caseCount: 0,
      confidenceThreshold: 0,
      isActive: true,
      createdBy: req.admin._id
    });

    await alert.save();

    // Notify affected users
    const wss = req.app.get('wss');
    await notifyDiseaseAlert(alert, wss);

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error creating disease alert' });
  }
});


router.get('/disease/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.userId,
      type: 'disease-alert',
      read: false
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count' });
  }
});

// In your weather alerts routes
router.get('/weather/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.userId,
      type: 'weather-alert',
      read: false
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count' });
  }
});


// Get single alert details
router.get('/disease-alert/:id', adminMiddleware, async (req, res) => {
  try {
    const alert = await DiseaseAlert.findById(req.params.id)
      .populate('triggeredByCases', 'pet_id prediction confidence createdAt')
      .populate({
        path: 'triggeredByCases',
        populate: {
          path: 'pet_id',
          select: 'name species owner_id',
          populate: {
            path: 'owner_id',
            select: 'city village'
          }
        }
      });

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alert details' });
  }
});

// Update entire alert (not just status)
router.put('/disease-alert/:id', adminMiddleware, async (req, res) => {
  try {
    const { disease, species, regions, severity, message, recommendations, isActive } = req.body;
    
    const alert = await DiseaseAlert.findByIdAndUpdate(
      req.params.id,
      { 
        disease,
        species,
        regions,
        severity,
        message,
        recommendations,
        isActive
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // If activating an alert, notify users
    if (isActive) {
      const wss = req.app.get('wss');
      await notifyDiseaseAlert(alert, wss);
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error updating alert' });
  }
});

// Delete an alert
router.delete('/disease-alert/:id', adminMiddleware, async (req, res) => {
  try {
    const alert = await DiseaseAlert.findByIdAndDelete(req.params.id);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Clean up related notifications and user alerts
    await Notification.deleteMany({ 
      type: 'disease-alert', 
      link: `/disease-alerts/${req.params.id}` 
    });
    
    await UserAlert.deleteMany({ 
      alertId: req.params.id,
      alertModel: 'DiseaseAlert'
    });

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting alert' });
  }
});

// Get cases that triggered an alert
router.get('/disease-alert/:id/cases', adminMiddleware, async (req, res) => {
  try {
    const alert = await DiseaseAlert.findById(req.params.id)
      .select('triggeredByCases')
      .populate({
        path: 'triggeredByCases',
        select: 'pet_id prediction confidence createdAt image_url',
        populate: {
          path: 'pet_id',
          select: 'name species owner_id',
          populate: {
            path: 'owner_id',
            select: 'fullName city village'
          }
        }
      });

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json(alert.triggeredByCases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cases' });
  }
});

// Get affected users for an alert
router.get('/disease-alert/:id/affected-users', adminMiddleware, async (req, res) => {
  try {
    const alert = await DiseaseAlert.findById(req.params.id).select('regions species');
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    const users = await User.find({
      $or: alert.regions.map(region => ({
        $and: [
          { city: region.city || { $exists: true } },
          { village: region.village || { $exists: true } }
        ]
      }))
    }).select('fullName email phone city village');

    const pets = await Pet.find({
      owner_id: { $in: users.map(u => u._id) },
      species: alert.species
    }).select('name species owner_id');

    const affectedUsers = users.map(user => {
      const userPets = pets.filter(pet => pet.owner_id.toString() === user._id.toString());
      return {
        ...user.toObject(),
        pets: userPets
      };
    });

    res.json(affectedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching affected users' });
  }
});




const notifyDiseaseAlert = async (alert, wss) => {
  try {
    // Go through each region in the alert
    for (const region of alert.regions) {
      console.log(`🌐 Processing alert for region: ${region.city}, ${region.village || 'No village'}`);

      // 1. Find ALL users in the same city (regardless of village)
      const userQuery = {
        city: region.city
      };
      
      // Only add village filter if it exists in the region
      if (region.village) {
        userQuery.$or = [
          { village: region.village },
          { village: { $in: [null, ''] } }
        ];
      }

      const users = await User.find(userQuery).select('_id city village');

      if (users.length === 0) {
        console.log(`⚠️ No users found in ${region.city}, ${region.village}`);
        continue;
      }

      // 2. Get ALL pets of the correct species owned by these users
      const userIds = users.map(u => u._id);
      const affectedPets = await Pet.find({
        owner_id: { $in: userIds },
        species: alert.species
      }).populate('owner_id');

      if (affectedPets.length === 0) {
        console.log(`⚠️ No ${alert.species} pets found in ${region.city}`);
        continue;
      }

      console.log(`✅ Found ${affectedPets.length} ${alert.species} pets in ${region.city}`);

      // 3. Notify each pet's owner (deduplicate owners)
      const notifiedOwners = new Set();
      
      for (const pet of affectedPets) {
        if (!pet || !pet.owner_id || notifiedOwners.has(pet.owner_id._id.toString())) {
          continue;
        }

        notifiedOwners.add(pet.owner_id._id.toString());
        
        const message = `⚠️ Disease Alert in ${region.city}${region.village ? ' - ' + region.village : ''}: ${alert.disease} may affect ${alert.species} in your area.`;
        const link = `/alerts/${alert._id}`;

        // Create UserAlert record first
        const userAlert = new UserAlert({
          userId: pet.owner_id._id,
          petId: pet._id,
          alertId: alert._id,
          alertModel: 'DiseaseAlert',
          read: false
        });
        await userAlert.save();
        console.log(`📌 Created UserAlert record for user ${pet.owner_id._id}`);

        // Save notification to DB
        await notificationController.createNotification(
          pet.owner_id._id,
          message,
          link,
          'disease-alert',
          wss,
          alert.severity,
          pet._id,
          alert._id
        );

        // Send via WebSocket
        const activeConnections = global.activeConnections || {};
        const targetWs = activeConnections[pet.owner_id._id.toString()];
        
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          try {
            targetWs.send(JSON.stringify({
              type: 'disease-alert',
              message,
              link,
              severity: alert.severity,
              petId: pet._id,
              alertId: alert._id,
              createdAt: new Date(),
              userAlertId: userAlert._id // Include the UserAlert ID in the WS message
            }));
            console.log(`✅ WS sent to user ${pet.owner_id._id}`);
          } catch (err) {
            console.error(`❌ WS send failed to user ${pet.owner_id._id}:`, err);
          }
        } else {
          console.log(`ℹ️ User ${pet.owner_id._id} not connected via WS`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error in notifyDiseaseAlert:', error);
    throw error; // Re-throw to allow higher level handling
  }
};





// Helper function to notify affected users
const notifyAffectedUsers = async (alert, wss) => {
  for (const city of alert.regions) {
    const users = await User.find({ city }).select('_id city village');
    const userIds = users.map(u => u._id);

    const pets = await Pet.find({
      owner_id: { $in: userIds },
      species: { $in: alert.affectedSpecies }
    }).populate('owner_id');

    const notifiedOwners = new Set();

    for (const pet of pets) {
      const owner = pet.owner_id;
      if (!owner || notifiedOwners.has(owner._id.toString())) continue;

      notifiedOwners.add(owner._id.toString());

      const message = `🌡️ Weather Alert in ${city}: ${alert.message}`;
      const link = `/alerts/${alert._id}`;


       // Create UserAlert record first
        const userAlert = new UserAlert({
          userId: pet.owner_id._id,
          petId: pet._id,
          alertId: alert._id,
          alertModel: 'TemperatureAlert',
          read: false
        });
        await userAlert.save();
        console.log(`📌 Created UserAlert record for user ${pet.owner_id._id}`);


      // Save DB notification
      await notificationController.createNotification(
        owner._id,
        message,
        link,
        'weather-alert',
        wss,
        alert.severity,
        pet._id,
        alert._id
      );

      // WebSocket notification
      const activeConnections = global.activeConnections || {};
      const targetWs = activeConnections[owner._id.toString()];

      if (targetWs && targetWs.readyState === WebSocket.OPEN) {
        try {
          targetWs.send(JSON.stringify({
            type: 'weather-alert',
            message,
            link,
            severity: alert.severity,
            petId: pet._id,
            alertId: alert._id,
            createdAt: new Date()
          }));
        } catch (err) {
          console.error(`❌ WS send failed to user ${owner._id}:`, err);
        }
      }
    }
  }
};



module.exports = router;