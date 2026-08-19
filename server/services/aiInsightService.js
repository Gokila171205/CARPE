const analyticsService = require('./analyticsService');
const alertService = require('./alertService');

/**
 * Construct sanitized structured evidence payload from analytics & alerts.
 */
const buildStructuredEvidence = async (filters = {}) => {
  const [summary, growth, categories, locations, alerts] = await Promise.all([
    analyticsService.getSummary(filters),
    analyticsService.getGrowth(filters),
    analyticsService.getCategories(filters),
    analyticsService.getLocations(filters),
    alertService.getAlerts(filters)
  ]);

  return {
    summary: {
      totalWasteKG: summary.totalWaste,
      averageDailyWasteKG: summary.averageDailyWaste,
      growthPercentage: summary.growthPercentage,
      recyclablePercentage: summary.recyclablePercentage,
      highestWasteLocation: summary.highestWasteLocation?.name || null,
      highestWasteCategory: summary.highestWasteCategory?.name || null,
      totalRecordCount: summary.recordCount
    },
    growth: {
      currentPeriodWaste: growth.currentPeriod.totalWaste,
      previousPeriodWaste: growth.previousPeriod.totalWaste,
      growthPercentage: growth.growthPercentage,
      trend: growth.trend
    },
    topCategories: categories.slice(0, 3).map((c) => ({
      name: c.name,
      totalKG: c.total,
      percentage: c.percentage
    })),
    topLocations: locations.slice(0, 3).map((l) => ({
      name: l.name,
      totalKG: l.total,
      status: l.status
    })),
    keyAlerts: alerts.slice(0, 3).map((a) => ({
      type: a.type,
      priority: a.priority,
      title: a.title,
      location: a.location,
      wasteType: a.wasteType,
      message: a.message,
      recommendation: a.recommendation
    }))
  };
};

/**
 * Deterministic rule-based decision intelligence engine (used as standalone or robust fallback).
 */
const generateDeterministicInsights = (evidence, filters = {}) => {
  const { summary, growth, topCategories, topLocations, keyAlerts } = evidence;

  // Case 1: Empty database / no collection data
  if (summary.totalRecordCount === 0 || summary.totalWasteKG === 0) {
    return [
      {
        title: 'Baseline Operational State — Insufficient Data',
        observation: 'No significant waste collection data was recorded for the selected monitoring window.',
        evidence: {
          currentWaste: '0 KG',
          previousWaste: '0 KG',
          growth: '0%',
          topLocation: 'N/A',
          topCategory: 'N/A'
        },
        analysis:
          'Statistical models require active telemetry entries to identify growth anomalies and resource bottlenecks.',
        recommendation: 'Log new collection operations records to initiate automated decision support telemetry.',
        priority: 'LOW',
        affectedLocation: filters.location || 'All Zones',
        affectedWasteType: filters.wasteType || 'All Types',
        generatedAt: new Date().toISOString(),
        engine: 'Deterministic Policy Engine'
      }
    ];
  }

  const insights = [];

  // Insight 1: Highest priority alert translation into decision insight
  if (keyAlerts && keyAlerts.length > 0) {
    const topAlert = keyAlerts[0];
    insights.push({
      title: topAlert.title || 'Operational Risk Identified',
      observation: topAlert.message,
      evidence: {
        currentWaste: `${summary.totalWasteKG.toLocaleString()} KG`,
        previousWaste: `${growth.previousPeriodWaste.toLocaleString()} KG`,
        growth: `${growth.growthPercentage > 0 ? '+' : ''}${growth.growthPercentage}%`,
        topLocation: topAlert.location,
        topCategory: topAlert.wasteType
      },
      analysis: `The operational metrics indicate a critical concentration in ${topAlert.location}. Period-over-period variance reflects shifting municipal waste load.`,
      recommendation: topAlert.recommendation,
      priority: topAlert.priority || 'HIGH',
      affectedLocation: topAlert.location,
      affectedWasteType: topAlert.wasteType,
      generatedAt: new Date().toISOString(),
      engine: 'Deterministic Policy Engine'
    });
  }

  // Insight 2: Material category recovery & capacity recommendation
  if (topCategories && topCategories.length > 0) {
    const dominantCategory = topCategories[0];
    const isPlasticOrOrganic = ['Plastic', 'Organic'].includes(dominantCategory.name);

    insights.push({
      title: `${dominantCategory.name} Stream Optimization`,
      observation: `${dominantCategory.name} comprises ${dominantCategory.percentage}% (${dominantCategory.totalKG.toLocaleString()} KG) of all collected materials.`,
      evidence: {
        currentWaste: `${dominantCategory.totalKG.toLocaleString()} KG`,
        previousWaste: `${growth.previousPeriodWaste.toLocaleString()} KG`,
        growth: `${growth.growthPercentage > 0 ? '+' : ''}${growth.growthPercentage}%`,
        topLocation: summary.highestWasteLocation || 'Citywide',
        topCategory: dominantCategory.name
      },
      analysis: isPlasticOrOrganic
        ? `High volume of ${dominantCategory.name.toLowerCase()} waste requires enhanced segregation at source and specialized processing dispatch.`
        : `Secondary material fraction requires regular processing review to optimize landfill diversion rate.`,
      recommendation:
        dominantCategory.name === 'Plastic'
          ? 'Increase dedicated plastic sorting frequency and coordinate with authorized recycling facilities.'
          : dominantCategory.name === 'Organic'
          ? 'Expand composting transfer capacity to prevent anaerobic degradation and station overflow.'
          : 'Review transfer schedules and containment capacity for this material stream.',
      priority: dominantCategory.percentage > 40 ? 'HIGH' : 'MEDIUM',
      affectedLocation: summary.highestWasteLocation || 'Citywide',
      affectedWasteType: dominantCategory.name,
      generatedAt: new Date().toISOString(),
      engine: 'Deterministic Policy Engine'
    });
  }

  // Insight 3: Location logistics & vehicle routing decision support
  if (topLocations && topLocations.length > 0) {
    const topLoc = topLocations[0];
    insights.push({
      title: `Zone Load Balancing for ${topLoc.name}`,
      observation: `${topLoc.name} recorded the highest municipal waste volume with ${topLoc.totalKG.toLocaleString()} KG.`,
      evidence: {
        currentWaste: `${topLoc.totalKG.toLocaleString()} KG`,
        previousWaste: `${growth.previousPeriodWaste.toLocaleString()} KG`,
        growth: `${growth.growthPercentage > 0 ? '+' : ''}${growth.growthPercentage}%`,
        topLocation: topLoc.name,
        topCategory: summary.highestWasteCategory || 'All Types'
      },
      analysis: `Operational density in ${topLoc.name} exceeds neighboring sectors, creating vehicle capacity strain during peak collection hours.`,
      recommendation: `Deploy heavy collection vehicles (e.g., CARPE Heavy Truck 3,000 KG) and adjust shift dispatching in ${topLoc.name}.`,
      priority: topLoc.status === 'High' ? 'HIGH' : 'MEDIUM',
      affectedLocation: topLoc.name,
      affectedWasteType: summary.highestWasteCategory || 'All Types',
      generatedAt: new Date().toISOString(),
      engine: 'Deterministic Policy Engine'
    });
  }

  return insights;
};

