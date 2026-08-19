const analyticsService = require('../services/analyticsService');

// @desc    Get analytics summary
// @route   GET /api/analytics/summary
const getSummary = async (req, res) => {
  try {
    const summary = await analyticsService.getSummary(req.query);
    res.json(summary);
  } catch (error) {
    const statusCode = error.message.includes('Invalid') || error.message.includes('cannot be after') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Get waste categories
// @route   GET /api/analytics/categories
const getCategories = async (req, res) => {
  try {
    const categories = await analyticsService.getCategories(req.query);
    res.json(categories);
  } catch (error) {
    const statusCode = error.message.includes('Invalid') || error.message.includes('cannot be after') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Get waste trends
// @route   GET /api/analytics/trends
const getTrends = async (req, res) => {
  try {
    const trends = await analyticsService.getTrends(req.query);
    res.json(trends);
  } catch (error) {
    const statusCode = error.message.includes('Invalid') || error.message.includes('cannot be after') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Get locations analytics
// @route   GET /api/analytics/locations
const getLocationsAnalytics = async (req, res) => {
  try {
    const locations = await analyticsService.getLocations(req.query);
    res.json(locations);
  } catch (error) {
    const statusCode = error.message.includes('Invalid') || error.message.includes('cannot be after') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Get waste growth comparison
// @route   GET /api/analytics/growth
const getGrowthAnalytics = async (req, res) => {
  try {
    const growth = await analyticsService.getGrowth(req.query);
    res.json(growth);
  } catch (error) {
    const statusCode = error.message.includes('Invalid') || error.message.includes('cannot be after') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Get map location telemetry with coordinates
// @route   GET /api/analytics/map
const getMapAnalytics = async (req, res) => {
  try {
    const mapData = await analyticsService.getMapData(req.query);
    res.json(mapData);
  } catch (error) {
    const statusCode = error.message.includes('Invalid') || error.message.includes('cannot be after') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Get predictive waste forecast
// @route   GET /api/analytics/forecast
const getForecastAnalytics = async (req, res) => {
  try {
    const forecast = await analyticsService.getForecast(req.query);
    res.json(forecast);
  } catch (error) {
    const statusCode = error.message.includes('Invalid') || error.message.includes('cannot be after') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Get consolidated official government reports
// @route   GET /api/analytics/reports
const getReportAnalytics = async (req, res) => {
  try {
    const reportData = await analyticsService.getReportData(req.query);
    res.json(reportData);
  } catch (error) {
    const statusCode = error.message.includes('Invalid') || error.message.includes('cannot be after') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSummary,
  getCategories,
  getTrends,
  getLocationsAnalytics,
  getGrowthAnalytics,
  getMapAnalytics,
  getForecastAnalytics,
  getReportAnalytics
};
