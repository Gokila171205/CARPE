const WasteRecord = require('../models/WasteRecord');
const { resolveAndCacheLocation } = require('../services/geocodingService');

// @desc    Get all waste records
// @route   GET /api/waste
const getWasteRecords = async (req, res) => {
  try {
    const records = await WasteRecord.find().sort({ collectedAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single waste record
// @route   GET /api/waste/:id
const getWasteRecordById = async (req, res) => {
  try {
    const record = await WasteRecord.findById(req.params.id);
    if (record) {
      res.json(record);
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create waste record & trigger non-blocking location geocoding
// @route   POST /api/waste
const createWasteRecord = async (req, res) => {
  try {
    const record = new WasteRecord(req.body);
    const createdRecord = await record.save();

    // Trigger non-blocking automatic location geocoding & caching in MongoDB
    if (createdRecord.location && typeof createdRecord.location === 'string') {
      resolveAndCacheLocation(createdRecord.location).catch((err) => {
        console.warn('Background geocoding non-fatal warning:', err.message);
      });
    }

    res.status(201).json(createdRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update waste record
// @route   PUT /api/waste/:id
const updateWasteRecord = async (req, res) => {
  try {
    const record = await WasteRecord.findById(req.params.id);
    if (record) {
      Object.assign(record, req.body);
      const updatedRecord = await record.save();

      if (updatedRecord.location && typeof updatedRecord.location === 'string') {
        resolveAndCacheLocation(updatedRecord.location).catch(() => {});
      }

      res.json(updatedRecord);
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete waste record
// @route   DELETE /api/waste/:id
const deleteWasteRecord = async (req, res) => {
  try {
    const record = await WasteRecord.findById(req.params.id);
    if (record) {
      await WasteRecord.deleteOne({ _id: req.params.id });
      res.json({ message: 'Record removed' });
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWasteRecords,
  getWasteRecordById,
  createWasteRecord,
  updateWasteRecord,
  deleteWasteRecord,
};
