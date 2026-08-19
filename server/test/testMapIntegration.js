const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const analyticsService = require('../services/analyticsService');
const WasteRecord = require('../models/WasteRecord');
const Location = require('../models/Location');

async function testMapIntegration() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB Atlas for Map Integration test...\n');

  // 1. Get initial map data
  console.log('1. Initial Map Telemetry:');
  const initialMap = await analyticsService.getMapData({});
  console.log(`  Found ${initialMap.length} locations on Map:`);
  initialMap.forEach((m) => {
    console.log(`    - ${m.name.padEnd(16)}: ${String(m.quantity).padStart(6)} KG | Coordinates: [${m.latitude}, ${m.longitude}] | HasCoords: ${m.hasCoordinates} | Priority: ${m.priority}`);
  });

  // 2. Add collection record for new location "Ambattur"
  console.log('\n2. Adding Collection Record with New Location "Ambattur"...');
  const record = await WasteRecord.create({
    location: 'Ambattur',
    wasteType: 'Plastic',
    quantity: 250,
    vehicle: 'TN-02-CD-5678',
    collector: 'Test Collector',
    collectedAt: new Date(),
    notes: 'TEMP_MAP_TEST'
  });
  console.log('✓ Collection saved with ID:', record._id);

  // 3. Check Map data before registering coordinates
  console.log('\n3. Map Data after collection addition (before coordinates registered):');
  const mapWithAmbattur = await analyticsService.getMapData({});
  const ambatturEntry = mapWithAmbattur.find(m => m.name.toLowerCase() === 'ambattur');
  console.log('  Ambattur Telemetry:', ambatturEntry);

  // 4. Register official municipal coordinates for Ambattur
  console.log('\n4. Registering Municipal Coordinates for "Ambattur" (13.1143, 80.1548)...');
  const locDoc = await Location.create({
    name: 'Ambattur',
    latitude: 13.1143,
    longitude: 80.1548,
    areaType: 'Industrial'
  });
  console.log('✓ Location document registered with coordinates.');

  // 5. Check Map data after coordinates registered
  console.log('\n5. Map Data after coordinates registered:');
  const mapAfterCoords = await analyticsService.getMapData({});
  const ambatturMapped = mapAfterCoords.find(m => m.name.toLowerCase() === 'ambattur');
  console.log('  Ambattur Telemetry on Map:', ambatturMapped);

  // 6. Test Filtering Map by "Ambattur"
  console.log('\n6. Filtering Map by location="Ambattur":');
  const filteredMap = await analyticsService.getMapData({ location: 'Ambattur' });
  console.log(`  Filtered results count: ${filteredMap.length}`);
  console.log('  Filtered result:', filteredMap[0]);

  // Clean up
  await WasteRecord.deleteOne({ _id: record._id });
  await Location.deleteOne({ _id: locDoc._id });
  console.log('\n✓ Cleaned up temporary test documents.');

  await mongoose.disconnect();
}

testMapIntegration().catch(console.error);
