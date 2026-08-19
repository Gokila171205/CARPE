const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const WasteRecord = require('../models/WasteRecord');

// @desc    Get all vehicles (master records + vehicles detected in collections) with live collection statistics
// @route   GET /api/vehicles
const getVehicles = async (req, res) => {
  try {
    // 1. Fetch registered master vehicles
    const masterVehicles = await Vehicle.find().lean();
    const registeredNumbers = new Set(masterVehicles.map((v) => v.vehicleNumber));

    // 2. Aggregate collection activity across all WasteRecords by vehicle identifier
    const vehicleStats = await WasteRecord.aggregate([
      {
        $match: {
          vehicle: { $exists: true, $nin: ['', null] }
        }
      },
      {
        $group: {
          _id: '$vehicle',
          totalCollections: { $sum: 1 },
          totalWaste: { $sum: '$quantity' },
          locationsCovered: { $addToSet: '$location' },
          wasteTypes: { $addToSet: '$wasteType' },
          lastCollectionDate: { $max: '$collectedAt' }
        }
      },
      {
        $sort: { totalWaste: -1 }
      }
    ]);

    const statsMap = {};
    vehicleStats.forEach((s) => {
      if (s._id) {
        statsMap[s._id] = s;
      }
    });

    // 3. Enrich master vehicles with calculated stats
    const enrichedList = masterVehicles.map((v) => {
      const stats = statsMap[v.vehicleNumber] || {};
      const totalCollections = stats.totalCollections || 0;
      const totalWaste = stats.totalWaste || 0;
      const avgWaste = totalCollections > 0 ? Math.round((totalWaste / totalCollections) * 10) / 10 : 0;

      return {
        ...v,
        totalCollections,
        totalWaste,
        averageWaste: avgWaste,
        locationsCount: stats.locationsCovered ? stats.locationsCovered.length : 0,
        locationsCovered: stats.locationsCovered || [],
        wasteTypes: stats.wasteTypes || [],
        lastCollectionDate: stats.lastCollectionDate || null,
        isMasterRecord: true
      };
    });

    // 4. Include vehicles found in collection records that are not yet in Vehicle master
    vehicleStats.forEach((s) => {
      const vehicleNum = s._id;
      if (!registeredNumbers.has(vehicleNum)) {
        const totalCollections = s.totalCollections || 0;
        const totalWaste = s.totalWaste || 0;
        const avgWaste = totalCollections > 0 ? Math.round((totalWaste / totalCollections) * 10) / 10 : 0;

        enrichedList.push({
          _id: vehicleNum, // Identifier string for routing
          vehicleNumber: vehicleNum,
          vehicleType: 'Collection Vehicle',
          capacity: 2000,
          status: 'Active',
          assignedArea: s.locationsCovered?.[0] || 'Municipal Area',
          totalCollections,
          totalWaste,
          averageWaste: avgWaste,
          locationsCount: s.locationsCovered ? s.locationsCovered.length : 0,
          locationsCovered: s.locationsCovered || [],
          wasteTypes: s.wasteTypes || [],
          lastCollectionDate: s.lastCollectionDate || null,
          isMasterRecord: false
        });
      }
    });

    res.json(enrichedList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get individual vehicle with detailed collection history logs
// @route   GET /api/vehicles/:id/collections
const getVehicleCollections = async (req, res) => {
  try {
    const { id } = req.params;
    let vehicleNumber = id;
    let masterVehicle = null;

    // Check if ID is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      masterVehicle = await Vehicle.findById(id).lean();
      if (masterVehicle) {
        vehicleNumber = masterVehicle.vehicleNumber;
      }
    } else {
      masterVehicle = await Vehicle.findOne({ vehicleNumber: id }).lean();
    }

    const collections = await WasteRecord.find({ vehicle: vehicleNumber })
      .sort({ collectedAt: -1 })
      .limit(100)
      .lean();

    const totalWaste = collections.reduce((acc, c) => acc + (c.quantity || 0), 0);
    const uniqueLocations = [...new Set(collections.map((c) => c.location).filter(Boolean))];
    const uniqueWasteTypes = [...new Set(collections.map((c) => c.wasteType).filter(Boolean))];

    const vehicleInfo = masterVehicle || {
      _id: vehicleNumber,
      vehicleNumber,
      vehicleType: 'Collection Vehicle',
      capacity: 2000,
      status: collections.length > 0 ? 'Active' : 'Unregistered',
      assignedArea: uniqueLocations[0] || 'Unassigned',
      isMasterRecord: false
    };

    res.json({
      vehicle: {
        ...vehicleInfo,
        totalCollections: collections.length,
        totalWaste,
        locationsCovered: uniqueLocations,
        wasteTypes: uniqueWasteTypes
      },
      collections
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new vehicle
// @route   POST /api/vehicles
const createVehicle = async (req, res) => {
  try {
    const vehicle = new Vehicle(req.body);
    const createdVehicle = await vehicle.save();
    res.status(201).json(createdVehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update an existing vehicle
// @route   PUT /api/vehicles/:id
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (vehicle) {
      Object.assign(vehicle, req.body);
      const updatedVehicle = await vehicle.save();
      res.json(updatedVehicle);
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
const deleteVehicle = async (req, res) => {
  try {
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      const vehicle = await Vehicle.findById(req.params.id);
      if (vehicle) {
        await Vehicle.deleteOne({ _id: req.params.id });
        return res.json({ message: 'Vehicle removed' });
      }
    }
    res.status(404).json({ message: 'Vehicle not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVehicles,
  getVehicleCollections,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
