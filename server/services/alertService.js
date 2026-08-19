const WasteRecord = require('../models/WasteRecord');
const Alert = require('../models/Alert');
const { buildMatchQuery } = require('./analyticsService');

/**
 * Helper to determine time windows (current vs previous equivalent period).
 */
const getComparisonPeriods = (filters = {}) => {
  const { startDate, endDate } = filters;
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
    // Default: Past 30 days vs Preceding 30 days
    currentEnd = new Date();
    const duration = 30 * 24 * 60 * 60 * 1000;
    currentStart = new Date(currentEnd.getTime() - duration);
    prevEnd = new Date(currentStart.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - duration);
  }

  return { currentStart, currentEnd, prevStart, prevEnd };
};

/**
 * 1. Detect location-level waste growth alerts.
 */
const detectWasteGrowthAlerts = async (periods, filters) => {
  const { currentStart, currentEnd, prevStart, prevEnd } = periods;
  const currentMatch = { collectedAt: { $gte: currentStart, $lte: currentEnd } };
  const prevMatch = { collectedAt: { $gte: prevStart, $lte: prevEnd } };

  if (filters.location) {
    currentMatch.location = filters.location.trim();
    prevMatch.location = filters.location.trim();
  }
  if (filters.wasteType) {
    currentMatch.wasteType = filters.wasteType.trim();
    prevMatch.wasteType = filters.wasteType.trim();
  }

  const [currentLocs, prevLocs] = await Promise.all([
    WasteRecord.aggregate([
      { $match: currentMatch },
      { $group: { _id: '$location', total: { $sum: '$quantity' }, count: { $sum: 1 } } }
    ]),
    WasteRecord.aggregate([
      { $match: prevMatch },
      { $group: { _id: '$location', total: { $sum: '$quantity' }, count: { $sum: 1 } } }
    ])
  ]);

  const prevMap = new Map();
  prevLocs.forEach((l) => prevMap.set(l._id, l.total));

  const alerts = [];

  currentLocs.forEach((curr) => {
    const prev = prevMap.get(curr._id) || 0;
    let growth = 0;
    if (prev === 0 && curr.total > 50) {
      growth = 100;
    } else if (prev > 0) {
      growth = Number((((curr.total - prev) / prev) * 100).toFixed(1));
    }

    // Threshold evaluation:
    // HIGH: growth > 20%
    // MEDIUM: growth 10% - 20%
    // LOW: growth 5% - 10%
    if (growth >= 5 && curr.total >= 50) {
      let priority = 'LOW';
      if (growth > 20) priority = 'HIGH';
      else if (growth >= 10) priority = 'MEDIUM';

      alerts.push({
        _id: `growth_${curr._id}_${priority}`.toLowerCase().replace(/\s+/g, '_'),
        type: 'HIGH_WASTE_GROWTH',
        priority,
        title: `Significant Waste Growth in ${curr._id}`,
        location: curr._id,
        wasteType: filters.wasteType || 'All Types',
        currentQuantity: curr.total,
        previousQuantity: prev,
        growthPercentage: growth,
        message: `Waste volume in ${curr._id} increased by ${growth}% compared with the previous monitoring period.`,
        observation: `Current volume recorded at ${curr.total.toLocaleString()} KG (previously ${prev.toLocaleString()} KG).`,
        recommendation:
          priority === 'HIGH'
            ? 'Review and increase collection frequency in this area; deploy additional capacity.'
            : 'Monitor zone collection trends and optimize collection truck dispatch schedules.',
        detectedAt: currentEnd.toISOString(),
        status: 'ACTIVE'
      });
    }
  });

  return alerts;
};

/**
 * 2. Detect material category surge alerts.
 */