/**
 * Call external AI API (Gemini or OpenAI format) if API key is provided, or fallback gracefully.
 */
const generateAIWithExternalProvider = async (evidence, apiKey, filters = {}) => {
  const promptText = `
You are the AI Decision Intelligence Engine for CARPE, an administrative municipal waste management platform.
Analyze the structured municipal waste telemetry below and generate 2 to 3 concise, formal, and actionable decision-support insights.

CRITICAL RULES:
- Analyze ONLY the provided evidence.
- NEVER invent numbers, statistics, locations, or waste types.
- Distinguish observation from actionable recommendation.
- Use a formal, governmental administrative tone.
- Output MUST be valid JSON array of objects matching this exact schema:
[
  {
    "title": "Short title",
    "observation": "What is observed in data",
    "evidence": {
      "currentWaste": "string with KG",
      "previousWaste": "string with KG",
      "growth": "string with %",
      "topLocation": "string",
      "topCategory": "string"
    },
    "analysis": "Analytical assessment of why this occurred and impact",
    "recommendation": "Concise operational recommendation for municipality",
    "priority": "HIGH" | "MEDIUM" | "LOW",
    "affectedLocation": "string",
    "affectedWasteType": "string"
  }
]

DATA EVIDENCE:
${JSON.stringify(evidence, null, 2)}
`;

  try {
    // Attempt Gemini API call
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        }),
        signal: AbortSignal.timeout(8000)
      }
    );

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => ({
            ...item,
            generatedAt: new Date().toISOString(),
            engine: 'Gemini AI Decision Engine'
          }));
        }
      }
    }
  } catch (err) {
    console.warn('External AI call failed or timed out, utilizing deterministic intelligence engine:', err.message);
  }

  // If external call fails or key is invalid, return deterministic insights
  return generateDeterministicInsights(evidence, filters);
};

/**
 * Main service endpoint for generating AI decision intelligence.
 */
const generateDecisionInsights = async (filters = {}) => {
  const evidence = await buildStructuredEvidence(filters);
  const apiKey = process.env.AI_API_KEY?.trim();

  let insights;
  if (apiKey && apiKey !== '' && apiKey !== 'your_ai_api_key_here') {
    insights = await generateAIWithExternalProvider(evidence, apiKey, filters);
  } else {
    insights = generateDeterministicInsights(evidence, filters);
  }

  return {
    insights,
    evidence,
    generatedAt: new Date().toISOString()
  };
};

module.exports = {
  buildStructuredEvidence,
  generateDeterministicInsights,
  generateDecisionInsights
};
