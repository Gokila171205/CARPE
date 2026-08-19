const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String, // 'HIGH_WASTE', 'CAPACITY', 'ANOMALY'
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM',
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'RESOLVED'],
    default: 'ACTIVE',
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
