const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connection = require('./config/db'); 
const authRoutes = require('./routes/auth'); 
const ownerRoutes = require('./routes/owner'); 
const petRoutes = require('./routes/pet'); 
const commuRoutes = require('./routes/community'); 
const http = require("http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const path = require('path');
const fs = require('fs'); // Add this missing import
const { scheduleFeedingReminders, checkSkippedMeals ,sendFeedingReminder} = require('./utils/feedingReminderScheduler');
const app = express();
const notificationRoutes = require('./routes/notification');
const adoptionRequestRoutes = require('./routes/adoptionRequestRoutes');
const petFeedingRoutes = require('./routes/petFeedingRoutes');
const { setupDailyExpirationChecker } = require('./utils/adoptionExpiryChecker');
const adminRoutes = require('./routes/admin');
const SubscriptionRoutes = require('./routes/subscriptionRoutes');
const PaymentRoutes = require('./routes/payments');
const VetRoutes = require('./routes/vet');
const DoctorRoutes = require('./routes/doctor');
const { router: AppointmentRoutes, setupAppointmentReminders } = require('./routes/appointment');
const healthRecordsRouter = require('./routes/healthRecords');
const vaccinationRoutes = require('./routes/vaccinations');
const skinDetectionRoutes = require('./routes/skinDetection');
const vetTemporaryCareRoutes = require('./routes/vetTemporaryCare');
const postAdoptionOptionsRoutes = require('./routes/postAdoptionOptions');
const behaviorAnalysisRoutes = require('./routes/behaviorAnalysis');
const shopRoutes = require('./routes/shop');
const productRoutes = require('./routes/productRoutes');
const couponRoutes = require('./routes/coupon');
const orderRoutes = require('./routes/orders');
const shopPaymentRout = require('./routes/shopPayment');
const Chat = require('./models/Chat');
const chatRoutes = require('./routes/chat');
const activeConnections = {};
const shopPaymentRoutes = require('./routes/shopSubscriptio');
const AdminLibraryRoutes = require('./routes/adminLibrary');
const OwnerLibraryRoutes = require('./routes/library');
const DiseaseAlertsRoutes = require('./routes/diseaseAlerts');
const cron = require('node-cron');
const { checkWeatherAndCreateAlerts } = require('./utils/weatherCron');
const EventRoutes = require('./routes/eventRoutes');
const travelGuideRouter = require('./routes/travelGuide');



app.use(cors({
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE,PATCH,OPTIONS", // Add OPTIONS
  allowedHeaders: "Content-Type,Authorization,X-Requested-With",
  credentials: true,
  preflightContinue: false // Important for preflight requests
}));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server }); // Create WebSocket server


// Handle WebSocket connections
const onlineUsers = new Set(); // Track online users globally

wss.on('connection', (ws, req) => {
  // Handle authentication
  const token = req.url.split('token=')[1];
 
   if (!token) {
    ws.close(1008, 'Authentication token required'); // Policy Violation
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    
    // Store user information on the WebSocket connection
    ws.userId = decoded.userId;
    ws.userRole = decoded.role;
    
    // Store active connection for both notifications and chat
    activeConnections[decoded.userId] = ws;
    onlineUsers.add(decoded.userId);
    
    console.log(`User ${decoded.userId} (${decoded.role}) connected.`);
    
    // Broadcast user is online to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.userId !== decoded.userId) {
        client.send(JSON.stringify({
          type: 'user-connected',
          userId: decoded.userId
        }));
      }
    });

    // Send initial online status to the connecting client
    ws.send(JSON.stringify({
      type: 'online-users',
      users: Array.from(onlineUsers)
    }));

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Send specific error code to client
      ws.close(4001, 'Token expired - please refresh'); // Custom close code
    } else {
      // Other JWT errors (invalid signature, etc.)
      ws.close(1008, 'Invalid token'); // Policy Violation
    }
    return;
  }


  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data.type);
      
      // Handle different message types
      switch (data.type) {
        case 'chat-message':
          await handleChatMessage(ws, data);
          break;
          
        case 'typing':
          handleTypingNotification(ws, data);
          break;
          
        case 'check-online':
          handleOnlineCheck(ws, data);
          break;
          
        case 'mark-messages-read':
          handleMarkMessagesRead(ws, data);
          break;
          
        case 'get-unread-count':
          handleGetUnreadCount(ws);
          break;
          
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  // Handle connection close
  ws.on('close', () => {
    if (ws.userId) {
      // Remove from active connections
      delete activeConnections[ws.userId];
      onlineUsers.delete(ws.userId);
      
      console.log(`User ${ws.userId} disconnected.`);
      
      // Broadcast user is offline
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'user-disconnected',
            userId: ws.userId
          }));
        }
      });
    }
  });
});