const detectCategoryAlerts = async (periods, filters) => {
  const { currentStart, currentEnd, prevStart, prevEnd } = periods;
  const currentMatch = { collectedAt: { $gte: currentStart, $lte: currentEnd } };
  const prevMatch = { collectedAt: { $gte: prevStart, $lte: prevEnd } };

  if (filters.location) {
    currentMatch.location = filters.location.trim();
    prevMatch.location = filters.location.trim();
  }
  if (filters.wasteType) {
    currentMatch.wasteType = filters.wasteType.trim();
    prevMatch.wasteType = filters.wasteType.trim();
  }

  const [currentCats, prevCats] = await Promise.all([
    WasteRecord.aggregate([
      { $match: currentMatch },
      { $group: { _id: '$wasteType', total: { $sum: '$quantity' }, count: { $sum: 1 } } }
    ]),
    WasteRecord.aggregate([
      { $match: prevMatch },
      { $group: { _id: '$wasteType', total: { $sum: '$quantity' }, count: { $sum: 1 } } }
    ])
  ]);

  const prevMap = new Map();
  prevCats.forEach((c) => prevMap.set(c._id, c.total));

  const alerts = [];

  currentCats.forEach((curr) => {
    const prev = prevMap.get(curr._id) || 0;
    let growth = 0;
    if (prev === 0 && curr.total > 50) {
      growth = 100;
    } else if (prev > 0) {
      growth = Number((((curr.total - prev) / prev) * 100).toFixed(1));
    }

    if (growth >= 15 && curr.total >= 60) {
      const priority = growth > 25 ? 'HIGH' : 'MEDIUM';

      let recommendation = 'Review material collection standards and storage capacities.';
      if (curr._id === 'Plastic') {
        recommendation = 'Consider increasing dedicated plastic-waste recovery bins and collection frequency.';
      } else if (curr._id === 'Organic') {
        recommendation = 'Review organic waste processing capacity and daily transfer intervals.';
      } else if (curr._id === 'E-waste') {
        recommendation = 'Schedule specialized hazardous e-waste handling and safe disposal pickup.';
      }

      alerts.push({
        _id: `category_${curr._id}_${priority}`.toLowerCase().replace(/\s+/g, '_'),
        type: 'CATEGORY_SURGE',
        priority,
        title: `${curr._id} Waste Surge Detected`,
        location: filters.location || 'Municipal Area',
        wasteType: curr._id,
        currentQuantity: curr.total,
        previousQuantity: prev,
        growthPercentage: growth,
        message: `${curr._id} waste increased by ${growth}% over the comparative period.`,
        observation: `${curr._id} collection reached ${curr.total.toLocaleString()} KG (up from ${prev.toLocaleString()} KG).`,
        recommendation,
        detectedAt: currentEnd.toISOString(),
        status: 'ACTIVE'
      });
    }
  });

  return alerts;
};

/**
 * 3. Detect high-waste location hotspots (zones contributing high fraction of total waste).
 */
const detectLocationHotspots = async (periods, filters) => {
  const { currentStart, currentEnd } = periods;
  const currentMatch = { collectedAt: { $gte: currentStart, $lte: currentEnd } };

  if (filters.location) currentMatch.location = filters.location.trim();
  if (filters.wasteType) currentMatch.wasteType = filters.wasteType.trim();

  const locAgg = await WasteRecord.aggregate([
    { $match: currentMatch },
    { $group: { _id: '$location', total: { $sum: '$quantity' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]);

  const totalAll = locAgg.reduce((sum, item) => sum + item.total, 0);
  const alerts = [];

  locAgg.forEach((loc) => {
    const share = totalAll > 0 ? (loc.total / totalAll) * 100 : 0;
    // Hotspot criteria: > 1,000 KG or > 35% of total municipal load
    if (loc.total >= 1000 || (share >= 35 && loc.total >= 200)) {
      const priority = loc.total >= 1000 ? 'HIGH' : 'MEDIUM';

      alerts.push({
        _id: `hotspot_${loc._id}`.toLowerCase().replace(/\s+/g, '_'),
        type: 'HIGH_WASTE_LOCATION',
        priority,
        title: `High-Density Waste Concentration in ${loc._id}`,
        location: loc._id,
        wasteType: filters.wasteType || 'All Types',
        currentQuantity: loc.total,
        previousQuantity: null,
        growthPercentage: null,
        message: `${loc._id} is generating a high concentration (${share.toFixed(1)}% of total load) of waste.`,
        observation: `Zone volume at ${loc.total.toLocaleString()} KG across ${loc.count} collection records.`,
        recommendation: 'Deploy high-capacity trucks (CARPE Heavy Truck) and evaluate secondary containment bins.',
        detectedAt: currentEnd.toISOString(),
        status: 'ACTIVE'
      });
    }
  });

  return alerts;
};

/**
 * 4. Detect sudden daily volume spikes (entries significantly above zone average).
 */
const detectWasteSpikeAlerts = async (periods, filters) => {
  const { currentStart, currentEnd } = periods;
  const match = { collectedAt: { $gte: currentStart, $lte: currentEnd } };

  if (filters.location) match.location = filters.location.trim();
  if (filters.wasteType) match.wasteType = filters.wasteType.trim();

  // Find location averages
  const locationStats = await WasteRecord.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$location',
        avgQuantity: { $avg: '$quantity' },
        maxQuantity: { $max: '$quantity' }
      }
    }
  ]);

  const statsMap = new Map();
  locationStats.forEach((s) => statsMap.set(s._id, s.avgQuantity));

  // Find spikes where a record > 2.0x average
  const spikes = await WasteRecord.find(match).sort({ quantity: -1 }).limit(10).lean();
  const alerts = [];
  const visitedLocations = new Set();

  spikes.forEach((record) => {
    const avg = statsMap.get(record.location) || 100;
    if (record.quantity >= avg * 1.8 && record.quantity >= 200 && !visitedLocations.has(record.location)) {
      visitedLocations.add(record.location);
      const spikeFactor = (record.quantity / avg).toFixed(1);
      const priority = record.quantity >= avg * 2.2 ? 'HIGH' : 'MEDIUM';

      alerts.push({
        _id: `spike_${record.location}_${record._id}`.toLowerCase().replace(/\s+/g, '_'),
        type: 'SUDDEN_SPIKE',
        priority,
        title: `Sudden Waste Volume Spike in ${record.location}`,
        location: record.location,
        wasteType: record.wasteType,
        currentQuantity: record.quantity,
        previousQuantity: Math.round(avg),
        growthPercentage: Math.round(((record.quantity - avg) / avg) * 100),
        message: `A single collection entry of ${record.quantity.toLocaleString()} KG was recorded in ${record.location} (${spikeFactor}x historical average).`,
        observation: `Typical collection average for ${record.location} is ${Math.round(avg).toLocaleString()} KG.`,
        recommendation: 'Investigate potential unsegregated commercial or bulk disposal events causing this spike.',
        detectedAt: record.collectedAt ? new Date(record.collectedAt).toISOString() : currentEnd.toISOString(),
        status: 'ACTIVE'
      });
    }
  });

  return alerts;
};

