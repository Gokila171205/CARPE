const mongoose = require('mongoose');

const wasteRecordSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
  },
  wasteType: {
    type: String,
    enum: ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Other'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  vehicle: {
    type: String,
    required: true,
  },
  collector: {
    type: String,
    required: true,
  },
  collectedAt: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('WasteRecord', wasteRecordSchema);
