const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/assistantController');
const { protect } = require('../middleware/auth');

// Protected route: requires authenticated JWT token
router.post('/chat', protect, handleChat);

module.exports = router;
