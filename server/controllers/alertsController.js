const alertService = require('../services/alertService');

// @desc    Get intelligent waste management alerts
// @route   GET /api/alerts
const getAlerts = async (req, res) => {
  try {
    const alerts = await alertService.getAlerts(req.query);
    res.json(alerts);
  } catch (error) {
    const statusCode = error.message.includes('Invalid') || error.message.includes('cannot be after') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// @desc    Resolve alert
// @route   PUT /api/alerts/:id/resolve
const resolveAlert = async (req, res) => {
  try {
    const alert = await alertService.resolveAlertById(req.params.id);
    res.json(alert);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAlerts, resolveAlert };
