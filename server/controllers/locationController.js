const Location = require('../models/Location');
const WasteRecord = require('../models/WasteRecord');

// @desc    Get all unique locations derived from Master Locations + Waste Collection Records
// @route   GET /api/locations
const getLocations = async (req, res) => {
  try {
    // 1. Fetch registered master locations
    const masterLocations = await Location.find().lean();

    // 2. Fetch distinct location names directly from collection records
    const collectionLocations = await WasteRecord.distinct('location');

    // 3. Merge, normalize whitespace/case, and deduplicate
    const locationMap = new Map();

    // Add master locations first (retaining coordinates and areaType)
    masterLocations.forEach((loc) => {
      if (loc && loc.name && loc.name.trim()) {
        const cleanName = loc.name.trim();
        const key = cleanName.toLowerCase();
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            _id: loc._id,
            name: cleanName,
            latitude: loc.latitude || null,
            longitude: loc.longitude || null,
            areaType: loc.areaType || 'Residential',
            isMaster: true
          });
        }
      }
    });

    // Add locations found in waste collection records that are not in master
    collectionLocations.forEach((locName) => {
      if (locName && typeof locName === 'string' && locName.trim()) {
        const cleanName = locName.trim();
        const key = cleanName.toLowerCase();
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            _id: cleanName,
            name: cleanName,
            latitude: null,
            longitude: null,
            areaType: 'Municipal Area',
            isMaster: false
          });
        }
      }
    });

    // Sort alphabetically
    const uniqueLocations = Array.from(locationMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    res.json(uniqueLocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new location
// @route   POST /api/locations
const createLocation = async (req, res) => {
  try {
    const location = new Location(req.body);
    const createdLocation = await location.save();
    res.status(201).json(createdLocation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get location by ID
// @route   GET /api/locations/:id
const getLocationById = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (location) {
      res.json(location);
    } else {
      res.status(404).json({ message: 'Location not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLocations, createLocation, getLocationById };
