const WasteRecord = require('../models/WasteRecord');
const Location = require('../models/Location');

const RECYCLABLE_TYPES = ['Plastic', 'Paper', 'Metal', 'Glass'];

/**
 * Validates and constructs MongoDB match query from filters.
 * Throws an Error with descriptive message for invalid inputs.
 */
const buildMatchQuery = (filters = {}) => {
  const { startDate, endDate, location, wasteType } = filters;
  const match = {};

  if (startDate || endDate) {
    match.collectedAt = {};
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        throw new Error('Invalid startDate format');
      }
      match.collectedAt.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new Error('Invalid endDate format');
      }
      // If date string only has YYYY-MM-DD, set to end of that day (23:59:59.999Z)
      if (typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
        end.setUTCHours(23, 59, 59, 999);
      }
      match.collectedAt.$lte = end;
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(match.collectedAt.$lte);
      if (start > end) {
        throw new Error('startDate cannot be after endDate');
      }
    }
  }

  if (location && typeof location === 'string' && location.trim() !== '') {
    match.location = location.trim();
  }

  if (wasteType && typeof wasteType === 'string' && wasteType.trim() !== '') {
    match.wasteType = wasteType.trim();
  }

  return match;
};

/**
 * Get analytics summary statistics.
 */
const getSummary = async (filters = {}) => {
  const matchQuery = buildMatchQuery(filters);

  const [result] = await WasteRecord.aggregate([
    { $match: matchQuery },
    {
      $facet: {
        totalStats: [
          {
            $group: {
              _id: null,
              totalWaste: { $sum: '$quantity' },
              recordCount: { $sum: 1 },
              minDate: { $min: '$collectedAt' },
              maxDate: { $max: '$collectedAt' }
            }
          }
        ],
        recyclableStats: [
          {
            $match: { wasteType: { $in: RECYCLABLE_TYPES } }
          },
          {
            $group: {
              _id: null,
              recyclableWaste: { $sum: '$quantity' }
            }
          }
        ],
        highestLocation: [
          {
            $group: {
              _id: '$location',
              total: { $sum: '$quantity' }
            }
          },
          { $sort: { total: -1 } },
          { $limit: 1 }
        ],
        highestCategory: [
          {
            $group: {
              _id: '$wasteType',
              total: { $sum: '$quantity' }
            }
          },
          { $sort: { total: -1 } },
          { $limit: 1 }
        ]
      }
    }
  ]);

  const totalStats = result?.totalStats?.[0] || { totalWaste: 0, recordCount: 0 };
  const totalWaste = totalStats.totalWaste || 0;
  const recordCount = totalStats.recordCount || 0;
  const recyclableWaste = result?.recyclableStats?.[0]?.recyclableWaste || 0;
  const topLocation = result?.highestLocation?.[0] || null;
  const topCategory = result?.highestCategory?.[0] || null;

  // Calculate recyclable percentage with division by zero safety
  const recyclablePercentage = totalWaste > 0
    ? Number(((recyclableWaste / totalWaste) * 100).toFixed(2))
    : 0;

  // Calculate Average Daily Waste
  let days = 1;
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    days = Math.max(1, diffDays);
  } else if (totalStats.minDate && totalStats.maxDate) {
    const minD = new Date(totalStats.minDate);
    const maxD = new Date(totalStats.maxDate);
    const diffDays = Math.ceil(Math.abs(maxD.getTime() - minD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    days = Math.max(1, diffDays);
  }
  const averageDailyWaste = totalWaste > 0 ? Number((totalWaste / days).toFixed(2)) : 0;

  // Calculate Growth
  const growthData = await getGrowth(filters);

  return {
    totalWaste,
    averageDailyWaste,
    growth: growthData.growthPercentage,
    growthPercentage: growthData.growthPercentage,
    recyclable: recyclableWaste,
    recyclableWaste,
    recyclablePercentage,
    topArea: topLocation ? { name: topLocation._id, total: topLocation.total } : null,
    highestWasteLocation: topLocation ? { name: topLocation._id, total: topLocation.total } : null,
    topCategory: topCategory ? { name: topCategory._id, total: topCategory.total } : null,
    highestWasteCategory: topCategory ? { name: topCategory._id, total: topCategory.total } : null,
    recordCount
  };
};

/**
 * Get waste quantity trends over time.
 */
const getTrends = async (filters = {}) => {
  const matchQuery = buildMatchQuery(filters);

  const trends = await WasteRecord.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$collectedAt' } },
        waste: { $sum: '$quantity' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        name: '$_id',
        waste: 1,
        count: 1
      }
    }
  ]);

  return trends;
};

