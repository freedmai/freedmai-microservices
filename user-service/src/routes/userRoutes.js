const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', userController.registerUser);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, userController.getUserProfile);
router.put('/profile', authenticateToken, userController.updateUserProfile);
router.put('/step', authenticateToken, userController.updateStep);
router.put('/status', authenticateToken, userController.updateStatus);

// Admin routes
router.get('/', authenticateToken, userController.getAllUsers);
router.get('/:id', authenticateToken, userController.getUserById);

module.exports = router;
