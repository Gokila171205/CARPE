const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const locationController = require('../controllers/locationController');
const WasteRecord = require('../models/WasteRecord');

async function testDynamicLocations() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB Atlas for Dynamic Location test...\n');

  // 1. Check initial locations
  let resData1 = null;
  const res1 = { json: (d) => { resData1 = d; }, status: () => ({ json: (d) => { resData1 = d; } }) };
  await locationController.getLocations({}, res1);
  console.log('Initial Dynamic Locations:', resData1.map(l => l.name));

  // 2. Insert a temporary test collection with a brand new location "Ambattur"
  console.log('\nInserting collection record with location "Ambattur"...');
  const tempRecord = await WasteRecord.create({
    location: 'Ambattur',
    wasteType: 'Plastic',
    quantity: 250,
    vehicle: 'TN-01-AB-1234',
    collector: 'Test Collector',
    collectedAt: new Date(),
    notes: 'TEMP_LOCATION_TEST'
  });
  console.log('✓ Temporary record created with ID:', tempRecord._id);

  // 3. Re-query locations via locationController
  let resData2 = null;
  const res2 = { json: (d) => { resData2 = d; }, status: () => ({ json: (d) => { resData2 = d; } }) };
  await locationController.getLocations({}, res2);
  const namesAfter = resData2.map(l => l.name);
  console.log('Updated Dynamic Locations:', namesAfter);

  const ambatturFound = namesAfter.includes('Ambattur');
  console.log(`\nVerification: Was "Ambattur" detected dynamically? -> ${ambatturFound ? 'YES! ✓' : 'NO ✗'}`);

  // 4. Clean up the temporary test record
  await WasteRecord.deleteOne({ _id: tempRecord._id });
  console.log('✓ Cleaned up temporary test record.');

  await mongoose.disconnect();
}

testDynamicLocations().catch(console.error);
