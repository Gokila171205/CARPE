const express = require('express');
const router = express.Router();
const { getAlerts, resolveAlert } = require('../controllers/alertsController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getAlerts);
router.put('/:id/resolve', protect, resolveAlert);

module.exports = router;
