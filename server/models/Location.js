const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  areaType: {
    type: String,
    enum: ['Residential', 'Commercial', 'Industrial', 'Mixed'],
    default: 'Residential',
  }
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
