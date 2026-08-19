const express = require('express');
const router = express.Router();
const { getInsights } = require('../controllers/aiInsightController');
const { protect } = require('../middleware/auth');

router.post('/insights', protect, getInsights);
router.get('/insights', protect, getInsights);

module.exports = router;
