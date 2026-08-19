const mongoose = require('mongoose');
const dotenv = require('dotenv');
const WasteRecord = require('./models/WasteRecord');
const Location = require('./models/Location');
const Vehicle = require('./models/Vehicle');
const Alert = require('./models/Alert');

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('Failed to connect: MONGO_URI is not defined in .env');
      process.exit(1);
    }
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Failed to connect', err);
    process.exit(1);
  }
};

const locations = [
  { name: 'Anna Nagar', areaType: 'Residential', latitude: 13.0836, longitude: 80.2163 },
  { name: 'Velachery', areaType: 'Mixed', latitude: 12.9785, longitude: 80.2173 },
  { name: 'Adyar', areaType: 'Residential', latitude: 13.0033, longitude: 80.2555 },
  { name: 'T Nagar', areaType: 'Commercial', latitude: 13.0418, longitude: 80.2341 },
  { name: 'Guindy', areaType: 'Industrial', latitude: 13.0084, longitude: 80.2201 },
  { name: 'Tambaram', areaType: 'Mixed', latitude: 12.9249, longitude: 80.1000 },
  { name: 'Mylapore', areaType: 'Residential', latitude: 13.0368, longitude: 80.2676 },
  { name: 'Porur', areaType: 'Mixed', latitude: 13.0382, longitude: 80.1565 },
];

const vehicles = [
  { vehicleNumber: 'CARPE-VEH-01', vehicleType: 'Collection Truck', capacity: 2000, assignedArea: 'Anna Nagar' },
  { vehicleNumber: 'CARPE-VEH-02', vehicleType: 'Mini Truck', capacity: 1000, assignedArea: 'Velachery' },
  { vehicleNumber: 'CARPE-VEH-03', vehicleType: 'Collection Truck', capacity: 2000, assignedArea: 'Adyar' },
  { vehicleNumber: 'CARPE-VEH-04', vehicleType: 'Heavy Truck', capacity: 3000, assignedArea: 'Guindy' },
  { vehicleNumber: 'CARPE-VEH-05', vehicleType: 'Mini Truck', capacity: 1000, assignedArea: 'T Nagar' },
];

const wasteTypes = ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass', 'E-waste', 'Other'];

const generateWasteRecords = () => {
  const records = [];
  const now = new Date();
  
  // Generate ~300 records over the last 30 days
  for (let i = 0; i < 300; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now);
    date.setDate(date.getDate() - randomDaysAgo);
    
    const location = locations[Math.floor(Math.random() * locations.length)].name;
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)].vehicleNumber;
    const wasteType = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
    
    // Some bias to make Anna Nagar and Plastic higher
    let quantity = Math.floor(Math.random() * 300) + 50; 
    if (location === 'Anna Nagar') quantity += 150;
    if (wasteType === 'Plastic') quantity += 100;
    if (wasteType === 'Organic') quantity += 120;

    records.push({
      location,
      wasteType,
      quantity,
      vehicle,
      collector: 'System Generated',
      collectedAt: date,
      notes: 'Historical data import'
    });
  }
  return records;
};

const importData = async () => {
  try {
    await connectDB();

    await WasteRecord.deleteMany();
    await Location.deleteMany();
    await Vehicle.deleteMany();

    await Location.insertMany(locations);
    await Vehicle.insertMany(vehicles);
    const wasteRecords = generateWasteRecords();
    await WasteRecord.insertMany(wasteRecords);

    await Alert.deleteMany();
    await Alert.insertMany([
      { location: 'Anna Nagar', type: 'HIGH_WASTE', message: 'Plastic waste increased 24% in Anna Nagar.', priority: 'HIGH', status: 'ACTIVE' },
      { location: 'Velachery', type: 'ANOMALY', message: 'Organic waste increased 12% in Velachery.', priority: 'MEDIUM', status: 'ACTIVE' },
      { location: 'Guindy', type: 'CAPACITY', message: 'Vehicle CARPE-VEH-04 capacity exceeded.', priority: 'HIGH', status: 'ACTIVE' }
    ]);

    console.log('Data Imported successfully!');
    process.exit();
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

importData();
