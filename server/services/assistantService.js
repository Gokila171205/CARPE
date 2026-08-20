const WasteRecord = require('../models/WasteRecord');
const Vehicle = require('../models/Vehicle');
const Location = require('../models/Location');
const Alert = require('../models/Alert');
const analyticsService = require('./analyticsService');
const alertService = require('./alertService');

/**
 * Normalizes text for regex/keyword matching.
 */
const normalize = (text = '') => text.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ').replace(/\s+/g, ' ');

/**
 * Checks if a message is a greeting.
 */
const isGreeting = (text) => {
  const norm = normalize(text);
  const words = norm.split(' ').filter(Boolean);
  
  // Single or short word greetings
  const greetingWords = [
    'hi', 'hello', 'hey', 'hii', 'hiii', 'heyy', 'hola', 'howdy', 'sup', 'yo',
    'vanakkam', 'வணக்கம்', 'namaste', 'greetings'
  ];
  
  if (words.length <= 3 && words.some((w) => greetingWords.includes(w))) {
    return true;
  }

  const greetingPhrases = [
    'good morning', 'good afternoon', 'good evening', 'good day',
    'காலை வணக்கம்', 'மாலை வணக்கம்', 'மதிய வணக்கம்'
  ];

  return greetingPhrases.some((phrase) => norm.includes(phrase));
};

/**
 * Checks if a message is casual courtesy chat.
 */
const isCasualCourtesy = (text) => {
  const norm = normalize(text);
  const courtesyPhrases = [
    'thank you', 'thanks', 'thank u', 'thx', 'நன்றி',
    'ok', 'okay', 'great', 'awesome', 'super', 'nice', 'got it',
    'bye', 'goodbye', 'see you', 'take care'
  ];
  const words = norm.split(' ').filter(Boolean);
  return words.length <= 4 && courtesyPhrases.some((phrase) => norm === phrase || norm.startsWith(phrase));
};

/**
 * Checks if a message asks about capabilities.
 */
const isCapabilitiesQuery = (text) => {
  const norm = normalize(text);
  return (
    norm.includes('what can you do') ||
    norm.includes('what do you do') ||
    norm.includes('how can you help') ||
    norm.includes('who are you') ||
    norm.includes('help me') ||
    norm.includes('what are your features') ||
    norm.includes('என்ன செய்ய முடியும்') ||
    norm.includes('உதவி')
  );
};

/**
 * Extracts a date range filter based on keywords in the message.
 */
const extractDateRange = (msg) => {
  const text = normalize(msg);
  const now = new Date();

  // Today
  if (text.includes('today') || text.includes('இன்று') || text.includes('இன்றைய')) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      labelEn: 'today',
      labelTa: 'இன்று'
    };
  }

  // This Week (last 7 days)
  if (
    text.includes('this week') ||
    text.includes('past week') ||
    text.includes('last 7 days') ||
    text.includes('இந்த வாரம்') ||
    text.includes('கடந்த வாரம்')
  ) {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      labelEn: 'this week',
      labelTa: 'இந்த வாரம்'
    };
  }

  // This Month (last 30 days)
  if (
    text.includes('this month') ||
    text.includes('past month') ||
    text.includes('last 30 days') ||
    text.includes('இந்த மாதம்') ||
    text.includes('கடந்த மாதம்')
  ) {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      labelEn: 'this month',
      labelTa: 'இந்த மாதம்'
    };
  }

  return { startDate: null, endDate: null, labelEn: 'all time', labelTa: 'அனைத்து காலம்' };
};

/**
 * Detects known locations from message or conversational history.
 */
const detectLocation = async (msg, history = []) => {
  const text = normalize(msg);
  let dbLocations = [];
  try {
    dbLocations = await Location.find({}, 'name').lean();
  } catch (err) {
    console.error('Error fetching locations:', err.message);
  }

  const checkTextForLoc = (targetText) => {
    const norm = normalize(targetText);
    for (const loc of dbLocations) {
      if (norm.includes(loc.name.toLowerCase())) return loc.name;
    }
    const common = [
      'anna nagar',
      'velachery',
      'adyar',
      't nagar',
      'guindy',
      'tambaram',
      'mylapore',
      'porur',
      'ambattur',
      'kallackurichi',
      'villupuram',
      'ammapet',
      'chrompet'
    ];
    for (const name of common) {
      if (norm.includes(name)) {
        if (name === 't nagar') return 'T Nagar';
        if (name === 'anna nagar') return 'Anna Nagar';
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }
    return null;
  };

  // 1. Check current message first
  const directLoc = checkTextForLoc(msg);
  if (directLoc) return directLoc;

  // 2. If message uses anaphoric pronouns ("there", "that place", "it", "why is it high", etc.)
  const hasPronoun =
    text.includes('there') ||
    text.includes('that area') ||
    text.includes('that place') ||
    text.includes('that location') ||
    text.includes('it') ||
    text.includes('those') ||
    text.includes('அங்கு') ||
    text.includes('அந்த இடம்') ||
    text.includes('அந்த பகுதி') ||
    text.includes('அங்கே');

  if (hasPronoun && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const hText = history[i].content || history[i].text || '';
      const locInHistory = checkTextForLoc(hText);
      if (locInHistory) return locInHistory;
    }
  }

  return null;
};

/**
 * Detects known waste types from message or conversational history.
 */
const detectWasteType = (msg, history = []) => {
  const checkTextForType = (text) => {
    const norm = normalize(text);
    if (norm.includes('plastic') || norm.includes('பிளாஸ்டிக்') || norm.includes('நெகிழி')) return 'Plastic';
    if (norm.includes('organic') || norm.includes('bio') || norm.includes('உயிர்') || norm.includes('இயற்கை') || norm.includes('மக்கும்')) return 'Organic';
    if (norm.includes('paper') || norm.includes('காகிதம்')) return 'Paper';
    if (norm.includes('metal') || norm.includes('உலோகம்')) return 'Metal';
    if (norm.includes('glass') || norm.includes('கண்ணாடி')) return 'Glass';
    if (norm.includes('e waste') || norm.includes('ewaste') || norm.includes('மின் கழிவு')) return 'E-waste';
    return null;
  };

  const directType = checkTextForType(msg);
  if (directType) return directType;

  // Check history if pronoun is used
  const norm = normalize(msg);
  if ((norm.includes('it') || norm.includes('that waste') || norm.includes('அந்த கழிவு')) && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const hText = history[i].content || history[i].text || '';
      const typeInHist = checkTextForType(hText);
      if (typeInHist) return typeInHist;
    }
  }

  return null;
};

/**
 * Detects specific vehicle numbers from message or conversational history.
 */
const detectVehicle = async (msg, history = []) => {
  const checkTextForVeh = async (text) => {
    const norm = normalize(text);
    try {
      const vehicles = await Vehicle.find({}, 'vehicleNumber').lean();
      for (const v of vehicles) {
        if (norm.includes(v.vehicleNumber.toLowerCase())) return v.vehicleNumber;
      }
    } catch (err) {
      console.error('Error detecting vehicle:', err.message);
    }

    const matchCarpe = text.match(/carpe-veh-?\d+/i);
    if (matchCarpe) return matchCarpe[0].toUpperCase();

    const matchTN = text.match(/tn[-\s]?\d{2}[-\s]?[a-z]{1,2}[-\s]?\d{4}/i);
    if (matchTN) return matchTN[0].toUpperCase();

    return null;
  };

  const directVeh = await checkTextForVeh(msg);
  if (directVeh) return directVeh;

  const norm = normalize(msg);
  if ((norm.includes('that vehicle') || norm.includes('the truck') || norm.includes('அந்த வாகனம்')) && history.length > 0) {
    for (let i = history.length - 1; i >= 0; i--) {
      const hText = history[i].content || history[i].text || '';
      const vehInHist = await checkTextForVeh(hText);
      if (vehInHist) return vehInHist;
    }
  }

  return null;
};