/**
 * Get waste breakdown grouped by category/wasteType.
 */
const getCategories = async (filters = {}) => {
  const matchQuery = buildMatchQuery(filters);

  const categories = await WasteRecord.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$wasteType',
        total: { $sum: '$quantity' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);

  const totalAllCategories = categories.reduce((sum, item) => sum + item.total, 0);

  return categories.map((cat) => ({
    name: cat._id,
    wasteType: cat._id,
    value: cat.total,
    total: cat.total,
    count: cat.count,
    percentage: totalAllCategories > 0 ? Number(((cat.total / totalAllCategories) * 100).toFixed(2)) : 0
  }));
};

/**
 * Get waste breakdown grouped by location.
 */
const getLocations = async (filters = {}) => {
  const matchQuery = buildMatchQuery(filters);

  const locations = await WasteRecord.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$location',
        total: { $sum: '$quantity' },
        count: { $sum: 1 },
        avgQuantity: { $avg: '$quantity' }
      }
    },
    { $sort: { total: -1 } }
  ]);

  return locations.map((loc) => ({
    name: loc._id,
    location: loc._id,
    total: loc.total,
    count: loc.count,
    averagePerRecord: Number((loc.avgQuantity || 0).toFixed(2)),
    status: loc.total > 1000 ? 'High' : loc.total > 500 ? 'Medium' : 'Low'
  }));
};

/**
 * Compare waste volume for the selected period with the previous equivalent period.
 */
