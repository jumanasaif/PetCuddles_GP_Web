const express = require('express');
const userController = require('../controllers/ownerProfileController'); 
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();


router.put("/UpdateOwnerProfile", userController.updateOwnerProfile);
router.get("/users/me", authMiddleware, userController.getUserProfile);
module.exports = router;