/**
 * Resolves user intent and queries MongoDB ONLY when data is actually needed.
 */
const retrieveRelevantData = async (message, history = []) => {
  const text = normalize(message);

  // 1. Casual Greeting (DO NOT run MongoDB queries)
  if (isGreeting(message)) {
    return {
      intent: 'CASUAL_GREETING',
      data: null
    };
  }

  // 2. Casual Courtesy (DO NOT run MongoDB queries)
  if (isCasualCourtesy(message)) {
    return {
      intent: 'CASUAL_COURTESY',
      data: null
    };
  }

  // 3. Capabilities / Help (DO NOT run MongoDB queries)
  if (isCapabilitiesQuery(message)) {
    return {
      intent: 'CAPABILITIES',
      data: null
    };
  }

  // 4. General CARPE system definition
  if (
    text.includes('what is carpe') ||
    text.includes('about carpe') ||
    text.includes('explain carpe') ||
    text.includes('how does carpe work') ||
    text.includes('கார்பே என்றால் என்ன') ||
    text.includes('கார்பே பற்றி')
  ) {
    return {
      intent: 'GENERAL_CARPE',
      data: {
        systemName: 'CARPE — Solid Waste Management Information & Decision Support System',
        purpose:
          'Municipal decision support platform for Tamil Nadu solid waste monitoring, route tracking, alert management, and predictive forecasting.'
      }
    };
  }

  // --- DATA / ANALYTICS INTENTS: Require MongoDB context ---
  const dateRange = extractDateRange(message);
  const detectedLoc = await detectLocation(message, history);
  const detectedType = detectWasteType(message, history);
  const detectedVeh = await detectVehicle(message, history);

  const filters = {};
  if (dateRange.startDate) {
    filters.startDate = dateRange.startDate;
    filters.endDate = dateRange.endDate;
  }
  if (detectedLoc) filters.location = detectedLoc;
  if (detectedType) filters.wasteType = detectedType;

  // 5. Specific Vehicle History & Metrics
  if (detectedVeh) {
    const vehicleDoc = await Vehicle.findOne({
      vehicleNumber: new RegExp('^' + detectedVeh + '$', 'i')
    }).lean();

    const records = await WasteRecord.find({
      vehicle: new RegExp('^' + detectedVeh + '$', 'i')
    })
      .sort({ collectedAt: -1 })
      .limit(10)
      .lean();

    const totalCollected = await WasteRecord.aggregate([
      { $match: { vehicle: new RegExp('^' + detectedVeh + '$', 'i') } },
      { $group: { _id: null, totalKG: { $sum: '$quantity' }, count: { $sum: 1 } } }
    ]);

    return {
      intent: 'VEHICLE_DETAILS',
      data: {
        vehicleNumber: detectedVeh,
        vehicleDetails: vehicleDoc || null,
        totalCollectedKG: totalCollected[0]?.totalKG || 0,
        tripsCount: totalCollected[0]?.count || 0,
        recentCollections: records.map((r) => ({
          location: r.location,
          wasteType: r.wasteType,
          quantity: r.quantity,
          date: r.collectedAt
        }))
      }
    };
  }

  // 6. Multi-turn Follow-up: "Which vehicle was responsible for those collections / in that location?"
  if (
    (text.includes('vehicle') || text.includes('truck') || text.includes('வாகனம்')) &&
    (text.includes('responsible') || text.includes('collected there') || text.includes('assigned') || detectedLoc)
  ) {
    const matchQuery = detectedLoc
      ? { location: new RegExp('^' + detectedLoc + '$', 'i') }
      : {};
    if (detectedType) matchQuery.wasteType = detectedType;

    const vehiclesInLoc = await WasteRecord.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$vehicle', totalKG: { $sum: '$quantity' }, trips: { $sum: 1 } } },
      { $sort: { totalKG: -1 } }
    ]);

    return {
      intent: 'LOCATION_VEHICLES',
      data: {
        location: detectedLoc || 'Monitored Sector',
        wasteType: detectedType || 'All Types',
        vehicles: vehiclesInLoc.map((v) => ({
          vehicleNumber: v._id,
          totalKG: v.totalKG,
          trips: v.trips
        }))
      }
    };
  }

  // 7. Vehicles Overview / Active Vehicles / Top Vehicle
  if (
    text.includes('vehicle') ||
    text.includes('truck') ||
    text.includes('fleet') ||
    text.includes('வாகனம்') ||
    text.includes('வாகனங்கள்')
  ) {
    const allVehicles = await Vehicle.find({}).lean();
    const activeVehicles = allVehicles.filter((v) => v.status === 'Active');

    const topVehicleAgg = await WasteRecord.aggregate([
      { $group: { _id: '$vehicle', totalKG: { $sum: '$quantity' }, trips: { $sum: 1 } } },
      { $sort: { totalKG: -1 } },
      { $limit: 5 }
    ]);

    return {
      intent: 'VEHICLES_OVERVIEW',
      data: {
        totalVehicles: allVehicles.length,
        activeCount: activeVehicles.length,
        maintenanceCount: allVehicles.filter((v) => v.status === 'Maintenance').length,
        inactiveCount: allVehicles.filter((v) => v.status === 'Inactive').length,
        topVehiclesByVolume: topVehicleAgg.map((v) => ({
          vehicleNumber: v._id,
          totalKG: v.totalKG,
          trips: v.trips
        })),
        vehiclesList: allVehicles.map((v) => ({
          number: v.vehicleNumber,
          type: v.vehicleType,
          status: v.status,
          assignedArea: v.assignedArea
        }))
      }
    };
  }

  // 8. Multi-turn Follow-up: "Why is it high?" / "Why is Anna Nagar high?"
  if (
    (text.includes('why') || text.includes('reason') || text.includes('cause') || text.includes('ஏன்')) &&
    (text.includes('high') || text.includes('highest') || text.includes('அதிகம்') || text.includes('அதிகமாக') || detectedLoc)
  ) {
    const targetLoc = detectedLoc || 'Anna Nagar';
    const locSummary = await WasteRecord.aggregate([
      { $match: { location: new RegExp('^' + targetLoc + '$', 'i') } },
      {
        $group: {
          _id: null,
          totalKG: { $sum: '$quantity' },
          count: { $sum: 1 },
          avgKG: { $avg: '$quantity' }
        }
      }
    ]);

    const locCategories = await WasteRecord.aggregate([
      { $match: { location: new RegExp('^' + targetLoc + '$', 'i') } },
      { $group: { _id: '$wasteType', totalKG: { $sum: '$quantity' }, trips: { $sum: 1 } } },
      { $sort: { totalKG: -1 } }
    ]);

    const locAlerts = await Alert.find({
      location: new RegExp('^' + targetLoc + '$', 'i'),
      status: 'ACTIVE'
    }).lean();

    return {
      intent: 'WHY_HIGH_ANALYSIS',
      data: {
        location: targetLoc,
        totalKG: locSummary[0]?.totalKG || 0,
        tripsCount: locSummary[0]?.count || 0,
        averagePerTripKG: Math.round(locSummary[0]?.avgKG || 0),
        dominantCategories: locCategories.map((c) => ({
          wasteType: c._id,
          totalKG: c.totalKG,
          trips: c.trips
        })),
        alerts: locAlerts.map((a) => a.message)
      }
    };
  }

  // 9. Comparison Queries ("Compare top locations", "compare locations", "location comparison", "ஒப்பிடு")
  if (
    text.includes('compare') ||
    text.includes('comparison') ||
    text.includes('table') ||
    text.includes('top 5') ||
    text.includes('top locations') ||
    text.includes('ஒப்பிடு') ||
    text.includes('அட்டவணை')
  ) {
    const locationsRanked = await WasteRecord.aggregate([
      { $group: { _id: '$location', totalKG: { $sum: '$quantity' }, trips: { $sum: 1 } } },
      { $sort: { totalKG: -1 } },
      { $limit: 6 }
    ]);

    return {
      intent: 'COMPARE_LOCATIONS',
      data: {
        locations: locationsRanked.map((l) => ({
          name: l._id,
          totalKG: l.totalKG,
          trips: l.trips
        }))
      }
    };
  }

  // 10. Recommendations ("What would you recommend?", "What should we do?", "suggestions")
  if (
    text.includes('recommend') ||
    text.includes('what should we do') ||
    text.includes('what to do') ||
    text.includes('action') ||
    text.includes('improve') ||
    text.includes('suggestion') ||
    text.includes('பரிந்துரை') ||
    text.includes('என்ன செய்ய வேண்டும்') ||
    text.includes('மேம்படுத்த')
  ) {
    const targetLoc = detectedLoc || (await analyticsService.getLocations(filters))[0]?.name || 'Anna Nagar';
    const summary = await analyticsService.getSummary(filters);
    const alerts = await alertService.getAlerts(filters);

    return {
      intent: 'RECOMMENDATIONS',
      data: {
        targetLocation: targetLoc,
        summary,
        topAlerts: alerts.slice(0, 3),
        recyclablePercentage: summary.recyclablePercentage
      }
    };
  }

  // 11. Highest Waste Location
  if (
    text.includes('highest waste') ||
    text.includes('most waste') ||
    text.includes('highest collection') ||
    text.includes('highest volume') ||
    text.includes('most generated') ||
    text.includes('அதிக கழிவு') ||
    text.includes('அதிகமாக சேகரி') ||
    text.includes('அதிகமான கழிவு')
  ) {
    const locationsRanked = await WasteRecord.aggregate([
      { $group: { _id: '$location', totalKG: { $sum: '$quantity' }, trips: { $sum: 1 } } },
      { $sort: { totalKG: -1 } }
    ]);

    return {
      intent: 'HIGHEST_WASTE_LOCATION',
      data: {
        topLocation: locationsRanked[0]
          ? { name: locationsRanked[0]._id, totalKG: locationsRanked[0].totalKG, trips: locationsRanked[0].trips }
          : null,
        rankings: locationsRanked.slice(0, 5).map((l) => ({
          name: l._id,
          totalKG: l.totalKG,
          trips: l.trips
        }))
      }
    };
  }

  // 12. Context-Aware Location Category Details (e.g. "How much plastic in Anna Nagar?")
  if (detectedLoc && detectedType) {
    const locCatSummary = await WasteRecord.aggregate([
      {
        $match: {
          location: new RegExp('^' + detectedLoc + '$', 'i'),
          wasteType: detectedType
        }
      },
      {
        $group: {
          _id: null,
          totalKG: { $sum: '$quantity' },
          count: { $sum: 1 },
          avgKG: { $avg: '$quantity' }
        }
      }
    ]);

    return {
      intent: 'LOCATION_CATEGORY_DETAILS',
      data: {
        location: detectedLoc,
        wasteType: detectedType,
        totalKG: locCatSummary[0]?.totalKG || 0,
        recordsCount: locCatSummary[0]?.count || 0,
        avgPerRecord: Math.round(locCatSummary[0]?.avgKG || 0)
      }
    };
  }

  // 13. Specific Location Data
  if (detectedLoc) {
    const locSummary = await WasteRecord.aggregate([
      { $match: { location: new RegExp('^' + detectedLoc + '$', 'i') } },
      {
        $group: {
          _id: null,
          totalKG: { $sum: '$quantity' },
          count: { $sum: 1 },
          avgKG: { $avg: '$quantity' }
        }
      }
    ]);

    const locCategories = await WasteRecord.aggregate([
      { $match: { location: new RegExp('^' + detectedLoc + '$', 'i') } },
      { $group: { _id: '$wasteType', totalKG: { $sum: '$quantity' } } },
      { $sort: { totalKG: -1 } }
    ]);

    const locAlerts = await Alert.find({
      location: new RegExp('^' + detectedLoc + '$', 'i'),
      status: 'ACTIVE'
    }).lean();

    return {
      intent: 'LOCATION_DETAILS',
      data: {
        location: detectedLoc,
        totalKG: locSummary[0]?.totalKG || 0,
        recordsCount: locSummary[0]?.count || 0,
        averagePerTripKG: Math.round(locSummary[0]?.avgKG || 0),
        categoryBreakdown: locCategories.map((c) => ({
          wasteType: c._id,
          totalKG: c.totalKG
        })),
        activeAlerts: locAlerts.map((a) => ({
          type: a.type,
          priority: a.priority,
          message: a.message
        }))
      }
    };
  }

  // 14. Specific Waste Type Data
  if (detectedType) {
    const catSummary = await WasteRecord.aggregate([
      { $match: { wasteType: detectedType } },
      {
        $group: {
          _id: null,
          totalKG: { $sum: '$quantity' },
          count: { $sum: 1 }
        }
      }
    ]);

    const topLocationsForCategory = await WasteRecord.aggregate([
      { $match: { wasteType: detectedType } },
      { $group: { _id: '$location', totalKG: { $sum: '$quantity' } } },
      { $sort: { totalKG: -1 } },
      { $limit: 5 }
    ]);

    return {
      intent: 'CATEGORY_DETAILS',
      data: {
        wasteType: detectedType,
        totalKG: catSummary[0]?.totalKG || 0,
        recordsCount: catSummary[0]?.count || 0,
        topLocations: topLocationsForCategory.map((l) => ({
          location: l._id,
          totalKG: l.totalKG
        }))
      }
    };
  }

  // 15. Increasing waste category / Growth / Trends
  if (
    text.includes('increasing') ||
    text.includes('trend') ||
    text.includes('growth') ||
    text.includes('change') ||
    text.includes('அதிகரிக்கும்') ||
    text.includes('வளர்ச்சி') ||
    text.includes('போக்கு')
  ) {
    const growth = await analyticsService.getGrowth(filters);
    const categories = await analyticsService.getCategories(filters);

    return {
      intent: 'GROWTH_TRENDS',
      data: {
        growthPercentage: growth.growthPercentage,
        trend: growth.trend,
        currentPeriodWasteKG: growth.currentPeriod.totalWaste,
        previousPeriodWasteKG: growth.previousPeriod.totalWaste,
        categories: categories.slice(0, 5).map((c) => ({
          name: c.name,
          totalKG: c.total,
          percentage: c.percentage
        }))
      }
    };
  }

  // 16. Alerts & Attention Required
  if (
    text.includes('attention') ||
    text.includes('alert') ||
    text.includes('issue') ||
    text.includes('critical') ||
    text.includes('anomal') ||
    text.includes('கவனம்') ||
    text.includes('எச்சரிக்கை') ||
    text.includes('சிக்கல்')
  ) {
    const alerts = await alertService.getAlerts(filters);
    const topLocations = await analyticsService.getLocations(filters);
    const highWasteZones = topLocations.filter((l) => l.status === 'Critical' || l.status === 'High');

    return {
      intent: 'ALERTS_AND_ATTENTION',
      data: {
        activeAlertsCount: alerts.length,
        highPriorityAlerts: alerts.filter((a) => a.priority === 'HIGH'),
        allAlerts: alerts.slice(0, 6).map((a) => ({
          location: a.location,
          type: a.type,
          priority: a.priority,
          message: a.message,
          recommendation: a.recommendation
        })),
        criticalLocations: highWasteZones.map((z) => ({
          name: z.name,
          totalKG: z.total,
          status: z.status
        }))
      }
    };
  }

  // 17. Forecast / Predictions
  if (
    text.includes('forecast') ||
    text.includes('predict') ||
    text.includes('future') ||
    text.includes('expect') ||
    text.includes('முன்னறிவிப்பு') ||
    text.includes('கணிப்பு')
  ) {
    const forecast = await analyticsService.getForecast(filters);
    return {
      intent: 'FORECAST',
      data: forecast
    };
  }

  // 18. Explicit Summary Queries (ONLY when explicitly requested)
  if (
    text.includes('summary') ||
    text.includes('overview') ||
    text.includes('total waste') ||
    text.includes('statistics') ||
    text.includes('collections today') ||
    text.includes('சுருக்கம்') ||
    text.includes('மொத்த கழிவு')
  ) {
    const summary = await analyticsService.getSummary(filters);
    const topCategories = await analyticsService.getCategories(filters);
    const topLocations = await analyticsService.getLocations(filters);

    return {
      intent: 'SUMMARY',
      timeframe: dateRange,
      data: {
        totalWasteKG: summary.totalWaste,
        averageDailyWasteKG: summary.averageDailyWaste,
        recordCount: summary.recordCount,
        recyclablePercentage: summary.recyclablePercentage,
        highestWasteLocation: summary.highestWasteLocation,
        highestWasteCategory: summary.highestWasteCategory,
        topCategories: topCategories.slice(0, 3),
        topLocations: topLocations.slice(0, 3)
      }
    };
  }

  // 19. Default: Conversational Clarification (DO NOT dump database summary)
  return {
    intent: 'UNKNOWN_OR_CLARIFICATION',
    data: null
  };
};

