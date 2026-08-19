const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const wasteController = require('../controllers/wasteController');
const locationController = require('../controllers/locationController');
const analyticsService = require('../services/analyticsService');
const WasteRecord = require('../models/WasteRecord');
const Location = require('../models/Location');

async function testPhase19Flow() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoURI);
  console.log('Connected to Atlas for Phase 19 End-to-End Test...\n');

  // Step 1: Add first collection for Ambattur
  console.log('--- Step 1: Adding Collection 1 for Ambattur (250 KG Plastic) ---');
  const req1 = {
    body: {
      location: 'Ambattur',
      wasteType: 'Plastic',
      quantity: 250,
      vehicle: 'TN-02-CD-5678',
      collector: 'S. Murugan',
      notes: 'PHASE19_TEST_1'
    }
  };
  let record1 = null;
  const res1 = {
    status: (code) => ({
      json: (data) => { record1 = data; }
    })
  };
  await wasteController.createWasteRecord(req1, res1);
  console.log('✓ Collection 1 created with ID:', record1._id);

  // Allow background geocoding promise to resolve
  await new Promise((r) => setTimeout(r, 1500));

  // Step 2: Check location in MongoDB Location collection
  const ambatturLoc = await Location.findOne({ name: 'Ambattur' });
  console.log('✓ Geocoded Coordinates for Ambattur in MongoDB:', [ambatturLoc?.latitude, ambatturLoc?.longitude]);

  // Step 3: Check Map Telemetry for Ambattur
  const mapData1 = await analyticsService.getMapData({});
  const mapAmbattur1 = mapData1.find((m) => m.name === 'Ambattur');
  console.log('✓ Map Telemetry after Collection 1:', {
    name: mapAmbattur1?.name,
    totalWaste: mapAmbattur1?.totalWaste,
    recordCount: mapAmbattur1?.recordCount,
    coordinates: [mapAmbattur1?.latitude, mapAmbattur1?.longitude],
    hasCoordinates: mapAmbattur1?.hasCoordinates,
    priority: mapAmbattur1?.priority
  });

  // Step 4: Add second collection for Ambattur (350 KG Organic) to test aggregation
  console.log('\n--- Step 4: Adding Collection 2 for Ambattur (350 KG Organic) ---');
  const req2 = {
    body: {
      location: 'Ambattur',
      wasteType: 'Organic',
      quantity: 350,
      vehicle: 'TN-04-GH-3456',
      collector: 'M. Anitha',
      notes: 'PHASE19_TEST_2'
    }
  };
  let record2 = null;
  const res2 = {
    status: (code) => ({
      json: (data) => { record2 = data; }
    })
  };
  await wasteController.createWasteRecord(req2, res2);
  console.log('✓ Collection 2 created with ID:', record2._id);

  // Step 5: Check Map Aggregation (Total: 600 KG, 2 entries, Priority: MEDIUM)
  const mapData2 = await analyticsService.getMapData({});
  const mapAmbattur2 = mapData2.find((m) => m.name === 'Ambattur');
  console.log('✓ Map Aggregated Telemetry after Collection 2:', {
    name: mapAmbattur2?.name,
    totalWaste: mapAmbattur2?.totalWaste,
    recordCount: mapAmbattur2?.recordCount,
    coordinates: [mapAmbattur2?.latitude, mapAmbattur2?.longitude],
    hasCoordinates: mapAmbattur2?.hasCoordinates,
    priority: mapAmbattur2?.priority
  });

  // Step 6: Test Tambaram and Chrompet
  console.log('\n--- Step 6: Testing Tambaram and Chrompet ---');
  const tambaram = await Location.findOne({ name: 'Tambaram' });
  const chrompet = await Location.findOne({ name: 'Chrompet' });
  console.log('✓ Tambaram Coordinates:', [tambaram?.latitude, tambaram?.longitude]);
  console.log('✓ Chrompet Coordinates:', [chrompet?.latitude, chrompet?.longitude]);

  // Step 7: Check dynamic /api/locations dropdown options
  let dropdownList = [];
  const resDropdown = { json: (d) => { dropdownList = d.map((l) => l.name); } };
  await locationController.getLocations({}, resDropdown);
  console.log('\n✓ Dynamic Locations Dropdown List:', dropdownList);
  console.log('  Ambattur in dropdown? ->', dropdownList.includes('Ambattur'));
  console.log('  Tambaram in dropdown? ->', dropdownList.includes('Tambaram'));
  console.log('  Chrompet in dropdown? ->', dropdownList.includes('Chrompet'));

  // Clean up temporary test records
  await WasteRecord.deleteMany({ notes: { $in: ['PHASE19_TEST_1', 'PHASE19_TEST_2'] } });
  console.log('\n✓ Cleaned up temporary test waste records.');

  await mongoose.disconnect();
}

testPhase19Flow().catch(console.error);
