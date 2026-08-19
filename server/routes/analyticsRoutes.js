const express = require('express');
const router = express.Router();
const {
  getSummary,
  getCategories,
  getTrends,
  getLocationsAnalytics,
  getGrowthAnalytics,
  getMapAnalytics,
  getForecastAnalytics,
  getReportAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getSummary);
router.get('/trends', protect, getTrends);
router.get('/categories', protect, getCategories);
router.get('/locations', protect, getLocationsAnalytics);
router.get('/growth', protect, getGrowthAnalytics);
router.get('/map', protect, getMapAnalytics);
router.get('/forecast', protect, getForecastAnalytics);
router.get('/reports', protect, getReportAnalytics);

module.exports = router;
