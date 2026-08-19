const express = require('express');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../models/User');
const WasteRecord = require('../models/WasteRecord');
const Location = require('../models/Location');
const Vehicle = require('../models/Vehicle');
const Alert = require('../models/Alert');
const { generateToken } = require('../middleware/auth');

// Create test express app
const app = express();
app.use(express.json());
app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/waste', require('../routes/wasteRoutes'));
app.use('/api/locations', require('../routes/locationRoutes'));
app.use('/api/vehicles', require('../routes/vehicleRoutes'));
app.use('/api/alerts', require('../routes/alertsRoutes'));
app.use('/api/analytics', require('../routes/analyticsRoutes'));

let mongod;
let authToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  const testUser = await User.create({
    name: 'Test Member 2',
    email: 'analytics@carpe.org',
    password: 'password123',
    role: 'admin'
  });
  authToken = generateToken(testUser._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

describe('Analytics & Decision Intelligence API Suite', () => {
  describe('Phase 1 - Empty Database Tests', () => {
    beforeEach(async () => {
      await WasteRecord.deleteMany({});
    });

    test('GET /api/analytics/summary returns 0s and nulls when empty', async () => {
      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalWaste).toBe(0);
      expect(res.body.averageDailyWaste).toBe(0);
      expect(res.body.growthPercentage).toBe(0);
      expect(res.body.growth).toBe(0);
      expect(res.body.recyclable).toBe(0);
      expect(res.body.recyclablePercentage).toBe(0);
      expect(res.body.topArea).toBeNull();
      expect(res.body.highestWasteLocation).toBeNull();
      expect(res.body.topCategory).toBeNull();
      expect(res.body.highestWasteCategory).toBeNull();
      expect(res.body.recordCount).toBe(0);
    });

    test('GET /api/analytics/trends returns empty array when empty', async () => {
      const res = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    test('GET /api/analytics/categories returns empty array when empty', async () => {
      const res = await request(app)
        .get('/api/analytics/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    test('GET /api/analytics/locations returns empty array when empty', async () => {
      const res = await request(app)
        .get('/api/analytics/locations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    test('GET /api/analytics/growth returns zero growth and safe division when empty', async () => {
      const res = await request(app)
        .get('/api/analytics/growth')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.growthPercentage).toBe(0);
      expect(res.body.absoluteChange).toBe(0);
      expect(res.body.currentPeriod.totalWaste).toBe(0);
      expect(res.body.previousPeriod.totalWaste).toBe(0);
      expect(res.body.trend).toBe('stable');
    });
  });

  describe('Phase 1 - Seeded Data Calculations & Filters', () => {
    beforeAll(async () => {
      await WasteRecord.deleteMany({});

      const now = new Date();
      // Record 1: Today, Anna Nagar, Plastic (Recyclable), 100 KG
      await WasteRecord.create({
        location: 'Anna Nagar',
        wasteType: 'Plastic',
        quantity: 100,
        vehicle: 'CARPE-VEH-01',
        collector: 'Collector A',
        collectedAt: now
      });

      // Record 2: Today, Anna Nagar, Organic (Non-recyclable), 150 KG
      await WasteRecord.create({
        location: 'Anna Nagar',
        wasteType: 'Organic',
        quantity: 150,
        vehicle: 'CARPE-VEH-01',
        collector: 'Collector A',
        collectedAt: now
      });

      // Record 3: 5 days ago, Velachery, Paper (Recyclable), 80 KG
      const fiveDaysAgo = new Date(now);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      await WasteRecord.create({
        location: 'Velachery',
        wasteType: 'Paper',
        quantity: 80,
        vehicle: 'CARPE-VEH-02',
        collector: 'Collector B',
        collectedAt: fiveDaysAgo
      });

      // Record 4: 40 days ago (previous period), Anna Nagar, Plastic, 50 KG
      const fortyDaysAgo = new Date(now);
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
      await WasteRecord.create({
        location: 'Anna Nagar',
        wasteType: 'Plastic',
        quantity: 50,
        vehicle: 'CARPE-VEH-01',
        collector: 'Collector A',
        collectedAt: fortyDaysAgo
      });
    });

    test('GET /api/analytics/summary calculates correct totals, recyclables, and top stats', async () => {
      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      // Total waste = 100 + 150 + 80 + 50 = 380
      expect(res.body.totalWaste).toBe(380);
      // Recyclable (Plastic: 100 + 50 = 150, Paper: 80) = 230
      expect(res.body.recyclable).toBe(230);
      expect(res.body.recyclableWaste).toBe(230);
      // Recyclable percentage: (230 / 380) * 100 = 60.53%
      expect(res.body.recyclablePercentage).toBe(60.53);
      // Top Area: Anna Nagar (300 KG) vs Velachery (80 KG)
      expect(res.body.highestWasteLocation.name).toBe('Anna Nagar');
      expect(res.body.highestWasteLocation.total).toBe(300);
      expect(res.body.topArea.name).toBe('Anna Nagar');
      // Top Category: Plastic (150) or Organic (150)
      expect(res.body.highestWasteCategory).toBeDefined();
      expect(res.body.recordCount).toBe(4);
    });

    test('GET /api/analytics/summary filters by location', async () => {
      const res = await request(app)
        .get('/api/analytics/summary?location=Velachery')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalWaste).toBe(80);
      expect(res.body.highestWasteLocation.name).toBe('Velachery');
      expect(res.body.recordCount).toBe(1);
    });

    test('GET /api/analytics/summary filters by wasteType', async () => {
      const res = await request(app)
        .get('/api/analytics/summary?wasteType=Plastic')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalWaste).toBe(150);
      expect(res.body.highestWasteCategory.name).toBe('Plastic');
      expect(res.body.recordCount).toBe(2);
    });

    test('GET /api/analytics/trends returns daily aggregated records', async () => {
      const res = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('date');
      expect(res.body[0]).toHaveProperty('waste');
      expect(res.body[0]).toHaveProperty('count');
    });

    test('GET /api/analytics/categories returns category breakdown with percentage', async () => {
      const res = await request(app)
        .get('/api/analytics/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3); // Plastic, Organic, Paper
      const plastic = res.body.find(c => c.name === 'Plastic');
      expect(plastic).toBeDefined();
      expect(plastic.total).toBe(150);
      expect(plastic.value).toBe(150);
    });

    test('GET /api/analytics/locations returns location breakdown with status', async () => {
      const res = await request(app)
        .get('/api/analytics/locations')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      const annaNagar = res.body.find(l => l.name === 'Anna Nagar');
      expect(annaNagar.total).toBe(300);
      expect(annaNagar.status).toBe('Low'); // < 500 is Low
    });

    test('GET /api/analytics/growth compares recent 30 days vs previous 30 days', async () => {
      const res = await request(app)
        .get('/api/analytics/growth')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      // Recent 30 days: 100 + 150 + 80 = 330
      expect(res.body.currentPeriod.totalWaste).toBe(330);
      // Previous 30 days (day 31-60): 50
      expect(res.body.previousPeriod.totalWaste).toBe(50);
      // Growth = ((330 - 50) / 50) * 100 = 560%
      expect(res.body.growthPercentage).toBe(560);
      expect(res.body.absoluteChange).toBe(280);
      expect(res.body.trend).toBe('increasing');
    });
  });

  describe('Validation & Error Handling', () => {
    test('Rejects invalid startDate with 400', async () => {
      const res = await request(app)
        .get('/api/analytics/summary?startDate=not-a-date')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid startDate');
    });

    test('Rejects invalid endDate with 400', async () => {
      const res = await request(app)
        .get('/api/analytics/trends?endDate=invalid-end')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid endDate');
    });

    test('Rejects when startDate > endDate with 400', async () => {
      const res = await request(app)
        .get('/api/analytics/growth?startDate=2026-08-20&endDate=2026-08-10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot be after');
    });

    test('Requires authorization token for protected analytics endpoints', async () => {
      const res = await request(app).get('/api/analytics/summary');
      expect(res.status).toBe(401);
    });
  });

  describe('Member 1 Existing APIs Regression Test', () => {
    test('WasteRecord CRUD APIs still work properly', async () => {
      // Create record
      const createRes = await request(app)
        .post('/api/waste')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          location: 'Adyar',
          wasteType: 'Glass',
          quantity: 75,
          vehicle: 'CARPE-VEH-03',
          collector: 'Collector C'
        });
      expect(createRes.status).toBe(201);
      expect(createRes.body._id).toBeDefined();

      const recordId = createRes.body._id;

      // Get all records
      const listRes = await request(app)
        .get('/api/waste')
        .set('Authorization', `Bearer ${authToken}`);
      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);

      // Get single record
      const singleRes = await request(app)
        .get(`/api/waste/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(singleRes.status).toBe(200);
      expect(singleRes.body.location).toBe('Adyar');

      // Update record
      const updateRes = await request(app)
        .put(`/api/waste/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 90 });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.quantity).toBe(90);

      // Delete record
      const deleteRes = await request(app)
        .delete(`/api/waste/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(deleteRes.status).toBe(200);
    });
  });
});
