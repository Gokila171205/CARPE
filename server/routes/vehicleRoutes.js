const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleCollections,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getVehicles)
  .post(protect, createVehicle);

router.route('/:id/collections')
  .get(protect, getVehicleCollections);

router.route('/:id')
  .put(protect, updateVehicle)
  .delete(protect, deleteVehicle);

module.exports = router;