const getGrowth = async (filters = {}) => {
  const { startDate, endDate, location, wasteType } = filters;

  let currentStart, currentEnd, prevStart, prevEnd;

  if (startDate && endDate) {
    currentStart = new Date(startDate);
    currentEnd = new Date(endDate);
    if (typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
      currentEnd.setUTCHours(23, 59, 59, 999);
    }
    if (isNaN(currentStart.getTime()) || isNaN(currentEnd.getTime())) {
      throw new Error('Invalid date format');
    }
    if (currentStart > currentEnd) {
      throw new Error('startDate cannot be after endDate');
    }
    const duration = currentEnd.getTime() - currentStart.getTime();
    prevEnd = new Date(currentStart.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - duration);
  } else if (startDate) {
    currentStart = new Date(startDate);
    currentEnd = new Date();
    if (isNaN(currentStart.getTime())) {
      throw new Error('Invalid startDate format');
    }
    const duration = currentEnd.getTime() - currentStart.getTime();
    prevEnd = new Date(currentStart.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - duration);
  } else if (endDate) {
    currentEnd = new Date(endDate);
    if (typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
      currentEnd.setUTCHours(23, 59, 59, 999);
    }
    if (isNaN(currentEnd.getTime())) {
      throw new Error('Invalid endDate format');
    }
    const duration = 30 * 24 * 60 * 60 * 1000;
    currentStart = new Date(currentEnd.getTime() - duration);
    prevEnd = new Date(currentStart.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - duration);
  } else {
    // Default: past 30 days vs preceding 30 days
    currentEnd = new Date();
    const duration = 30 * 24 * 60 * 60 * 1000;
    currentStart = new Date(currentEnd.getTime() - duration);
    prevEnd = new Date(currentStart.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - duration);
  }

  const currentMatch = {
    collectedAt: { $gte: currentStart, $lte: currentEnd }
  };
  const prevMatch = {
    collectedAt: { $gte: prevStart, $lte: prevEnd }
  };

  if (location && typeof location === 'string' && location.trim() !== '') {
    currentMatch.location = location.trim();
    prevMatch.location = location.trim();
  }
  if (wasteType && typeof wasteType === 'string' && wasteType.trim() !== '') {
    currentMatch.wasteType = wasteType.trim();
    prevMatch.wasteType = wasteType.trim();
  }

  const [currentAgg, prevAgg] = await Promise.all([
    WasteRecord.aggregate([
      { $match: currentMatch },
      {
        $group: {
          _id: null,
          totalWaste: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      }
    ]),
    WasteRecord.aggregate([
      { $match: prevMatch },
      {
        $group: {
          _id: null,
          totalWaste: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const currentTotal = currentAgg?.[0]?.totalWaste || 0;
  const currentCount = currentAgg?.[0]?.count || 0;
  const prevTotal = prevAgg?.[0]?.totalWaste || 0;
  const prevCount = prevAgg?.[0]?.count || 0;

  // Division by zero safe calculation
  let growthPercentage = 0;
  if (prevTotal === 0) {
    growthPercentage = currentTotal > 0 ? 100.0 : 0.0;
  } else {
    growthPercentage = Number((((currentTotal - prevTotal) / prevTotal) * 100).toFixed(2));
  }

  const absoluteChange = currentTotal - prevTotal;

  let trend = 'stable';
  if (growthPercentage > 0) trend = 'increasing';
  else if (growthPercentage < 0) trend = 'decreasing';

  return {
    currentPeriod: {
      startDate: currentStart.toISOString(),
      endDate: currentEnd.toISOString(),
      totalWaste: currentTotal,
      recordCount: currentCount
    },
    previousPeriod: {
      startDate: prevStart.toISOString(),
      endDate: prevEnd.toISOString(),
      totalWaste: prevTotal,
      recordCount: prevCount
    },
    growthPercentage,
    absoluteChange,
    trend
  };
};

/**
 * Get geographic location intelligence with waste metrics and coordinates lookup.
 */
const getMapData = async (filters = {}) => {
  const matchQuery = buildMatchQuery(filters);

  // Group WasteRecords by location
  const wasteByLocation = await WasteRecord.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$location',
        totalWaste: { $sum: '$quantity' },
        recordCount: { $sum: 1 },
        avgQuantity: { $avg: '$quantity' }
      }
    }
  ]);

  const wasteMap = new Map();
  wasteByLocation.forEach((item) => {
    if (item._id) {
      wasteMap.set(item._id.trim().toLowerCase(), {
        originalName: item._id.trim(),
        totalWaste: item.totalWaste || 0,
        recordCount: item.recordCount || 0,
        avgQuantity: item.avgQuantity || 0
      });
    }
  });

  // Fetch registered locations from Location collection
  const registeredLocations = await Location.find().lean();
  const registeredMap = new Map();
  registeredLocations.forEach((loc) => {
    if (loc && loc.name) {
      registeredMap.set(loc.name.trim().toLowerCase(), loc);
    }
  });

  // Combine registered locations and any location names found in collection records
  const allLocationKeys = new Set([
    ...registeredLocations.map((l) => l.name.trim().toLowerCase()),
    ...wasteByLocation.map((w) => w._id.trim().toLowerCase())
  ]);

  // If a specific location filter was requested, filter keys accordingly
  if (filters.location && typeof filters.location === 'string' && filters.location.trim() !== '') {
    const locFilter = filters.location.trim().toLowerCase();
    Array.from(allLocationKeys).forEach((key) => {
      if (key !== locFilter) allLocationKeys.delete(key);
    });
  }

  const results = Array.from(allLocationKeys).map((key) => {
    const locDoc = registeredMap.get(key);
    const wasteData = wasteMap.get(key) || {
      originalName: locDoc?.name || key,
      totalWaste: 0,
      recordCount: 0,
      avgQuantity: 0
    };

    const displayName = locDoc?.name || wasteData.originalName || key;

    const hasCoords = Boolean(
      locDoc &&
      typeof locDoc.latitude === 'number' &&
      typeof locDoc.longitude === 'number' &&
      !isNaN(locDoc.latitude) &&
      !isNaN(locDoc.longitude)
    );

    const total = wasteData.totalWaste;
    // Clear data-driven priority rule:
    // HIGH: total waste > 1000 KG
    // MEDIUM: total waste between 500 KG and 1000 KG
    // LOW: total waste <= 500 KG
    const priority = total > 1000 ? 'HIGH' : total > 500 ? 'MEDIUM' : 'LOW';

    return {
      location: displayName,
      name: displayName,
      quantity: total,
      totalWaste: total,
      recordCount: wasteData.recordCount,
      avgQuantity: Number(wasteData.avgQuantity.toFixed(2)),
      areaType: locDoc?.areaType || 'Municipal Area',
      latitude: hasCoords ? locDoc.latitude : null,
      longitude: hasCoords ? locDoc.longitude : null,
      hasCoordinates: hasCoords,
      priority
    };
  });

  // Sort locations by highest waste volume descending
  results.sort((a, b) => b.totalWaste - a.totalWaste);

  return results;
};

/**
 * Generate predictive waste forecast using historical daily aggregations and linear trend analysis.
 */
const getForecast = async (filters = {}) => {
  const matchQuery = buildMatchQuery(filters);
  const forecastDays = Math.min(30, Math.max(1, parseInt(filters.forecastDays, 10) || 7));

  // Retrieve daily aggregated historical waste
  const dailyHistory = await WasteRecord.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$collectedAt' } },
        quantity: { $sum: '$quantity' },
        recordCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Data sufficiency evaluation
  if (!dailyHistory || dailyHistory.length === 0) {
    return {
      success: true,
      sufficient: false,
      message: 'No historical waste data is available for forecasting.',
      reason: 'No collection records were found matching the selected filters.',
      data: null
    };
  }

  if (dailyHistory.length < 2) {
    return {
      success: true,
      sufficient: false,
      message: 'Insufficient historical data to generate a reliable forecast.',
      reason: 'A minimum of 2 distinct historical collection dates is required to calculate baseline trend and variance.',
      data: null
    };
  }

  const n = dailyHistory.length;
  const quantities = dailyHistory.map((d) => d.quantity);
  const totalHistorical = quantities.reduce((acc, q) => acc + q, 0);
  const averageHistoricalWaste = Number((totalHistorical / n).toFixed(2));

  // Simple Linear Regression on historical sequence
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += quantities[i];
    sumXY += i * quantities[i];
    sumXX += i * i;
  }

  const slopeDenominator = n * sumXX - sumX * sumX;
  const slope = slopeDenominator !== 0 ? (n * sumXY - sumX * sumY) / slopeDenominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  // Exponential Weighted Moving Average (EWMA) for recent weighting
  let ewma = quantities[0];
  const alpha = 0.3;
  for (let i = 1; i < n; i++) {
    ewma = alpha * quantities[i] + (1 - alpha) * ewma;
  }

  // Generate Future Forecast Points
  const lastHistoricalDateStr = dailyHistory[n - 1]._id;
  const [lastY, lastM, lastD] = lastHistoricalDateStr.split('-').map(Number);
  const lastDate = new Date(Date.UTC(lastY, lastM - 1, lastD));

  const forecast = [];
  let totalForecast = 0;

  for (let k = 1; k <= forecastDays; k++) {
    const futureDate = new Date(lastDate);
    futureDate.setUTCDate(lastDate.getUTCDate() + k);
    const dateStr = futureDate.toISOString().split('T')[0];

    const rawLinear = slope * (n - 1 + k) + intercept;
    // Blend 70% linear trend + 30% EWMA to avoid negative or runaway divergence
    const predicted = Math.max(0, Number((0.7 * rawLinear + 0.3 * ewma).toFixed(2)));

    forecast.push({
      date: dateStr,
      predictedQuantity: predicted,
      quantity: predicted
    });

    totalForecast += predicted;
  }

  const averageForecastWaste = Number((totalForecast / forecastDays).toFixed(2));

  let expectedGrowthPercentage = 0;
  if (averageHistoricalWaste > 0) {
    expectedGrowthPercentage = Number(
      (((averageForecastWaste - averageHistoricalWaste) / averageHistoricalWaste) * 100).toFixed(1)
    );
  }

  // Determine Reliability tier
  let reliability = 'LOW';
  let reliabilityReason = 'Limited historical data points (2-4 dates). Trend projections may exhibit variance.';
  if (n >= 14) {
    reliability = 'HIGH';
    reliabilityReason = 'Sufficient historical data available across multiple operational periods.';
  } else if (n >= 5) {
    reliability = 'MEDIUM';
    reliabilityReason = 'Moderate historical data available (5-13 dates).';
  }

  // Build combined chart points for unified visualization
  const combinedChartData = [
    ...dailyHistory.map((d) => ({
      date: d._id,
      historical: d.quantity,
      forecast: null
    })),
    // Stitch the last historical point as starting anchor for the forecast line
    {
      date: lastHistoricalDateStr,
      historical: dailyHistory[n - 1].quantity,
      forecast: dailyHistory[n - 1].quantity
    },
    ...forecast.map((f) => ({
      date: f.date,
      historical: null,
      forecast: f.predictedQuantity
    }))
  ];

  // Planning Insight & Recommendations
  let insightText = `Waste collection volume is projected to remain relatively stable (growth of ${expectedGrowthPercentage}%).`;
  let recommendationText = 'Maintain standard vehicle routing and monitor daily station intake logs.';

  if (expectedGrowthPercentage > 10) {
    insightText = `Waste is expected to increase by approximately ${expectedGrowthPercentage}% during the next ${forecastDays} days.`;
    recommendationText = 'Consider reviewing collection vehicle capacity and bin transfer frequency for the selected zones.';
  } else if (expectedGrowthPercentage < -10) {
    insightText = `Waste is expected to decrease by approximately ${Math.abs(expectedGrowthPercentage)}% during the next ${forecastDays} days.`;
    recommendationText = 'Consider monitoring collection efficiency and reallocating surplus vehicle capacity to higher-density sectors.';
  }

  return {
    success: true,
    sufficient: true,
    message: 'Forecast generated successfully.',
    data: {
      method: `${forecastDays}-Day Linear Trend & Weighted Moving Average`,
      forecastDays,
      reliability,
      reliabilityReason,
      historicalPeriod: {
        startDate: dailyHistory[0]._id,
        endDate: dailyHistory[n - 1]._id,
        dataPointsCount: n
      },
      forecastPeriod: {
        startDate: forecast[0]?.date || '',
        endDate: forecast[forecast.length - 1]?.date || '',
        forecastDays
      },
      historical: dailyHistory.map((d) => ({ date: d._id, quantity: d.quantity })),
      forecast,
      combinedChartData,
      summary: {
        averageHistoricalWaste,
        averageForecastWaste,
        totalForecastWaste: Number(totalForecast.toFixed(2)),
        expectedGrowthPercentage,
        trend: expectedGrowthPercentage > 0 ? 'increasing' : expectedGrowthPercentage < 0 ? 'decreasing' : 'stable'
      },
      planningInsight: {
        insight: insightText,
        recommendation: recommendationText
      }
    }
  };
};

/**
 * Consolidated reporting service supporting summary, collection, category, location, alert, and forecast reports.
 */
const getReportData = async (filters = {}) => {
  const reportType = (filters.reportType || 'summary').toLowerCase();
  const matchQuery = buildMatchQuery(filters);

  // 1. Summary Report
  if (reportType === 'summary') {
    const [summary, categories, locations, growth] = await Promise.all([
      getSummary(filters),
      getCategories(filters),
      getLocations(filters),
      getGrowth(filters)
    ]);

    return {
      reportType: 'summary',
      title: 'Waste Management Summary Report',
      generatedAt: new Date().toISOString(),
      filters: {
        startDate: filters.startDate || 'All Time',
        endDate: filters.endDate || 'Present',
        location: filters.location || 'All Locations',
        wasteType: filters.wasteType || 'All Types'
      },
      summary,
      categories,
      locations,
      growth
    };
  }

  // 2. Collection Log Report (Detailed granular records)
  if (reportType === 'collection') {
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [records, totalCount] = await Promise.all([
      WasteRecord.find(matchQuery).sort({ collectedAt: -1 }).skip(skip).limit(limit).lean(),
      WasteRecord.countDocuments(matchQuery)
    ]);

    const formattedRecords = records.map((r) => ({
      _id: r._id,
      date: r.collectedAt ? new Date(r.collectedAt).toISOString().split('T')[0] : 'N/A',
      location: r.location,
      wasteType: r.wasteType,
      quantity: r.quantity,
      vehicle: r.vehicle || 'Unassigned',
      collector: r.collector || 'Unassigned'
    }));

    return {
      reportType: 'collection',
      title: 'Waste Collection Activity Report',
      generatedAt: new Date().toISOString(),
      filters: {
        startDate: filters.startDate || 'All Time',
        endDate: filters.endDate || 'Present',
        location: filters.location || 'All Locations',
        wasteType: filters.wasteType || 'All Types'
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      records: formattedRecords
    };
  }

  // 3. Category Report
  if (reportType === 'category') {
    const categories = await getCategories(filters);
    const totalWaste = categories.reduce((sum, c) => sum + c.total, 0);

    return {
      reportType: 'category',
      title: 'Material Category Composition Report',
      generatedAt: new Date().toISOString(),
      filters: {
        startDate: filters.startDate || 'All Time',
        endDate: filters.endDate || 'Present',
        location: filters.location || 'All Locations',
        wasteType: filters.wasteType || 'All Types'
      },
      totalWaste,
      categories
    };
  }

  // 4. Location Report
  if (reportType === 'location') {
    const locations = await getLocations(filters);
    const totalWaste = locations.reduce((sum, l) => sum + l.total, 0);

    return {
      reportType: 'location',
      title: 'Municipal Zone & Location Analysis Report',
      generatedAt: new Date().toISOString(),
      filters: {
        startDate: filters.startDate || 'All Time',
        endDate: filters.endDate || 'Present',
        location: filters.location || 'All Locations',
        wasteType: filters.wasteType || 'All Types'
      },
      totalWaste,
      locations
    };
  }

  // 5. Alert Report
  if (reportType === 'alert') {
    const alertService = require('./alertService');
    const alerts = await alertService.getAlerts(filters);

    return {
      reportType: 'alert',
      title: 'Operational Waste Management Alerts Report',
      generatedAt: new Date().toISOString(),
      filters: {
        startDate: filters.startDate || 'All Time',
        endDate: filters.endDate || 'Present',
        location: filters.location || 'All Locations',
        wasteType: filters.wasteType || 'All Types'
      },
      totalAlerts: alerts.length,
      alerts
    };
  }

  // 6. Forecast Report
  if (reportType === 'forecast') {
    const forecast = await getForecast(filters);

    return {
      reportType: 'forecast',
      title: 'Predictive Waste Forecast & Planning Report',
      generatedAt: new Date().toISOString(),
      filters: {
        startDate: filters.startDate || 'All Time',
        endDate: filters.endDate || 'Present',
        location: filters.location || 'All Locations',
        wasteType: filters.wasteType || 'All Types'
      },
      forecast
    };
  }

  throw new Error(`Unsupported report type: ${reportType}`);
};

module.exports = {
  buildMatchQuery,
  getSummary,
  getTrends,
  getCategories,
  getLocations,
  getGrowth,
  getMapData,
  getForecast,
  getReportData
};


