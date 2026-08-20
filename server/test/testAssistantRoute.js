const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const express = require('express');
const cors = require('cors');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { generateToken } = require('../middleware/auth');
const User = require('../models/User');

async function testRoute() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoURI);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/assistant', require('../routes/assistantRoutes'));

  // Get or create test user
  let user = await User.findOne({});
  if (!user) {
    user = await User.create({
      name: 'Test Officer',
      email: 'testofficer@tn.gov.in',
      password: 'password123',
      role: 'Admin'
    });
  }

  const token = generateToken(user._id);

  console.log('Testing POST /api/assistant/chat with valid JWT token...');
  const res = await request(app)
    .post('/api/assistant/chat')
    .set('Authorization', `Bearer ${token}`)
    .send({
      message: 'Which location has the highest waste?',
      language: 'en'
    });

  console.log('Status code:', res.statusCode);
  console.log('Success:', res.body.success);
  console.log('Answer preview:', res.body.answer?.substring(0, 100));

  if (res.statusCode === 200 && res.body.success === true && res.body.answer) {
    console.log('\n✓ API ROUTE TEST PASSED!');
  } else {
    console.log('\n✗ API ROUTE TEST FAILED:', res.body);
  }

  // Test unauthorized request
  console.log('\nTesting POST /api/assistant/chat without JWT token (should return 401)...');
  const resUnauth = await request(app)
    .post('/api/assistant/chat')
    .send({ message: 'Hello' });

  console.log('Status code for unauthenticated request:', resUnauth.statusCode);
  if (resUnauth.statusCode === 401) {
    console.log('✓ AUTHENTICATION ENFORCEMENT PASSED!');
  } else {
    console.log('✗ AUTHENTICATION CHECK FAILED');
  }

  await mongoose.disconnect();
}

testRoute().catch(console.error);
