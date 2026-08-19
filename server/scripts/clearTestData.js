const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const WasteRecord = require('../models/WasteRecord');

const SEED_TAG = 'CARPE_DEV_TEST_SEED';

async function clearTestData() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('Error: MONGO_URI is not set in server/.env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas.');

    console.log(`Searching for test records tagged with notes: "${SEED_TAG}"...`);
    const countBefore = await WasteRecord.countDocuments({ notes: SEED_TAG });
    console.log(`Found ${countBefore} test records.`);

    if (countBefore === 0) {
      console.log('No test records to clear. Existing production records remain untouched.');
    } else {
      const result = await WasteRecord.deleteMany({ notes: SEED_TAG });
      console.log(`✓ Successfully deleted ${result.deletedCount} test records.`);
      console.log('All real/user-entered records remain safe and preserved in MongoDB.');
    }

    const remainingTotal = await WasteRecord.countDocuments();
    console.log(`Total remaining records in collection: ${remainingTotal}`);
  } catch (err) {
    console.error('Error clearing test data:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

clearTestData();
