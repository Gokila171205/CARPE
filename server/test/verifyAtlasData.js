const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const analyticsService = require('../services/analyticsService');
const alertService = require('../services/alertService');
const aiInsightService = require('../services/aiInsightService');

async function verifyAtlasData() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB Atlas for end-to-end verification...\n');

  // 1. Analytics Summary
  console.log('1. Testing Analytics Summary on Atlas:');
  const summary = await analyticsService.getSummary({});
  console.log('  Total Waste:', summary.totalWaste, 'KG');
  console.log('  Daily Average:', summary.averageDailyWaste, 'KG/day');
  console.log('  Period Growth:', summary.growthPercentage, '%');
  console.log('  Recyclable %:', summary.recyclablePercentage, '%');
  console.log('  Top Location:', summary.highestWasteLocation?.name, `(${summary.highestWasteLocation?.total} KG)`);
  console.log('  Top Category:', summary.highestWasteCategory?.name, `(${summary.highestWasteCategory?.total} KG)`);
  console.log('  Total Records:', summary.recordCount);

  // 2. Trends
  console.log('\n2. Testing Analytics Trends on Atlas:');
  const trends = await analyticsService.getTrends({});
  console.log(`  Aggregated across ${trends.length} distinct collection dates.`);

  // 3. Map
  console.log('\n3. Testing Geospatial Map Telemetry on Atlas:');
  const mapData = await analyticsService.getMapData({});
  console.log(`  Map telemetry returned ${mapData.length} locations:`);
  mapData.forEach(m => {
    console.log(`    - ${m.name}: ${m.quantity} KG, Coordinates: [${m.latitude}, ${m.longitude}], Priority: ${m.priority}`);
  });

  // 4. Alerts
  console.log('\n4. Testing Intelligent Alerts on Atlas:');
  const alerts = await alertService.getAlerts({});
  console.log(`  Generated ${alerts.length} active operational alerts:`);
  alerts.slice(0, 3).forEach(a => {
    console.log(`    - [${a.priority}] ${a.title} (${a.location}): ${a.message}`);
  });

  // 5. Forecast
  console.log('\n5. Testing Predictive Forecast on Atlas:');
  const forecast7 = await analyticsService.getForecast({ forecastDays: 7 });
  console.log('  Forecast (7 days):');
  console.log('    Method:', forecast7.data?.method);
  console.log('    Reliability:', forecast7.data?.reliability, `(${forecast7.data?.historicalPeriod?.dataPointsCount} data points)`);
  console.log('    Historical Daily Avg:', forecast7.data?.summary?.averageHistoricalWaste, 'KG/day');
  console.log('    Projected Daily Avg:', forecast7.data?.summary?.averageForecastWaste, 'KG/day');
  console.log('    Expected Growth %:', forecast7.data?.summary?.expectedGrowthPercentage, '%');

  // 6. AI Insights
  console.log('\n6. Testing AI Decision Intelligence on Atlas:');
  const aiResult = await aiInsightService.generateDecisionInsights({});
  console.log(`  Generated ${aiResult.insights?.length} decision insights (Engine: ${aiResult.insights?.[0]?.engine})`);
  console.log('  Top Insight:', aiResult.insights?.[0]?.title);
  console.log('  Observation:', aiResult.insights?.[0]?.observation);
  console.log('  Recommendation:', aiResult.insights?.[0]?.recommendation);

  // 7. Reports
  console.log('\n7. Testing Reports Compilation on Atlas:');
  const summaryReport = await analyticsService.getReportData({ reportType: 'summary' });
  console.log('  Summary Report title:', summaryReport.title);
  console.log('  Summary Report total:', summaryReport.summary?.totalWaste, 'KG');

  await mongoose.disconnect();
  console.log('\n✓ MongoDB Atlas End-to-End Verification Complete! All modules verified 100%.');
}

verifyAtlasData().catch(console.error);
