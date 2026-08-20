const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('Failed to connect to MongoDB: MONGO_URI is not defined in .env');
      process.exit(1);
    }
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/waste', require('./routes/wasteRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/alerts', require('./routes/alertsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/assistant', require('./routes/assistantRoutes'));

// Basic route for testing
app.get('/', (req, res) => {
  res.send('CARPE API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
