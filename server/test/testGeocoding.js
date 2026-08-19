const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const geocodingService = require('../services/geocodingService');
const Location = require('../models/Location');

async function testGeocoding() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoURI);
  console.log('Connected to Atlas for Geocoding test...\n');

  const testLocations = ['Ambattur', 'Tambaram', 'Chrompet', 'Madurai', 'Coimbatore'];

  for (const loc of testLocations) {
    console.log(`Resolving location: "${loc}"...`);
    const doc = await geocodingService.resolveAndCacheLocation(loc);
    console.log(`  -> Result: Name="${doc?.name}", Coordinates=[${doc?.latitude}, ${doc?.longitude}]`);
  }

  console.log('\nTesting repeated lookup (should use cached MongoDB document with 0 network calls)...');
  const cachedDoc = await geocodingService.resolveAndCacheLocation('Ambattur');
  console.log(`  -> Cached Result: Name="${cachedDoc?.name}", Coordinates=[${cachedDoc?.latitude}, ${cachedDoc?.longitude}]`);

  await mongoose.disconnect();
}

testGeocoding().catch(console.error);
