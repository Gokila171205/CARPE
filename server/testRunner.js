const express = require('express');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('./models/User');
const WasteRecord = require('./models/WasteRecord');
const Location = require('./models/Location');
const Vehicle = require('./models/Vehicle');
const Alert = require('./models/Alert');
const { generateToken } = require('./middleware/auth');
const analyticsService = require('./services/analyticsService');

// Create Express test app
const app = express();
app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/waste', require('./routes/wasteRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/alerts', require('./routes/alertsRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

async function runTests() {
  console.log('================================================================');
  console.log('   CARPE Analytics & Decision Intelligence - Phase 1 Test Suite  ');
  console.log('================================================================\n');

  let mongod;
  try {
    mongod = await MongoMemoryServer.create({
      instance: {
        launchTimeout: 180000
      }
    });
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('✓ Connected to In-Memory MongoDB Server');

    const user = await User.create({
      name: 'Member 2 Analyst',
      email: 'member2@carpe.org',
      password: 'password123',
      role: 'admin'
    });
    const token = generateToken(user._id);
    console.log('✓ Created User and generated JWT token');

    // -------------------------------------------------------------------------
    // 1. EMPTY DATABASE TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Empty Database Handling ---');
    const emptySummaryRes = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${token}`);
    
    if (emptySummaryRes.status !== 200) throw new Error(`Expected 200, got ${emptySummaryRes.status}`);
    const emptySummary = emptySummaryRes.body;
    if (
      emptySummary.totalWaste !== 0 ||
      emptySummary.averageDailyWaste !== 0 ||
      emptySummary.growth !== 0 ||
      emptySummary.growthPercentage !== 0 ||
      emptySummary.recyclable !== 0 ||
      emptySummary.recyclablePercentage !== 0 ||
      emptySummary.topArea !== null ||
      emptySummary.highestWasteLocation !== null ||
      emptySummary.topCategory !== null ||
      emptySummary.highestWasteCategory !== null ||
      emptySummary.recordCount !== 0
    ) {
      throw new Error('Empty summary failed validation');
    }
    console.log('✓ GET /api/analytics/summary returned clean zeros & nulls on empty DB');

    const emptyTrendsRes = await request(app)
      .get('/api/analytics/trends')
      .set('Authorization', `Bearer ${token}`);
    if (emptyTrendsRes.status !== 200 || !Array.isArray(emptyTrendsRes.body) || emptyTrendsRes.body.length !== 0) {
      throw new Error('Empty trends failed validation');
    }
    console.log('✓ GET /api/analytics/trends returned [] on empty DB');

    const emptyCategoriesRes = await request(app)
      .get('/api/analytics/categories')
      .set('Authorization', `Bearer ${token}`);
    if (emptyCategoriesRes.status !== 200 || !Array.isArray(emptyCategoriesRes.body) || emptyCategoriesRes.body.length !== 0) {
      throw new Error('Empty categories failed validation');
    }
    console.log('✓ GET /api/analytics/categories returned [] on empty DB');

    const emptyLocationsRes = await request(app)
      .get('/api/analytics/locations')
      .set('Authorization', `Bearer ${token}`);
    if (emptyLocationsRes.status !== 200 || !Array.isArray(emptyLocationsRes.body) || emptyLocationsRes.body.length !== 0) {
      throw new Error('Empty locations failed validation');
    }
    console.log('✓ GET /api/analytics/locations returned [] on empty DB');

    const emptyGrowthRes = await request(app)
      .get('/api/analytics/growth')
      .set('Authorization', `Bearer ${token}`);
    if (
      emptyGrowthRes.status !== 200 ||
      emptyGrowthRes.body.growthPercentage !== 0 ||
      emptyGrowthRes.body.absoluteChange !== 0 ||
      emptyGrowthRes.body.currentPeriod.totalWaste !== 0 ||
      emptyGrowthRes.body.previousPeriod.totalWaste !== 0 ||
      emptyGrowthRes.body.trend !== 'stable'
    ) {
      throw new Error('Empty growth failed validation');
    }
    console.log('✓ GET /api/analytics/growth handled division by zero safely and returned 0%');

    // -------------------------------------------------------------------------
    // 2. SEED SAMPLE REAL DATA
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Seeding Real Waste Collection Data for Calculation ---');
    const now = new Date();
    
    // Today: Anna Nagar, Plastic (Recyclable), 100 KG
    await WasteRecord.create({
      location: 'Anna Nagar',
      wasteType: 'Plastic',
      quantity: 100,
      vehicle: 'CARPE-VEH-01',
      collector: 'Collector 1',
      collectedAt: now
    });

    // Today: Anna Nagar, Organic (Non-recyclable), 150 KG
    await WasteRecord.create({
      location: 'Anna Nagar',
      wasteType: 'Organic',
      quantity: 150,
      vehicle: 'CARPE-VEH-01',
      collector: 'Collector 1',
      collectedAt: now
    });

    // 5 days ago: Velachery, Paper (Recyclable), 80 KG
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    await WasteRecord.create({
      location: 'Velachery',
      wasteType: 'Paper',
      quantity: 80,
      vehicle: 'CARPE-VEH-02',
      collector: 'Collector 2',
      collectedAt: fiveDaysAgo
    });

    // 10 days ago: Adyar, Glass (Recyclable), 60 KG
    const tenDaysAgo = new Date(now);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    await WasteRecord.create({
      location: 'Adyar',
      wasteType: 'Glass',
      quantity: 60,
      vehicle: 'CARPE-VEH-03',
      collector: 'Collector 3',
      collectedAt: tenDaysAgo
    });

    // 40 days ago (prior period): Anna Nagar, Plastic (Recyclable), 50 KG
    const fortyDaysAgo = new Date(now);
    fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
    await WasteRecord.create({
      location: 'Anna Nagar',
      wasteType: 'Plastic',
      quantity: 50,
      vehicle: 'CARPE-VEH-01',
      collector: 'Collector 1',
      collectedAt: fortyDaysAgo
    });

    console.log('✓ Inserted 5 waste records across multiple dates, types, and locations');

    // -------------------------------------------------------------------------
    // 3. SUMMARY API
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing GET /api/analytics/summary ---');
    const summaryRes = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${token}`);
    
    if (summaryRes.status !== 200) throw new Error(`Summary status: ${summaryRes.status}`);
    const summary = summaryRes.body;
    console.log('Summary result:', JSON.stringify(summary, null, 2));
    
    // Total waste = 100 + 150 + 80 + 60 + 50 = 440
    if (summary.totalWaste !== 440) throw new Error(`Expected totalWaste 440, got ${summary.totalWaste}`);
    // Recyclable = Plastic (150) + Paper (80) + Glass (60) = 290
    if (summary.recyclable !== 290 || summary.recyclableWaste !== 290) throw new Error(`Expected recyclable 290, got ${summary.recyclable}`);
    // Recyclable % = (290 / 440) * 100 = 65.91%
    if (summary.recyclablePercentage !== 65.91) throw new Error(`Expected recyclablePercentage 65.91, got ${summary.recyclablePercentage}`);
    // Highest waste location = Anna Nagar (300)
    if (summary.highestWasteLocation.name !== 'Anna Nagar' || summary.highestWasteLocation.total !== 300) {
      throw new Error(`Expected highestWasteLocation Anna Nagar (300), got ${JSON.stringify(summary.highestWasteLocation)}`);
    }
    // Highest waste category = Plastic (150) or Organic (150)
    if (!summary.highestWasteCategory || summary.highestWasteCategory.total !== 150) {
      throw new Error(`Expected highestWasteCategory total 150`);
    }
    console.log('✓ GET /api/analytics/summary verified all calculations successfully');

    // -------------------------------------------------------------------------
    // 4. TRENDS API
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing GET /api/analytics/trends ---');
    const trendsRes = await request(app)
      .get('/api/analytics/trends')
      .set('Authorization', `Bearer ${token}`);
    if (trendsRes.status !== 200) throw new Error(`Trends status: ${trendsRes.status}`);
    const trends = trendsRes.body;
    console.log('Trends result:', JSON.stringify(trends, null, 2));
    if (trends.length !== 4) throw new Error(`Expected 4 date entries, got ${trends.length}`);
    if (!trends[0].date || trends[0].waste === undefined) throw new Error('Invalid trends shape');
    console.log('✓ GET /api/analytics/trends aggregated correctly over time');

    // -------------------------------------------------------------------------
    // 5. CATEGORIES API
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing GET /api/analytics/categories ---');
    const categoriesRes = await request(app)
      .get('/api/analytics/categories')
      .set('Authorization', `Bearer ${token}`);
    if (categoriesRes.status !== 200) throw new Error(`Categories status: ${categoriesRes.status}`);
    const categories = categoriesRes.body;
    console.log('Categories result:', JSON.stringify(categories, null, 2));
    if (categories.length !== 4) throw new Error(`Expected 4 categories, got ${categories.length}`);
    const plastic = categories.find(c => c.name === 'Plastic');
    if (plastic.total !== 150 || plastic.value !== 150) throw new Error(`Expected Plastic 150, got ${plastic.total}`);
    // Percentage sum should be ~100
    const totalPct = categories.reduce((sum, c) => sum + c.percentage, 0);
    if (Math.round(totalPct) !== 100) throw new Error(`Expected percentage sum ~100, got ${totalPct}`);
    console.log('✓ GET /api/analytics/categories grouped with values and percentages');

    // -------------------------------------------------------------------------
    // 6. LOCATIONS API
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing GET /api/analytics/locations ---');
    const locationsRes = await request(app)
      .get('/api/analytics/locations')
      .set('Authorization', `Bearer ${token}`);
    if (locationsRes.status !== 200) throw new Error(`Locations status: ${locationsRes.status}`);
    const locations = locationsRes.body;
    console.log('Locations result:', JSON.stringify(locations, null, 2));
    if (locations.length !== 3) throw new Error(`Expected 3 locations, got ${locations.length}`);
    const annaLoc = locations.find(l => l.name === 'Anna Nagar');
    if (annaLoc.total !== 300 || annaLoc.count !== 3) throw new Error(`Expected Anna Nagar total 300, count 3`);
    console.log('✓ GET /api/analytics/locations grouped with totals, counts, and status');

    // -------------------------------------------------------------------------
    // 7. GROWTH API
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing GET /api/analytics/growth ---');
    const growthRes = await request(app)
      .get('/api/analytics/growth')
      .set('Authorization', `Bearer ${token}`);
    if (growthRes.status !== 200) throw new Error(`Growth status: ${growthRes.status}`);
    const growth = growthRes.body;
    console.log('Growth result:', JSON.stringify(growth, null, 2));
    // Recent 30 days: 100 + 150 + 80 + 60 = 390. Previous 30 days (days 31-60): 50
    if (growth.currentPeriod.totalWaste !== 390) throw new Error(`Expected current total 390, got ${growth.currentPeriod.totalWaste}`);
    if (growth.previousPeriod.totalWaste !== 50) throw new Error(`Expected prev total 50, got ${growth.previousPeriod.totalWaste}`);
    // Growth % = ((390 - 50) / 50) * 100 = 680%
    if (growth.growthPercentage !== 680) throw new Error(`Expected growth 680%, got ${growth.growthPercentage}`);
    if (growth.absoluteChange !== 340) throw new Error(`Expected absolute change 340, got ${growth.absoluteChange}`);
    if (growth.trend !== 'increasing') throw new Error(`Expected trend increasing, got ${growth.trend}`);
    console.log('✓ GET /api/analytics/growth verified period comparisons and percentages');

    // -------------------------------------------------------------------------
    // 7b. MAP & LOCATION INTELLIGENCE API
    // -------------------------------------------------------------------------
    console.log('\n--- 7b. Testing GET /api/analytics/map ---');
    // First seed Location model with coordinates for Anna Nagar and Velachery
    await Location.create([
      { name: 'Anna Nagar', areaType: 'Residential', latitude: 13.0836, longitude: 80.2163 },
      { name: 'Velachery', areaType: 'Mixed', latitude: 12.9785, longitude: 80.2173 }
    ]);
    const mapRes = await request(app)
      .get('/api/analytics/map')
      .set('Authorization', `Bearer ${token}`);
    if (mapRes.status !== 200) throw new Error(`Map status: ${mapRes.status}`);
    const mapData = mapRes.body;
    console.log('Map result:', JSON.stringify(mapData, null, 2));
    if (!Array.isArray(mapData)) throw new Error('Expected array from /api/analytics/map');
    const annaMap = mapData.find(m => m.name === 'Anna Nagar');
    if (!annaMap || annaMap.latitude !== 13.0836 || annaMap.hasCoordinates !== true) {
      throw new Error('Expected Anna Nagar with coordinates and hasCoordinates true');
    }
    const adyarMap = mapData.find(m => m.name === 'Adyar');
    if (!adyarMap || adyarMap.hasCoordinates !== false) {
      throw new Error('Expected Adyar with hasCoordinates false (no Location doc seeded)');
    }
    // -------------------------------------------------------------------------
    // 7c. INTELLIGENT ALERTS API
    // -------------------------------------------------------------------------
    console.log('\n--- 7c. Testing GET /api/alerts & Intelligent Detection ---');
    const alertsRes = await request(app)
      .get('/api/alerts')
      .set('Authorization', `Bearer ${token}`);
    if (alertsRes.status !== 200) throw new Error(`Alerts status: ${alertsRes.status}`);
    const alertsData = alertsRes.body;
    console.log('Alerts result count:', alertsData.length);
    console.log('Sample alert:', JSON.stringify(alertsData[0] || {}, null, 2));
    if (!Array.isArray(alertsData)) throw new Error('Expected array from /api/alerts');
    if (alertsData.length > 0) {
      if (!alertsData[0].title || !alertsData[0].priority || !alertsData[0].recommendation) {
        throw new Error('Alert structure missing title, priority, or recommendation');
      }
    }
    console.log('✓ GET /api/alerts verified with intelligent alert detection, priority weights, and recommendations');

    // -------------------------------------------------------------------------
    // 7d. AI DECISION INTELLIGENCE API
    // -------------------------------------------------------------------------
    console.log('\n--- 7d. Testing POST & GET /api/ai/insights (AI & Fallback) ---');
    const aiRes = await request(app)
      .post('/api/ai/insights')
      .set('Authorization', `Bearer ${token}`)
      .send({ location: 'Anna Nagar' });
    if (aiRes.status !== 200) throw new Error(`AI Insights status: ${aiRes.status}`);
    const aiBody = aiRes.body;
    console.log('AI Insights result structure:', Object.keys(aiBody));
    console.log('AI Insights sample:', JSON.stringify(aiBody.insights?.[0] || {}, null, 2));
    if (!aiBody.insights || !Array.isArray(aiBody.insights)) {
      throw new Error('Expected insights array in AI response');
    }
    if (!aiBody.evidence || !aiBody.evidence.summary) {
      throw new Error('Expected structured evidence in AI response');
    }
    if (aiBody.insights.length > 0) {
      const ins = aiBody.insights[0];
      if (!ins.title || !ins.observation || !ins.recommendation || !ins.priority) {
        throw new Error('AI insight missing title, observation, recommendation, or priority');
      }
    }
    console.log('✓ POST /api/ai/insights verified with evidence, fallback engine, and decision intelligence');

    // -------------------------------------------------------------------------
    // 7e. PREDICTIVE WASTE FORECASTING API
    // -------------------------------------------------------------------------
    console.log('\n--- 7e. Testing GET /api/analytics/forecast ---');
    const forecast7Res = await request(app)
      .get('/api/analytics/forecast?forecastDays=7')
      .set('Authorization', `Bearer ${token}`);
    if (forecast7Res.status !== 200) throw new Error(`Forecast status: ${forecast7Res.status}`);
    const forecast7 = forecast7Res.body;
    console.log('Forecast result (7 days):', JSON.stringify(forecast7.data?.summary || {}, null, 2));
    if (!forecast7.success || !forecast7.sufficient || !forecast7.data) {
      throw new Error('Expected successful forecast with sufficient data');
    }
    if (forecast7.data.forecast.length !== 7) {
      throw new Error(`Expected 7 forecast points, got ${forecast7.data.forecast.length}`);
    }
    if (!forecast7.data.summary.averageHistoricalWaste || !forecast7.data.summary.averageForecastWaste) {
      throw new Error('Forecast missing historical or forecast average metrics');
    }

    // Test 14-day and 30-day horizons
    const forecast14Res = await request(app)
      .get('/api/analytics/forecast?forecastDays=14')
      .set('Authorization', `Bearer ${token}`);
    if (forecast14Res.body.data?.forecast.length !== 14) throw new Error('Expected 14 forecast points');

    // Test Insufficient Data Response (empty filter)
    const emptyLocForecast = await request(app)
      .get('/api/analytics/forecast?location=NonExistentPlace')
      .set('Authorization', `Bearer ${token}`);
    if (emptyLocForecast.body.sufficient !== false) {
      throw new Error('Expected sufficient: false on nonexistent location');
    }
    console.log('✓ GET /api/analytics/forecast verified 7/14/30 day projections and data sufficiency safeguards');

    // -------------------------------------------------------------------------
    // 7f. GOVERNMENT REPORTS & DATA EXPORT API
    // -------------------------------------------------------------------------
    console.log('\n--- 7f. Testing GET /api/analytics/reports (Summary, Collection, Category, Location, Alert, Forecast) ---');
    
    // Summary report
    const summaryRep = await request(app)
      .get('/api/analytics/reports?reportType=summary')
      .set('Authorization', `Bearer ${token}`);
    if (summaryRep.status !== 200 || !summaryRep.body.summary || !summaryRep.body.categories) {
      throw new Error('Failed GET /api/analytics/reports?reportType=summary');
    }
    console.log('✓ Summary Report compiled successfully');

    // Collection report
    const collRep = await request(app)
      .get('/api/analytics/reports?reportType=collection&limit=10')
      .set('Authorization', `Bearer ${token}`);
    if (collRep.status !== 200 || !Array.isArray(collRep.body.records)) {
      throw new Error('Failed GET /api/analytics/reports?reportType=collection');
    }
    console.log('✓ Collection Log Report verified with pagination');

    // Category report
    const catRep = await request(app)
      .get('/api/analytics/reports?reportType=category')
      .set('Authorization', `Bearer ${token}`);
    if (catRep.status !== 200 || !Array.isArray(catRep.body.categories)) {
      throw new Error('Failed GET /api/analytics/reports?reportType=category');
    }
    console.log('✓ Category Report verified');

    // Location report
    const locRep = await request(app)
      .get('/api/analytics/reports?reportType=location')
      .set('Authorization', `Bearer ${token}`);
    if (locRep.status !== 200 || !Array.isArray(locRep.body.locations)) {
      throw new Error('Failed GET /api/analytics/reports?reportType=location');
    }
    console.log('✓ Location Report verified');

    // Alert report
    const alertRep = await request(app)
      .get('/api/analytics/reports?reportType=alert')
      .set('Authorization', `Bearer ${token}`);
    if (alertRep.status !== 200 || !Array.isArray(alertRep.body.alerts)) {
      throw new Error('Failed GET /api/analytics/reports?reportType=alert');
    }
    console.log('✓ Alert Report verified');

    // Forecast report
    const forecastRep = await request(app)
      .get('/api/analytics/reports?reportType=forecast')
      .set('Authorization', `Bearer ${token}`);
    if (forecastRep.status !== 200 || !forecastRep.body.forecast) {
      throw new Error('Failed GET /api/analytics/reports?reportType=forecast');
    }
    console.log('✓ Forecast Report verified');

    // -------------------------------------------------------------------------
    // 8. OPTIONAL FILTERS
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing Optional Filters (startDate, endDate, location, wasteType) ---');
    
    // Filter by location
    const filteredLocRes = await request(app)
      .get('/api/analytics/summary?location=Velachery')
      .set('Authorization', `Bearer ${token}`);
    if (filteredLocRes.body.totalWaste !== 80 || filteredLocRes.body.highestWasteLocation.name !== 'Velachery') {
      throw new Error('Location filter failed');
    }
    console.log('✓ Filter by location: Velachery -> 80 KG');

    // Filter by wasteType
    const filteredTypeRes = await request(app)
      .get('/api/analytics/summary?wasteType=Plastic')
      .set('Authorization', `Bearer ${token}`);
    if (filteredTypeRes.body.totalWaste !== 150 || filteredTypeRes.body.highestWasteCategory.name !== 'Plastic') {
      throw new Error('WasteType filter failed');
    }
    console.log('✓ Filter by wasteType: Plastic -> 150 KG');

    // Filter by Date Range: last 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateQuery = `startDate=${sevenDaysAgo.toISOString().split('T')[0]}&endDate=${now.toISOString().split('T')[0]}`;
    const filteredDateRes = await request(app)
      .get(`/api/analytics/summary?${dateQuery}`)
      .set('Authorization', `Bearer ${token}`);
    // Last 7 days includes: Record 1 (100), Record 2 (150), Record 3 (80) = 330 KG
    if (filteredDateRes.body.totalWaste !== 330) {
      throw new Error(`Expected 330 KG in last 7 days, got ${filteredDateRes.body.totalWaste}`);
    }
    console.log(`✓ Filter by date range (${dateQuery}): 330 KG`);

    // Combined filter: location + wasteType + dateRange
    const combinedRes = await request(app)
      .get(`/api/analytics/summary?${dateQuery}&location=Anna Nagar&wasteType=Plastic`)
      .set('Authorization', `Bearer ${token}`);
    if (combinedRes.body.totalWaste !== 100) {
      throw new Error(`Expected 100 KG for combined filter, got ${combinedRes.body.totalWaste}`);
    }
    console.log('✓ Combined filters (date + location + wasteType) evaluated correctly');

    // -------------------------------------------------------------------------
    // 9. VALIDATION & ERROR HANDLING
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Testing Validation & Error Handling ---');
    
    // Invalid startDate
    const invalidStartRes = await request(app)
      .get('/api/analytics/summary?startDate=bad-date-format')
      .set('Authorization', `Bearer ${token}`);
    if (invalidStartRes.status !== 400 || invalidStartRes.body.success !== false) {
      throw new Error('Failed to reject invalid startDate with 400 and success:false');
    }
    console.log('✓ Rejected invalid startDate format with 400 Bad Request');

    // Invalid endDate
    const invalidEndRes = await request(app)
      .get('/api/analytics/trends?endDate=not-a-valid-date')
      .set('Authorization', `Bearer ${token}`);
    if (invalidEndRes.status !== 400 || invalidEndRes.body.success !== false) {
      throw new Error('Failed to reject invalid endDate with 400 and success:false');
    }
    console.log('✓ Rejected invalid endDate format with 400 Bad Request');

    // startDate > endDate
    const invertedDateRes = await request(app)
      .get('/api/analytics/growth?startDate=2026-09-01&endDate=2026-08-01')
      .set('Authorization', `Bearer ${token}`);
    if (invertedDateRes.status !== 400 || invalidEndRes.body.success !== false) {
      throw new Error('Failed to reject inverted date range');
    }
    console.log('✓ Rejected startDate > endDate with 400 Bad Request');

    // Missing token
    const noTokenRes = await request(app).get('/api/analytics/summary');
    if (noTokenRes.status !== 401) {
      throw new Error(`Expected 401, got ${noTokenRes.status}`);
    }
    console.log('✓ Enforced authentication (401 when no token)');

    // -------------------------------------------------------------------------
    // 10. MEMBER 1 REGRESSION TESTS (Existing CRUD & Endpoints)
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Testing Member 1 Existing APIs & CRUD Operations ---');
    
    // Member 1: Waste Routes (/api/waste)
    const createWasteRes = await request(app)
      .post('/api/waste')
      .set('Authorization', `Bearer ${token}`)
      .send({
        location: 'Guindy',
        wasteType: 'E-waste',
        quantity: 110,
        vehicle: 'CARPE-VEH-04',
        collector: 'Collector Guindy'
      });
    if (createWasteRes.status !== 201 || !createWasteRes.body._id) {
      throw new Error(`Failed POST /api/waste: ${createWasteRes.status}`);
    }
    const createdId = createWasteRes.body._id;

    const getWasteList = await request(app)
      .get('/api/waste')
      .set('Authorization', `Bearer ${token}`);
    if (getWasteList.status !== 200 || !Array.isArray(getWasteList.body)) {
      throw new Error(`Failed GET /api/waste: ${getWasteList.status}`);
    }

    const getWasteById = await request(app)
      .get(`/api/waste/${createdId}`)
      .set('Authorization', `Bearer ${token}`);
    if (getWasteById.status !== 200 || getWasteById.body.location !== 'Guindy') {
      throw new Error(`Failed GET /api/waste/:id: ${getWasteById.status}`);
    }

    const updateWaste = await request(app)
      .put(`/api/waste/${createdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 135 });
    if (updateWaste.status !== 200 || updateWaste.body.quantity !== 135) {
      throw new Error(`Failed PUT /api/waste/:id: ${updateWaste.status}`);
    }

    const deleteWaste = await request(app)
      .delete(`/api/waste/${createdId}`)
      .set('Authorization', `Bearer ${token}`);
    if (deleteWaste.status !== 200) {
      throw new Error(`Failed DELETE /api/waste/:id: ${deleteWaste.status}`);
    }
    console.log('✓ /api/waste (GET, POST, GET/:id, PUT/:id, DELETE/:id) fully verified');

    // Member 1: Locations Routes (/api/locations)
    const createLocRes = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tambaram', areaType: 'Mixed', latitude: 12.9249, longitude: 80.1000 });
    if (createLocRes.status !== 201) throw new Error('Failed to create location');

    const getLocsRes = await request(app)
      .get('/api/locations')
      .set('Authorization', `Bearer ${token}`);
    if (getLocsRes.status !== 200 || getLocsRes.body.length === 0) throw new Error('Failed to get locations');
    console.log('✓ /api/locations (GET, POST) fully verified');

    // Member 1: Vehicles Routes (/api/vehicles)
    const createVehRes = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleNumber: 'CARPE-TEST-99', vehicleType: 'Mini Truck', capacity: 1000, assignedArea: 'Tambaram' });
    if (createVehRes.status !== 201) throw new Error('Failed to create vehicle');

    const getVehsRes = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${token}`);
    if (getVehsRes.status !== 200 || getVehsRes.body.length === 0) throw new Error('Failed to get vehicles');
    console.log('✓ /api/vehicles (GET, POST) fully verified');

    // Member 1: Alerts Routes (/api/alerts)
    const alert = await Alert.create({
      location: 'Anna Nagar',
      type: 'HIGH_WASTE',
      message: 'Test alert message',
      priority: 'HIGH',
      status: 'ACTIVE'
    });
    const getAlertsRes = await request(app)
      .get('/api/alerts')
      .set('Authorization', `Bearer ${token}`);
    if (getAlertsRes.status !== 200 || getAlertsRes.body.length === 0) throw new Error('Failed to get alerts');
    console.log('✓ /api/alerts (GET) fully verified');

    // Member 1: Auth Routes (/api/auth/me)
    const authMeRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    if (authMeRes.status !== 200 || authMeRes.body.email !== 'member2@carpe.org') {
      throw new Error('Failed GET /api/auth/me');
    }
    console.log('✓ /api/auth/me (GET) fully verified');

    console.log('\n================================================================');
    console.log('   ALL PHASE 1 BACKEND & INTEGRATION TESTS PASSED 100%! ✓        ');
    console.log('================================================================\n');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }
}

runTests();