/**
 * Deterministic Natural Language Generator in English and Tamil with rich Markdown & Table support.
 */
const generateDeterministicAnswer = (intentResult, userMessage, lang = 'en') => {
  const isTa = lang === 'ta';
  const { intent, data, timeframe } = intentResult;

  switch (intent) {
    case 'CASUAL_GREETING': {
      if (isTa) {
        return {
          answer:
            `வணக்கம்! 👋\n` +
            `நான் **கார்பே (CARPE) AI உதவியாளர்**. கழிவு சேகரிப்பு, மண்டலங்கள், வாகனங்கள் மற்றும் போக்குகளைப் பகுப்பாய்வு செய்ய நான் உங்களுக்கு உதவ முடியும்.\n\n` +
            `இன்று நான் உங்களுக்கு எவ்வாறு உதவலாம்?`,
          followUps: []
        };
      }
      return {
        answer:
          `Hello! 👋\n` +
          `I'm **CARPE AI Assistant**. I can help you analyze waste collection, locations, vehicles, trends and other CARPE data.\n\n` +
          `How can I help you today?`,
        followUps: []
      };
    }

    case 'CASUAL_COURTESY': {
      if (isTa) {
        return {
          answer: `மகிழ்ச்சி! உங்களுக்கு மேலும் ஏதேனும் உதவி தேவைப்பட்டால் தயங்காமல் கேளுங்கள்.`,
          followUps: []
        };
      }
      return {
        answer: `You're welcome! Let me know if you need any more analysis on CARPE waste operations.`,
        followUps: []
      };
    }

    case 'CAPABILITIES': {
      const followUps = isTa
        ? ['எந்த பகுதியில் அதிக கழிவுகள் சேகரிக்கப்பட்டுள்ளன?', 'அதிக கழிவு சேகரித்த வாகனம் எது?', 'எந்த இடங்களில் கவனம் தேவை?']
        : ['Which location has the highest waste?', 'Which vehicle collected the most waste?', 'Which locations need attention?'];

      if (isTa) {
        return {
          answer:
            `நான் **கார்பே (CARPE)** திடக் கழிவு மேலாண்மை நுண்ணறிவு உதவியாளர். நான் பின்வருவனவற்றில் உதவ முடியும்:\n\n` +
            `• **கழிவுப் பகுப்பாய்வு:** மண்டல வாரியாக மற்றும் வகை வாரியாக கழிவு அளவுகள்\n` +
            `• **வாகன நுண்ணறிவு:** வாகனங்களின் நிலை, சுமை மற்றும் பயணப் பதிவுகள்\n` +
            `• **செயல்பாட்டு எச்சரிக்கைகள்:** கழிவு குவிப்பு முரண்பாடுகள் மற்றும் உடனடி கவனம் தேவைப்படும் இடங்கள்\n` +
            `• **போக்குகள் & முன்னறிவிப்பு:** வளர்ச்சி விகிதங்கள் மற்றும் எதிர்காலக் கணிப்புகள்\n` +
            `• **கொள்கைப் பரிந்துரைகள்:** வாகன மறுஒதுக்கீடு மற்றும் மறுசுழற்சி மேம்பாடு`,
          followUps
        };
      }
      return {
        answer:
          `I am the **CARPE AI Decision Support Assistant**. Here is how I can help you:\n\n` +
          `• **Waste Analytics:** Query exact waste volumes by municipal sector and material stream\n` +
          `• **Vehicle Fleet Insights:** Track vehicle trip logs, load volumes, and active fleet status\n` +
          `• **Operational Alerts:** Identify volume surges and critical sectors requiring attention\n` +
          `• **Trend & Predictive Forecast:** Analyze period-over-period variance and future generation forecasts\n` +
          `• **Decision Recommendations:** Actionable guidance for vehicle reallocation and source-segregation`,
        followUps
      };
    }

    case 'GENERAL_CARPE': {
      const followUps = isTa
        ? ['எந்த பகுதியில் அதிக கழிவுகள் சேகரிக்கப்பட்டுள்ளன?', 'அதிக கழிவு சேகரித்த வாகனம் எது?', 'கழிவு சேகரிப்பு சுருக்கம்']
        : ['Which location has the highest waste?', 'Which vehicle collected the most waste?', 'Give me an executive summary'];

      if (isTa) {
        return {
          answer:
            `**கார்பே (CARPE)** என்பது தமிழ்நாடு நகராட்சி திடக் கழிவு மேலாண்மை தகவல் மற்றும் முடிவெடுக்கும் ஆதரவு அமைப்பாகும் (*Solid Waste Management Information & Decision Support System*).\n\n` +
            `இது கழிவு சேகரிப்பு, வாகன கண்காணிப்பு, மண்டல பகுப்பாய்வு, முன்கணிப்பு மற்றும் நிகழ்நேர எச்சரிக்கைகளை நிர்வகிக்க உதவுகிறது.`,
          followUps
        };
      }
      return {
        answer:
          `**CARPE** is the official **Solid Waste Management Information & Decision Support System** designed for Tamil Nadu municipal administration and policy optimization.\n\n` +
          `It monitors daily waste collections, vehicle fleets, geospatial distribution, predictive forecasts, and operational decision alerts across municipal sectors.`,
        followUps
      };
    }

    case 'HIGHEST_WASTE_LOCATION': {
      if (!data?.topLocation || data.rankings.length === 0) {
        return {
          answer: isTa
            ? 'கார்பே அமைப்பில் தற்போது எந்த கழிவு சேகரிப்பு பதிவுகளும் கிடைக்கவில்லை.'
            : "I don't have enough data in CARPE to determine the highest waste location.",
          followUps: []
        };
      }
      const top = data.topLocation;
      const topKg = Number(top.totalKG).toLocaleString();
      const followUps = isTa
        ? [`ஏன் ${top.name} பகுதியில் அதிகமாக உள்ளது?`, `${top.name} பகுதியில் எவ்வளவு பிளாஸ்டிக் சேகரிக்கப்பட்டது?`, `அனைத்து பகுதிகளையும் ஒப்பிடுக`]
        : [`Why is ${top.name} high?`, `How much plastic was collected in ${top.name}?`, `Compare the top 5 locations`];

      if (isTa) {
        let text = `**${top.name}** பகுதியில் அதிகபட்சமாக **${topKg} கிலோ** கழிவு சேகரிக்கப்பட்டு முதலிடத்தில் உள்ளது (${top.trips} சேகரிப்புகள்).\n\n`;
        text += `| இடம் | சேகரிக்கப்பட்ட கழிவு | பயணங்கள் |\n`;
        text += `| :--- | :--- | :--- |\n`;
        data.rankings.forEach((r) => {
          text += `| ${r.name} | **${Number(r.totalKG).toLocaleString()} KG** | ${r.trips} |\n`;
        });
        return { answer: text.trim(), followUps };
      }

      let text = `**${top.name}** currently has the highest recorded waste collection with **${topKg} KG** across ${top.trips} collection trips.\n\n`;
      text += `| Location | Waste Collected | Trips |\n`;
      text += `| :--- | :--- | :--- |\n`;
      data.rankings.forEach((r) => {
        text += `| ${r.name} | **${Number(r.totalKG).toLocaleString()} KG** | ${r.trips} |\n`;
      });
      return { answer: text.trim(), followUps };
    }

    case 'COMPARE_LOCATIONS': {
      const followUps = isTa
        ? ['எந்த பகுதியில் கவனம் தேவை?', 'அதிக கழிவு சேகரித்த வாகனம் எது?', 'கழிவு குறைப்பு பரிந்துரைகள்']
        : ['Which locations need attention?', 'Which vehicle collected the most waste?', 'What would you recommend?'];

      if (isTa) {
        let text = `**முக்கிய நகராட்சி மண்டலங்களின் கழிவு சேகரிப்பு ஒப்பீடு:**\n\n`;
        text += `| நகராட்சி மண்டலம் | மொத்த கழிவு (KG) | பதிவுகள் |\n`;
        text += `| :--- | :--- | :--- |\n`;
        data.locations.forEach((l) => {
          text += `| **${l.name}** | ${Number(l.totalKG).toLocaleString()} KG | ${l.trips} |\n`;
        });
        return { answer: text.trim(), followUps };
      }

      let text = `**Comparative Breakdown of Top Municipal Collection Zones:**\n\n`;
      text += `| Municipal Zone | Total Waste Collected | Collection Trips |\n`;
      text += `| :--- | :--- | :--- |\n`;
      data.locations.forEach((l) => {
        text += `| **${l.name}** | ${Number(l.totalKG).toLocaleString()} KG | ${l.trips} |\n`;
      });
      return { answer: text.trim(), followUps };
    }

    case 'WHY_HIGH_ANALYSIS': {
      const loc = data.location;
      const totalKg = Number(data.totalKG).toLocaleString();
      const topCat = data.dominantCategories[0]?.wasteType || 'General waste';
      const topCatKg = Number(data.dominantCategories[0]?.totalKG || 0).toLocaleString();
      const followUps = isTa
        ? [`${loc} பகுதிக்கு என்ன பரிந்துரைக்கிறீர்கள்?`, `${loc} பகுதியில் சேகரித்த வாகனங்கள் எவை?`, `அனைத்து பகுதிகளையும் ஒப்பிடுக`]
        : [`What should we do for ${loc}?`, `Which vehicles collected in ${loc}?`, `Compare top 5 locations`];

      if (isTa) {
        return {
          answer:
            `**${loc}** பகுதியில் கழிவு அதிகமாக இருப்பதற்கான முக்கிய காரணங்கள்:\n\n` +
            `1. **அதிக சேகரிப்பு அதிர்வெண்:** இப்பகுதியில் மொத்தம் **${data.tripsCount} சேகரிப்புப் பயணங்கள்** பதிவாகியுள்ளன (மொத்தம்: **${totalKg} KG**).\n` +
            `2. **முக்கிய கழிவுப் பிரிவு:** **${topCat}** வகைக் கழிவு அதிக அளவில் (**${topCatKg} KG**) குவிகிறது.\n` +
            `3. **செயல்பாட்டுக் காரணி:** வணிக மற்றும் குடியிருப்புப் பகுதிகளின் அடர்த்தி காரணமாக தொடர்ச்சியான கழிவு உருவாக்கம் உள்ளது.`,
          followUps
        };
      }

      return {
        answer:
          `**${loc}** has recorded elevated waste volumes due to the following operational factors:\n\n` +
          `• **High Collection Frequency:** A total of **${data.tripsCount} trips** were recorded in this zone (totaling **${totalKg} KG**, averaging ${data.averagePerTripKG} KG/trip).\n` +
          `• **Primary Waste Stream:** **${topCat}** represents the dominant material stream with **${topCatKg} KG**.\n` +
          `• **Commercial & Demographic Load:** Continuous municipal waste generation across high-density residential and commercial sectors in ${loc}.`,
        followUps
      };
    }

    case 'LOCATION_CATEGORY_DETAILS': {
      const totalKg = Number(data.totalKG).toLocaleString();
      const followUps = isTa
        ? [`${data.location} பகுதியில் சேகரித்த வாகனங்கள் எவை?`, `ஏன் ${data.location} பகுதியில் அதிகமாக உள்ளது?`, `பரிந்துரைகள் என்ன?`]
        : [`Which vehicles collected ${data.wasteType} in ${data.location}?`, `Why is ${data.location} high?`, `What would you recommend?`];

      if (data.recordsCount === 0 || data.totalKG === 0) {
        return {
          answer: isTa
            ? `**${data.location}** பகுதியில் **${data.wasteType}** வகைக் கழிவுக்கான பதிவுகள் எதுவும் தற்போது இல்லை.`
            : `No recorded collections found for **${data.wasteType}** in **${data.location}**.`,
          followUps
        };
      }

      if (isTa) {
        return {
          answer: `**${data.location}** பகுதியில் மொத்தம் **${totalKg} கிலோ ${data.wasteType}** கழிவு (${data.recordsCount} சேகரிப்புகள் மூலம்) பெறப்பட்டுள்ளது (சராசரியாக ${data.avgPerRecord} கிலோ/பயணம்).`,
          followUps
        };
      }

      return {
        answer: `A total of **${totalKg} KG** of **${data.wasteType}** waste was collected in **${data.location}** across ${data.recordsCount} recorded trips (averaging ${data.avgPerRecord} KG/trip).`,
        followUps
      };
    }

    case 'LOCATION_VEHICLES': {
      const loc = data.location;
      const followUps = isTa
        ? [`${loc} பகுதிக்கு என்ன பரிந்துரை செய்கிறீர்கள்?`, `அதிக கழிவு சேகரித்த வாகனம் எது?`, `கழிவு சேகரிப்பு சுருக்கம்`]
        : [`What would you recommend for ${loc}?`, `Which vehicle collected the most overall?`, `Give me an executive summary`];

      if (data.vehicles.length === 0) {
        return {
          answer: isTa
            ? `**${loc}** பகுதிக்கான வாகன சேகரிப்புப் பதிவுகள் எதுவும் கிடைக்கவில்லை.`
            : `No vehicle assignments recorded for collections in **${loc}**.`,
          followUps
        };
      }

      if (isTa) {
        let text = `**${loc} பகுதியில் கழிவு சேகரிப்பில் ஈடுபட்ட வாகனங்கள்:**\n\n`;
        text += `| வாகன எண் | சேகரித்த கழிவு | பயணங்கள் |\n`;
        text += `| :--- | :--- | :--- |\n`;
        data.vehicles.forEach((v) => {
          text += `| **${v.vehicleNumber}** | ${Number(v.totalKG).toLocaleString()} KG | ${v.trips} |\n`;
        });
        return { answer: text.trim(), followUps };
      }

      let text = `**Vehicles responsible for collections in ${loc}:**\n\n`;
      text += `| Vehicle Number | Total Waste Handled | Trips |\n`;
      text += `| :--- | :--- | :--- |\n`;
      data.vehicles.forEach((v) => {
        text += `| **${v.vehicleNumber}** | ${Number(v.totalKG).toLocaleString()} KG | ${v.trips} |\n`;
      });
      return { answer: text.trim(), followUps };
    }

    case 'LOCATION_DETAILS': {
      const totalKg = Number(data.totalKG).toLocaleString();
      const followUps = isTa
        ? [`ஏன் ${data.location} பகுதியில் அதிகமாக உள்ளது?`, `${data.location} பகுதியில் சேகரித்த வாகனங்கள் எவை?`, `பரிந்துரைகள் என்ன?`]
        : [`Why is ${data.location} high?`, `Which vehicles collected in ${data.location}?`, `What would you recommend for ${data.location}?`];

      if (data.recordsCount === 0 || data.totalKG === 0) {
        return {
          answer: isTa
            ? `${data.location} பகுதிக்கான கழிவு சேகரிப்பு பதிவுகள் எதுவும் தற்போது கார்பே அமைப்பில் இல்லை.`
            : `I don't have recorded collection data for **${data.location}** in CARPE.`,
          followUps: []
        };
      }

      if (isTa) {
        let text = `**${data.location}** பகுதியில் மொத்தம் **${totalKg} கிலோ** கழிவு (${data.recordsCount} சேகரிப்புகள்) பெறப்பட்டுள்ளது (சராசரி: ${data.averagePerTripKG} கிலோ/பயணம்).\n\n`;
        if (data.categoryBreakdown.length > 0) {
          text += `| கழிவு வகை | அளவு (KG) |\n| :--- | :--- |\n`;
          data.categoryBreakdown.forEach((c) => {
            text += `| ${c.wasteType} | **${Number(c.totalKG).toLocaleString()} KG** |\n`;
          });
        }
        return { answer: text.trim(), followUps };
      }

      let text = `A total of **${totalKg} KG** of waste has been recorded in **${data.location}** across ${data.recordsCount} collections (average **${data.averagePerTripKG} KG** per trip).\n\n`;
      if (data.categoryBreakdown.length > 0) {
        text += `| Material Stream | Total Collected |\n| :--- | :--- |\n`;
        data.categoryBreakdown.forEach((c) => {
          text += `| ${c.wasteType} | **${Number(c.totalKG).toLocaleString()} KG** |\n`;
        });
      }
      return { answer: text.trim(), followUps };
    }

    case 'CATEGORY_DETAILS': {
      const totalKg = Number(data.totalKG).toLocaleString();
      const followUps = isTa
        ? [`எந்த பகுதியில் அதிக ${data.wasteType} கழிவு சேகரிக்கப்பட்டது?`, `எந்த கழிவு வகை அதிகரித்து வருகிறது?`, `மறுசுழற்சி விகிதம் என்ன?`]
        : [`Which location generated the most ${data.wasteType}?`, `What waste category is increasing?`, `What is the recyclable rate?`];

      if (data.recordsCount === 0 || data.totalKG === 0) {
        return {
          answer: isTa
            ? `**${data.wasteType}** வகைக் கழிவுக்கான பதிவுகள் எதுவும் கிடைக்கவில்லை.`
            : `I don't have enough data in CARPE for **${data.wasteType}** waste.`,
          followUps: []
        };
      }

      if (isTa) {
        let text = `கார்பே அமைப்பில் மொத்தம் **${totalKg} கிலோ ${data.wasteType}** கழிவு ${data.recordsCount} பதிவுகளில் சேகரிக்கப்பட்டுள்ளது.\n\n`;
        if (data.topLocations.length > 0) {
          text += `| அதிக கழிவு உள்ள பகுதி | அளவு (KG) |\n| :--- | :--- |\n`;
          data.topLocations.forEach((l) => {
            text += `| ${l.location} | **${Number(l.totalKG).toLocaleString()} KG** |\n`;
          });
        }
        return { answer: text.trim(), followUps };
      }

      let text = `A total of **${totalKg} KG** of **${data.wasteType}** waste has been logged across ${data.recordsCount} records.\n\n`;
      if (data.topLocations.length > 0) {
        text += `| Contributing Zone | Volume Collected |\n| :--- | :--- |\n`;
        data.topLocations.forEach((l) => {
          text += `| **${l.location}** | **${Number(l.totalKG).toLocaleString()} KG** |\n`;
        });
      }
      return { answer: text.trim(), followUps };
    }

    case 'VEHICLE_DETAILS': {
      const v = data.vehicleDetails;
      const totalKg = Number(data.totalCollectedKG).toLocaleString();
      const followUps = isTa
        ? ['அதிக கழிவு சேகரித்த வாகனம் எது?', 'செயலில் உள்ள வாகனங்கள் எத்தனை?', 'வாகனங்களின் நிலை விவரம்']
        : ['Which vehicle collected the most waste?', 'How many vehicles are active?', 'Show vehicle fleet overview'];

      if (isTa) {
        let text = `வாகனம் **${data.vehicleNumber}** மொத்தம் **${totalKg} கிலோ** கழிவை (${data.tripsCount} பயணங்கள்) சேகரித்துள்ளது.\n\n`;
        if (v) {
          text += `• **வாகன வகை:** ${v.vehicleType}\n• **கொள்ளளவு:** ${v.capacity} KG\n• **தற்போதைய நிலை:** ${v.status}\n• **ஒதுக்கப்பட்ட பகுதி:** ${v.assignedArea || 'N/A'}`;
        }
        return { answer: text.trim(), followUps };
      }

      let text = `Vehicle **${data.vehicleNumber}** has transported a total of **${totalKg} KG** across ${data.tripsCount} recorded trips.\n\n`;
      if (v) {
        text += `• **Vehicle Type:** ${v.vehicleType}\n• **Payload Capacity:** ${v.capacity} KG\n• **Operational Status:** ${v.status}\n• **Assigned Zone:** ${v.assignedArea || 'Unassigned'}`;
      }
      return { answer: text.trim(), followUps };
    }

    case 'VEHICLES_OVERVIEW': {
      const top = data.topVehiclesByVolume[0];
      const followUps = isTa
        ? ['எந்த பகுதியில் அதிக கழிவு உள்ளது?', 'வாகன சுமை எச்சரிக்கைகள் உள்ளதா?', 'கழிவு சேகரிப்பு சுருக்கம்']
        : ['Which location has the highest waste?', 'Are there any vehicle capacity alerts?', 'Give me an executive summary'];

      if (isTa) {
        let text = `நகராட்சியில் மொத்தம் **${data.totalVehicles} வாகனங்கள்** பதிவு செய்யப்பட்டுள்ளன (**${data.activeCount} செயலில்**, **${data.maintenanceCount} பராமரிப்பில்**).\n\n`;
        if (top) {
          text += `அதிக கழிவு சேகரித்த வாகனம்: **${top.vehicleNumber}** (${Number(top.totalKG).toLocaleString()} KG, ${top.trips} பயணங்கள்).\n\n`;
        }
        if (data.topVehiclesByVolume.length > 0) {
          text += `| வாகன எண் | மொத்த கழிவு | பயணங்கள் |\n| :--- | :--- | :--- |\n`;
          data.topVehiclesByVolume.forEach((tv) => {
            text += `| **${tv.vehicleNumber}** | ${Number(tv.totalKG).toLocaleString()} KG | ${tv.trips} |\n`;
          });
        }
        return { answer: text.trim(), followUps };
      }

      let text = `There are **${data.totalVehicles} registered municipal vehicles** (**${data.activeCount} active**, **${data.maintenanceCount} in maintenance**).\n\n`;
      if (top) {
        text += `Top collection vehicle: **${top.vehicleNumber}** with **${Number(top.totalKG).toLocaleString()} KG** across ${top.trips} trips.\n\n`;
      }
      if (data.topVehiclesByVolume.length > 0) {
        text += `| Vehicle ID | Total Waste Handled | Completed Trips |\n| :--- | :--- | :--- |\n`;
        data.topVehiclesByVolume.forEach((tv) => {
          text += `| **${tv.vehicleNumber}** | ${Number(tv.totalKG).toLocaleString()} KG | ${tv.trips} |\n`;
        });
      }
      return { answer: text.trim(), followUps };
    }

    case 'GROWTH_TRENDS': {
      const sign = data.growthPercentage > 0 ? '+' : '';
      const topCat = data.categories[0];
      const followUps = isTa
        ? ['எந்த பகுதியில் கவனம் தேவை?', 'அடுத்த வார முன்கணிப்பு என்ன?', 'கழிவு சேகரிப்பு சுருக்கம்']
        : ['Which location needs more attention?', 'What waste trend should we expect next?', 'Give me an executive summary'];

      if (isTa) {
        let text = `தற்போதைய காலகட்டத்தில் கழிவு சேகரிப்பு வளர்ச்சி விகிதம் **${sign}${data.growthPercentage}%** ஆக உள்ளது (**${data.trend === 'UP' ? 'அதிகரிப்பு' : data.trend === 'DOWN' ? 'குறைவு' : 'நிலையானது'}**).\n\n`;
        if (topCat) {
          text += `முக்கிய பங்கு வகிக்கும் கழிவு வகை: **${topCat.name}** (${topCat.percentage}% - ${Number(topCat.totalKG).toLocaleString()} KG).\n\n`;
        }
        if (data.categories.length > 0) {
          text += `| கழிவு வகை | பங்கு (%) | அளவு (KG) |\n| :--- | :--- | :--- |\n`;
          data.categories.forEach((c) => {
            text += `| ${c.name} | ${c.percentage}% | ${Number(c.totalKG).toLocaleString()} KG |\n`;
          });
        }
        return { answer: text.trim(), followUps };
      }

      let text = `Waste generation is currently trending **${data.trend}** with a period-over-period variance of **${sign}${data.growthPercentage}%**.\n\n`;
      if (topCat) {
        text += `Primary material stream: **${topCat.name}** accounting for **${topCat.percentage}%** (${Number(topCat.totalKG).toLocaleString()} KG).\n\n`;
      }
      if (data.categories.length > 0) {
        text += `| Stream | Distribution (%) | Total Volume |\n| :--- | :--- | :--- |\n`;
        data.categories.forEach((c) => {
          text += `| **${c.name}** | ${c.percentage}% | ${Number(c.totalKG).toLocaleString()} KG |\n`;
        });
      }
      return { answer: text.trim(), followUps };
    }

    case 'ALERTS_AND_ATTENTION': {
      const followUps = isTa
        ? ['கழிவு குறைப்பு பரிந்துரைகள் என்ன?', 'எந்த பகுதியில் அதிக கழிவு உள்ளது?', 'வாகனங்களை எவ்வாறு ஒதுக்கலாம்?']
        : ['What would you recommend?', 'Which location has the highest waste?', 'How should we reallocate vehicles?'];

      if (data.activeAlertsCount === 0 && data.criticalLocations.length === 0) {
        return {
          answer: isTa
            ? 'அனைத்து நகராட்சி மண்டலங்களும் சீராக இயங்குகின்றன. செயலில் உள்ள அவசர எச்சரிக்கைகள் எதுவும் இல்லை.'
            : 'All municipal sectors are currently operating normally with zero active operational alerts.',
          followUps
        };
      }

      if (isTa) {
        let text = `தற்போது **${data.activeAlertsCount} செயல்பாட்டு எச்சரிக்கைகள்** செயலில் உள்ளன:\n\n`;
        data.allAlerts.forEach((a, idx) => {
          text += `**${idx + 1}. [${a.priority}] ${a.location}:** ${a.message}\n`;
          if (a.recommendation) text += `   *பரிந்துரை:* ${a.recommendation}\n`;
        });
        return { answer: text.trim(), followUps };
      }

      let text = `There are currently **${data.activeAlertsCount} active operational alerts** requiring administrative review:\n\n`;
      data.allAlerts.forEach((a, idx) => {
        text += `**${idx + 1}. [${a.priority}] ${a.location}:** ${a.message}\n`;
        if (a.recommendation) text += `   *Mandated Action:* ${a.recommendation}\n`;
      });
      return { answer: text.trim(), followUps };
    }

    case 'RECOMMENDATIONS': {
      const loc = data.targetLocation || 'High-volume sectors';
      const recycleRate = data.recyclablePercentage || 0;
      const followUps = isTa
        ? [`${loc} பகுதியில் சேகரித்த வாகனங்கள் எவை?`, 'எந்த கழிவு வகை அதிகரித்து வருகிறது?', 'முன்கணிப்பு என்ன?']
        : [`Which vehicles collected in ${loc}?`, 'What waste category is increasing?', 'What waste trend should we expect next?'];

      if (isTa) {
        return {
          answer:
            `**கார்பே தரவுகளின் அடிப்படையிலான கொள்கை மற்றும் செயல்பாட்டுப் பரிந்துரைகள்:**\n\n` +
            `1. **வாகன ஒதுக்கீடு:** அதிக கழிவு குவியும் **${loc}** பகுதிக்கு கூடுதல் சுமை வாகனங்களை அனுப்பி கழிவு தேங்குவதைத் தவிர்க்கவும்.\n` +
            `2. **மறுசுழற்சி விழிப்புணர்வு:** தற்போதைய மறுசுழற்சி விகிதம் **${recycleRate}%** ஆக உள்ளது. உலர் மற்றும் ஈரக் கழிவுகளை தொடக்க நிலையிலேயே பிரிப்பதை தீவிரப்படுத்தவும்.\n` +
            `3. **வழிகளை மேம்படுத்துதல்:** உச்ச நேரங்களில் போக்குவரத்து நெரிசலைத் தவிர்க்க மேப் பகுப்பாய்வு மூலம் வாகனப் பாதைகளை மறுசீரமைக்கவும்.`,
          followUps
        };
      }

      return {
        answer:
          `**Operational Decision Recommendations based on CARPE telemetry:**\n\n` +
          `1. **Dynamic Fleet Reallocation:** Deploy supplementary collection capacity towards **${loc}** during peak morning hours to prevent overflow.\n` +
          `2. **Source Segregation:** Current recyclable capture rate stands at **${recycleRate}%**. Intensify dry/wet segregation awareness campaigns in high-density residential wards.\n` +
          `3. **Route Optimization:** Utilize the CARPE Geospatial Map to adjust vehicle route timings and avoid traffic congestion corridors.`,
        followUps
      };
    }

    case 'FORECAST': {
      const followUps = isTa
        ? ['எந்த பகுதியில் அதிக கழிவு உள்ளது?', 'கழிவு சேகரிப்பு சுருக்கம்', 'பரிந்துரைகள் என்ன?']
        : ['Which location has the highest waste?', 'Give me an executive summary', 'What would you recommend?'];

      if (!data || !data.forecast || data.forecast.length === 0) {
        return {
          answer: isTa
            ? 'முன்கணிப்பு கணக்கீட்டிற்கான போதுமான தரவுகள் தற்போது இல்லை.'
            : 'Insufficient historical telemetry to calculate predictive forecast.',
          followUps
        };
      }

      const nextDay = data.forecast[0];
      if (isTa) {
        return {
          answer: `அடுத்த முன்னறிவிப்பு நாளுக்கான (**${nextDay.date}**) கணிக்கப்பட்ட கழிவு அளவு: சுமார் **${Math.round(nextDay.predictedWaste).toLocaleString()} KG**.`,
          followUps
        };
      }

      return {
        answer: `Predicted waste volume for the upcoming operational period (**${nextDay.date}**) is approximately **${Math.round(nextDay.predictedWaste).toLocaleString()} KG**.`,
        followUps
      };
    }

    case 'SUMMARY': {
      const timeLabel = isTa ? timeframe?.labelTa || 'அனைத்து காலம்' : timeframe?.labelEn || 'all time';
      const totalKg = Number(data.totalWasteKG || 0).toLocaleString();
      const avgKg = Number(data.averageDailyWasteKG || 0).toLocaleString();
      const topLocName = data.highestWasteLocation?.name || 'N/A';
      const topCatName = data.highestWasteCategory?.name || 'N/A';
      const followUps = isTa
        ? ['எந்த பகுதியில் அதிக கழிவுகள் சேகரிக்கப்பட்டுள்ளன?', 'அதிக கழிவு சேகரித்த வாகனம் எது?', 'எந்த கழிவு வகை அதிகரித்து வருகிறது?']
        : ['Which location has the highest waste?', 'Which vehicle collected the most waste?', 'What waste category is increasing?'];

      if (data.totalWasteKG === 0 && data.recordCount === 0) {
        return {
          answer: isTa
            ? `கார்பே அமைப்பில் ${timeLabel} காலகட்டத்திற்கு கழிவு சேகரிப்பு பதிவுகள் எதுவும் இல்லை.`
            : `No waste collection records found for **${timeLabel}** in CARPE.`,
          followUps: []
        };
      }

      if (isTa) {
        return {
          answer:
            `**கார்பே கழிவு சேகரிப்பு சுருக்கம் (${timeLabel}):**\n\n` +
            `• **மொத்த கழிவு:** ${totalKg} KG\n` +
            `• **மொத்த பதிவுகள்:** ${data.recordCount}\n` +
            `• **தினசரி சராசரி:** ${avgKg} KG\n` +
            `• **அதிக கழிவு உள்ள பகுதி:** ${topLocName}\n` +
            `• **முக்கிய கழிவு வகை:** ${topCatName}\n` +
            `• **மறுசுழற்சி விகிதம்:** ${data.recyclablePercentage || 0}%`,
          followUps
        };
      }

      return {
        answer:
          `**CARPE Waste Collection Executive Summary (${timeLabel}):**\n\n` +
          `• **Total Waste Handled:** ${totalKg} KG\n` +
          `• **Verified Records Logged:** ${data.recordCount}\n` +
          `• **Daily Average Telemetry:** ${avgKg} KG\n` +
          `• **Highest Volume Sector:** ${topLocName}\n` +
          `• **Dominant Waste Category:** ${topCatName}\n` +
          `• **Recyclable Stream Share:** ${data.recyclablePercentage || 0}%`,
        followUps
      };
    }

    case 'UNKNOWN_OR_CLARIFICATION':
    default: {
      const followUps = isTa
        ? ['எந்த பகுதியில் அதிக கழிவுகள் சேகரிக்கப்பட்டுள்ளன?', 'அதிக கழிவு சேகரித்த வாகனம் எது?', 'கழிவு சேகரிப்பு சுருக்கம்']
        : ['Which location has the highest waste?', 'Which vehicle collected the most waste?', 'Give me an executive summary'];

      if (isTa) {
        return {
          answer: `நான் **கார்பே (CARPE) AI உதவியாளர்**. கழிவு சேகரிப்பு, மண்டலங்கள், வாகனங்கள், போக்குகள் அல்லது எச்சரிக்கைகள் பற்றி நீங்கள் என்னிடம் கேட்கலாம். நான் எவ்வாறு உதவ முடியும்?`,
          followUps
        };
      }

      return {
        answer: `I'm **CARPE AI Assistant**. You can ask me about waste collection statistics, locations, vehicles, trends, forecasts, or operational alerts. How can I assist you?`,
        followUps
      };
    }
  }
};

