const assistantService = require('../services/assistantService');

/**
 * Handle incoming user question for CARPE AI Assistant.
 * @route POST /api/assistant/chat
 */
const handleChat = async (req, res) => {
  try {
    const { message, history, conversation, language } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A non-empty message string is required.'
      });
    }

    if (message.length > 2500) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds maximum permitted length of 2500 characters.'
      });
    }

    const validLanguage = language === 'ta' ? 'ta' : 'en';
    const rawHistory = Array.isArray(conversation)
      ? conversation
      : Array.isArray(history)
      ? history
      : [];
    const sanitizedHistory = rawHistory.slice(-10);

    const result = await assistantService.processUserQuery({
      message: message.trim(),
      history: sanitizedHistory,
      conversation: sanitizedHistory,
      language: validLanguage
    });

    return res.json({
      success: true,
      answer: result.answer,
      data: result.data || {},
      followUps: result.followUps || []
    });
  } catch (error) {
    console.error('Error in assistantController handleChat:', error);

    return res.status(500).json({
      success: false,
      answer:
        req.body?.language === 'ta'
          ? 'மன்னிக்கவும், தற்போது கார்பே தரவை மீட்டெடுக்க முடியவில்லை. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
          : "Sorry, I couldn't retrieve the CARPE data right now. Please try again.",
      message: 'Internal processing error',
      followUps: []
    });
  }
};

module.exports = {
  handleChat
};
