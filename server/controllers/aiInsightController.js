const aiInsightService = require('../services/aiInsightService');

// @desc    Generate AI Decision Intelligence insights from structured analytics
// @route   POST /api/ai/insights & GET /api/ai/insights
const getInsights = async (req, res) => {
  try {
    const filters = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const result = await aiInsightService.generateDecisionInsights(filters);
    res.json(result);
  } catch (error) {
    const statusCode = error.message.includes('Invalid') || error.message.includes('cannot be after') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

module.exports = { getInsights };