// Helper functions for message handling
async function handleChatMessage(ws, data) {
  const { chatId, content } = data;
  
  const chat = await Chat.findById(chatId)
    .populate('participants.id', 'name clinicName shopName fullName profileImage')
    .populate('messages.senderId', 'name clinicName shopName fullName profileImage');
  
  if (!chat) {
    console.error('Chat not found:', chatId);
    return;
  }

  const senderModel = ws.userRole === 'vet' ? 'Clinic' : 
                    ws.userRole === 'shop' ? 'Shop' : 
                    ws.userRole === 'doctor' ? 'Doctor' : 
                    ws.userRole === 'admin' ? 'Admin' : 'User';

  const newMessage = {
    senderId: ws.userId,
    senderModel,
    content,
    read: false,
    timestamp: new Date()
  };

  chat.messages.push(newMessage);
  chat.lastMessageAt = new Date();
  await chat.save();

  // Find the sender's name for the notification
  const sender = chat.participants.find(p => p.id._id.toString() === ws.userId.toString());
  const senderName = sender?.id?.clinicName || sender?.id?.shopName || sender?.id?.name || sender?.id?.fullName || 'Unknown';

  // Notify other participants
  for (const participant of chat.participants) {
    if (participant.id._id.toString() !== ws.userId.toString()) {
      const connection = activeConnections[participant.id._id.toString()];
      
      if (connection && connection.readyState === WebSocket.OPEN) {
        // Send notification
        connection.send(JSON.stringify({
          type: 'new-message-notification',
          chatId,
          senderId: ws.userId,
          userId: senderName,
          content,
          timestamp: new Date()
        }));

        // Send the actual message
        connection.send(JSON.stringify({
          type: 'new-message',
          chatId,
          message: {
            ...newMessage,
            _id: newMessage._id || new mongoose.Types.ObjectId(),
            senderId: {
              _id: ws.userId,
              name: senderName,
              profileImage: sender?.id?.profileImage
            }
          }
        }));
      }
    }
  }
}

function handleTypingNotification(ws, data) {
  const { chatId, isTyping } = data;
  
  // Broadcast typing indicator to other chat participants
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && 
        client.userId !== ws.userId && 
        client.chatId === chatId) {
      client.send(JSON.stringify({
        type: 'typing',
        chatId,
        userId: ws.userId,
        isTyping
      }));
    }
  });
}

function handleOnlineCheck(ws, data) {
  const { userId } = data;
  ws.send(JSON.stringify({
    type: 'online-status',
    userId,
    isOnline: onlineUsers.has(userId)
  }));
}

async function handleMarkMessagesRead(ws, data) {
  const { chatId } = data;
  
  try {
    await Chat.updateMany(
      { 
        _id: chatId,
        'messages.senderId': { $ne: ws.userId },
        'messages.read': false
      },
      { $set: { 'messages.$[].read': true } }
    );
    
    // Notify other participants that messages were read
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.userId !== ws.userId) {
        client.send(JSON.stringify({
          type: 'messages-read',
          chatId,
          readerId: ws.userId
        }));
      }
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

async function handleGetUnreadCount(ws) {
  try {
    // Ensure we have a valid user ID
    if (!ws.userId || !mongoose.Types.ObjectId.isValid(ws.userId)) {
      console.error('Invalid user ID for unread count');
      return;
    }

    const chats = await Chat.find({
      'participants.id': mongoose.Types.ObjectId(ws.userId)
    });
    
    let totalUnread = 0;
    chats.forEach(chat => {
      chat.messages.forEach(msg => {
        if (!msg.read && msg.senderId.toString() !== ws.userId.toString()) {
          totalUnread++;
        }
      });
    });
    
    ws.send(JSON.stringify({
      type: 'unread-count',
      count: totalUnread
    }));
  } catch (error) {
    console.error('Error getting unread count:', error);
  }
}
// Function to send a notification to a specific user
const sendNotification = (userId, message) => {
  wss.clients.forEach((client) => {
    if (client.userId === userId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'notification', message }));
    }
  });
};

// Attach sendNotification to the app object
app.set('sendNotification', sendNotification);



scheduleFeedingReminders(wss);
setupDailyExpirationChecker();
setupAppointmentReminders(wss);

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running weather check cron job...');
  await checkWeatherAndCreateAlerts();
});

// Middleware
app.use(express.json({ limit: "50mb" })); // Increase JSON body size limit
app.use(express.urlencoded({ limit: "50mb", extended: true })); // Increase form data size



// In server.js, update your uploadDirs to include the temp directory
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/clinic-licenses'),
  path.join(__dirname, 'uploads/license-temp') // Add this line
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});



// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    // Set proper content-type for video files
    if (path.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
    } else if (path.endsWith('.webm')) {
      res.set('Content-Type', 'video/webm');
    }
    res.set('Accept-Ranges', 'bytes');
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));

// Move this before route definitions
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});


app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', ownerRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/community', commuRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/adoption', adoptionRequestRoutes);
app.use('/api/feeding', petFeedingRoutes);
app.use('/api/subscriptions', SubscriptionRoutes);
app.use('/api/payment', PaymentRoutes);
app.use('/api/vet', VetRoutes);
app.use('/api/doctor', DoctorRoutes);
app.use('/api/appointment', AppointmentRoutes);
app.use('/api/health-records', healthRecordsRouter);
app.use('/api/clinic/vaccinations', vaccinationRoutes);
app.use('/api/skin', skinDetectionRoutes);
app.use('/api/vet-temporary-care', vetTemporaryCareRoutes);
app.use('/api/post-adoption', postAdoptionOptionsRoutes);
app.use('/api/behavioral-analysis', behaviorAnalysisRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/product', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupon', couponRoutes);
app.use('/api/shop-payment', shopPaymentRout);
app.use('/api/chat', chatRoutes);
app.use('/api/shop-payment', shopPaymentRoutes);
app.use('/api/admin/library', AdminLibraryRoutes);
app.use('/api/library', OwnerLibraryRoutes);
app.use('/api/disease-alerts', DiseaseAlertsRoutes);
app.use('/api/event', EventRoutes);
app.use('/api/travel-guide', travelGuideRouter);





// Example route to trigger a notification
app.post("/notify", (req, res) => {
  const { userId, message } = req.body;
  sendNotification(userId, message);
  res.status(200).json({ message: "Notification sent successfully." });
});

app.set('wss', wss);

// Start the combined HTTP and WebSocket server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
});

module.exports = { server, wss };