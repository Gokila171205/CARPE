const express = require('express');
const router = express.Router();
const { getLocations, createLocation, getLocationById } = require('../controllers/locationController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getLocations)
  .post(protect, createLocation);

router.route('/:id')
  .get(protect, getLocationById);

module.exports = router;
