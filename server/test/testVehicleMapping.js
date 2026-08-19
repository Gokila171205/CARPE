const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const vehicleController = require('../controllers/vehicleController');

async function testVehicles() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoURI);
  console.log('Connected to Atlas for Vehicle Mapping test...\n');

  const req = {};
  let resData = null;
  const res = {
    json: (data) => {
      resData = data;
    },
    status: (code) => ({
      json: (data) => {
        resData = { code, ...data };
      }
    })
  };

  await vehicleController.getVehicles(req, res);
  console.log(`Total Vehicles Returned: ${resData?.length}`);
  resData?.forEach((v) => {
    console.log(`- Vehicle: ${v.vehicleNumber.padEnd(16)} | Collections: ${String(v.totalCollections).padStart(3)} | Waste: ${String(v.totalWaste).padStart(6)} KG | Locations: ${v.locationsCount} (${v.locationsCovered.slice(0, 3).join(', ')}) | Master: ${v.isMasterRecord}`);
  });

  // Test get individual vehicle collections for TN-01-AB-1234
  console.log('\nTesting getVehicleCollections for "TN-01-AB-1234":');
  const req2 = { params: { id: 'TN-01-AB-1234' } };
  let resData2 = null;
  const res2 = {
    json: (data) => {
      resData2 = data;
    },
    status: (code) => ({
      json: (data) => {
        resData2 = { code, ...data };
      }
    })
  };
  await vehicleController.getVehicleCollections(req2, res2);
  console.log(`Vehicle Number: ${resData2?.vehicle?.vehicleNumber}`);
  console.log(`Total Collections Found: ${resData2?.collections?.length}`);
  console.log(`Total Waste: ${resData2?.vehicle?.totalWaste} KG`);
  console.log('Sample Log Entry:', resData2?.collections?.[0]);

  await mongoose.disconnect();
}

testVehicles().catch(console.error);
