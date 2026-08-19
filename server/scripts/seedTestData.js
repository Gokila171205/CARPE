const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const WasteRecord = require('../models/WasteRecord');
const Location = require('../models/Location');

const SEED_TAG = 'CARPE_DEV_TEST_SEED';

const LOCATIONS = [
  { name: 'Anna Nagar', latitude: 13.0836, longitude: 80.2163, areaType: 'Residential' },
  { name: 'Velachery', latitude: 12.9785, longitude: 80.2173, areaType: 'Mixed' },
  { name: 'Adyar', latitude: 13.0012, longitude: 80.2565, areaType: 'Residential' },
  { name: 'T Nagar', latitude: 13.0418, longitude: 80.2341, areaType: 'Commercial' },
  { name: 'Guindy', latitude: 13.0067, longitude: 80.2030, areaType: 'Industrial' }
];

const WASTE_TYPES = ['Plastic', 'Organic', 'Paper', 'Metal', 'Glass', 'E-waste'];

const VEHICLES = ['TN-01-AB-1234', 'TN-02-CD-5678', 'TN-03-EF-9012', 'TN-04-GH-3456'];
const COLLECTORS = ['R. Kumar', 'S. Murugan', 'M. Anitha', 'K. Rajesh', 'P. Selvam'];

async function seedTestData() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('Error: MONGO_URI is not set in server/.env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas successfully.');

    // 1. Ensure Locations exist with real coordinates
    console.log('\n--- Ensuring registered municipal locations exist with coordinates ---');
    for (const loc of LOCATIONS) {
      await Location.findOneAndUpdate(
        { name: loc.name },
        { $set: { latitude: loc.latitude, longitude: loc.longitude, areaType: loc.areaType } },
        { upsert: true, new: true }
      );
    }
    console.log(`✓ Verified ${LOCATIONS.length} municipal locations with geospatial coordinates.`);

    // 2. Build Historical Waste Records across 4 Weeks (28 distinct dates)
    const records = [];
    const now = new Date();
    const daysCount = 28;

    let totalWeightKG = 0;
    const locationTotals = {};
    const categoryTotals = {};

    LOCATIONS.forEach((l) => (locationTotals[l.name] = 0));
    WASTE_TYPES.forEach((t) => (categoryTotals[t] = 0));

    for (let dayOffset = daysCount; dayOffset >= 0; dayOffset--) {
      const recordDate = new Date(now);
      recordDate.setDate(recordDate.getDate() - dayOffset);
      recordDate.setHours(9 + (dayOffset % 8), (dayOffset * 13) % 60, 0, 0);

      // Determine week tier for growth simulation (Week 1 -> Week 4)
      const weekIndex = Math.floor((daysCount - dayOffset) / 7) + 1; // 1 to 4
      const volumeMultiplier = 1 + (weekIndex - 1) * 0.28; // progressive ~28% weekly growth

      // Insert 2 to 4 collection records per day across random locations & waste types
      const dailyRecordsCount = 2 + (dayOffset % 3);

      for (let r = 0; r < dailyRecordsCount; r++) {
        const locIndex = (dayOffset + r) % LOCATIONS.length;
        const locName = LOCATIONS[locIndex].name;

        const typeIndex = (dayOffset * 2 + r) % WASTE_TYPES.length;
        const wasteType = WASTE_TYPES[typeIndex];

        // Base quantity between 75 KG and 220 KG adjusted by week multiplier
        let baseQty = 75 + ((dayOffset * 17 + r * 31) % 145);
        let quantity = Math.round(baseQty * volumeMultiplier);

        // Simulate a noticeable recent surge in Anna Nagar in Week 4
        if (locName === 'Anna Nagar' && weekIndex >= 3) {
          quantity = Math.round(quantity * 1.45);
        }

        const vehicle = VEHICLES[(dayOffset + r) % VEHICLES.length];
        const collector = COLLECTORS[(dayOffset * 3 + r) % COLLECTORS.length];

        records.push({
          location: locName,
          wasteType,
          quantity,
          vehicle,
          collector,
          collectedAt: recordDate,
          notes: SEED_TAG
        });

        totalWeightKG += quantity;
        locationTotals[locName] = (locationTotals[locName] || 0) + quantity;
        categoryTotals[wasteType] = (categoryTotals[wasteType] || 0) + quantity;
      }
    }

    console.log(`\nInserting ${records.length} realistic historical waste collection records...`);
    const inserted = await WasteRecord.insertMany(records);
    console.log(`✓ Successfully inserted ${inserted.length} waste records into MongoDB Atlas.`);

    console.log('\n================================================================');
    console.log('   SEED DATA COMPILATION SUMMARY                                ');
    console.log('================================================================');
    console.log(`Total Records Inserted : ${inserted.length}`);
    console.log(`Total Waste Volume     : ${totalWeightKG.toLocaleString()} KG`);
    console.log(`Historical Date Range  : ~${daysCount} days (4 Weeks)`);
    console.log('\nLocation Volume Distribution:');
    Object.entries(locationTotals).forEach(([loc, kg]) => {
      console.log(`  - ${loc.padEnd(16)}: ${kg.toLocaleString().padStart(8)} KG`);
    });
    console.log('\nMaterial Stream Distribution:');
    Object.entries(categoryTotals).forEach(([cat, kg]) => {
      console.log(`  - ${cat.padEnd(16)}: ${kg.toLocaleString().padStart(8)} KG`);
    });
    console.log('================================================================\n');

  } catch (err) {
    console.error('Error seeding test data:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

seedTestData();