/**
 * Invokes Gemini LLM if API Key is configured.
 */
const generateAIResponse = async (userMessage, history, structuredData, lang = 'en') => {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (
    !apiKey ||
    apiKey === '' ||
    apiKey === 'your_ai_api_key_here' ||
    apiKey === 'your_gemini_or_ai_api_key_optional'
  ) {
    return null;
  }

  // If casual greeting, don't run heavy prompt
  if (structuredData.intent === 'CASUAL_GREETING' || structuredData.intent === 'CASUAL_COURTESY') {
    return null;
  }

  const promptText = `
You are the official CARPE AI Assistant — Solid Waste Management Information & Decision Support System for Tamil Nadu Municipal Administration.

CORE RULES:
1. If the user is having casual conversation (e.g. "hi", "hello", "thanks"), respond politely and conversationally without displaying unnecessary database dumps.
2. If the user asks for data/analytics, answer accurately using ONLY the provided verified CARPE MongoDB snapshot.
3. DO NOT invent, hallucinate, or extrapolate statistics not supported by the data.
4. Format responses cleanly in Markdown:
   - Use bold for key values (e.g. **4,246 KG**).
   - Use Markdown tables when comparing locations or listing multi-attribute entities.
   - Use bullet points for recommendations and lists.
5. NEVER output raw tags like "svg", "<svg>", or "**svg**".
6. Respond in the requested language: ${lang === 'ta' ? 'TAMIL (தமிழ்)' : 'ENGLISH'}.

USER QUESTION:
"${userMessage}"

CONVERSATION HISTORY:
${JSON.stringify((history || []).slice(-6), null, 2)}

VERIFIED CARPE DATABASE SNAPSHOT:
${JSON.stringify(structuredData, null, 2)}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 900
          }
        }),
        signal: AbortSignal.timeout(7500)
      }
    );

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (rawText) {
        return rawText;
      }
    }
  } catch (err) {
    console.warn('Gemini AI Assistant call fallback triggered:', err.message);
  }

  return null;
};

/**
 * Main chat handler orchestrating conversational data retrieval, AI synthesis, and fallback.
 */
const processUserQuery = async ({ message, history = [], conversation = [], language = 'en' }) => {
  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Error('Message is required.');
  }

  const mergedHistory = conversation.length > 0 ? conversation : history;

  // 1. Retrieve targeted data from MongoDB with conversation history (or classify casual greetings without queries)
  const structuredData = await retrieveRelevantData(message, mergedHistory);

  // 2. Generate deterministic answer & smart follow-up suggestions
  const fallbackResult = generateDeterministicAnswer(structuredData, message, language);

  // 3. Attempt LLM generation if configured (only for non-greeting requests)
  let finalAnswer = fallbackResult.answer;
  if (structuredData.intent !== 'CASUAL_GREETING' && structuredData.intent !== 'CASUAL_COURTESY') {
    const aiAnswer = await generateAIResponse(message, mergedHistory, structuredData, language);
    if (aiAnswer) finalAnswer = aiAnswer;
  }

  const followUps = fallbackResult.followUps || [];

  return {
    answer: finalAnswer,
    data: structuredData.data || {},
    intent: structuredData.intent,
    followUps
  };
};

module.exports = {
  isGreeting,
  isCasualCourtesy,
  isCapabilitiesQuery,
  extractDateRange,
  detectLocation,
  detectWasteType,
  detectVehicle,
  retrieveRelevantData,
  generateDeterministicAnswer,
  processUserQuery
};
