const express = require('express');
const router = express.Router();
const {
  getWasteRecords,
  getWasteRecordById,
  createWasteRecord,
  updateWasteRecord,
  deleteWasteRecord,
} = require('../controllers/wasteController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getWasteRecords)
  .post(protect, createWasteRecord);

router.route('/:id')
  .get(protect, getWasteRecordById)
  .put(protect, updateWasteRecord)
  .delete(protect, deleteWasteRecord);

module.exports = router;