/**
 * Main service method to retrieve and synthesize all intelligent alerts.
 */
const getAlerts = async (filters = {}) => {
  const periods = getComparisonPeriods(filters);

  // Run alert detection sub-pipelines in parallel
  const [growthAlerts, categoryAlerts, hotspotAlerts, spikeAlerts, dbAlerts] = await Promise.all([
    detectWasteGrowthAlerts(periods, filters),
    detectCategoryAlerts(periods, filters),
    detectLocationHotspots(periods, filters),
    detectWasteSpikeAlerts(periods, filters),
    Alert.find().lean() // Fetch any persistent / seeded alerts
  ]);

  // Transform seeded DB alerts to standard structure
  const formattedDbAlerts = dbAlerts.map((dba) => ({
    _id: String(dba._id),
    type: dba.type || 'SYSTEM_ALERT',
    priority: dba.priority || 'MEDIUM',
    title: dba.message || 'System Operational Alert',
    location: dba.location || 'General',
    wasteType: 'All Types',
    currentQuantity: null,
    previousQuantity: null,
    growthPercentage: null,
    message: dba.message,
    observation: 'Direct telemetry / manual alert logged in system.',
    recommendation: 'Review operational alert details and dispatch maintenance team if necessary.',
    detectedAt: dba.createdAt ? new Date(dba.createdAt).toISOString() : new Date().toISOString(),
    status: dba.status || 'ACTIVE'
  }));

  // Combine and deduplicate alerts by deterministic fingerprint
  const combined = [
    ...growthAlerts,
    ...categoryAlerts,
    ...hotspotAlerts,
    ...spikeAlerts,
    ...formattedDbAlerts
  ];

  const uniqueAlertsMap = new Map();
  combined.forEach((alert) => {
    // If filter specified location, ensure it matches
    if (filters.location && alert.location && !alert.location.toLowerCase().includes(filters.location.toLowerCase()) && alert.location !== 'General') {
      return;
    }
    // If filter specified wasteType, ensure it matches
    if (filters.wasteType && alert.wasteType && alert.wasteType !== 'All Types' && alert.wasteType !== filters.wasteType) {
      return;
    }

    if (!uniqueAlertsMap.has(alert._id)) {
      uniqueAlertsMap.set(alert._id, alert);
    }
  });

  const finalAlerts = Array.from(uniqueAlertsMap.values());

  // Priority sorting: HIGH -> MEDIUM -> LOW, then newest detectedAt
  const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  finalAlerts.sort((a, b) => {
    const weightDiff = (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
    if (weightDiff !== 0) return weightDiff;
    return new Date(b.detectedAt) - new Date(a.detectedAt);
  });

  return finalAlerts;
};

/**
 * Resolve an alert by ID.
 */
const resolveAlertById = async (alertId) => {
  // If it's a MongoDB ObjectId in the Alert collection
  try {
    const alert = await Alert.findById(alertId);
    if (alert) {
      alert.status = 'RESOLVED';
      await alert.save();
      return alert;
    }
  } catch {
    // ID was a dynamic alert identifier
  }

  return { _id: alertId, status: 'RESOLVED', message: 'Alert resolved' };
};

module.exports = {
  getAlerts,
  detectWasteGrowthAlerts,
  detectCategoryAlerts,
  detectLocationHotspots,
  detectWasteSpikeAlerts,
  resolveAlertById
};
