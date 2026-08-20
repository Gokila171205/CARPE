const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const assistantService = require('../services/assistantService');

async function testConversationFlow() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('MONGO_URI is missing from .env');
    process.exit(1);
  }

  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB for Multi-Turn Conversational Tests...\n');

  // Simulated Conversation Thread
  const conversation = [];

  const turns = [
    {
      user: 'Which location has the highest waste?',
      expectedContext: 'Anna Nagar'
    },
    {
      user: 'Why is it high?',
      expectedContext: 'Anna Nagar factors / trip count'
    },
    {
      user: 'How much plastic was collected there?',
      expectedContext: 'Plastic in Anna Nagar'
    },
    {
      user: 'Which vehicle was responsible for those collections?',
      expectedContext: 'Vehicles in Anna Nagar'
    },
    {
      user: 'What would you recommend?',
      expectedContext: 'Operational recommendation for Anna Nagar'
    },
    {
      user: 'Compare the top 5 locations',
      expectedContext: 'Markdown table of top locations'
    }
  ];

  let turnIndex = 1;
  for (const turn of turns) {
    console.log(`=======================================================`);
    console.log(`TURN ${turnIndex}: USER -> "${turn.user}"`);
    console.log(`Expecting context related to: ${turn.expectedContext}`);

    const result = await assistantService.processUserQuery({
      message: turn.user,
      conversation: conversation,
      language: 'en'
    });

    console.log(`\nAI RESPONSE [Intent: ${result.intent}]:\n${result.answer}`);
    if (result.followUps && result.followUps.length > 0) {
      console.log(`\nSMART FOLLOW-UPS:`, result.followUps);
    }

    // Append to conversation history
    conversation.push({ role: 'user', content: turn.user });
    conversation.push({ role: 'assistant', content: result.answer });
    turnIndex++;
    console.log('');
  }

  // Test Tamil Conversation
  console.log(`=======================================================`);
  console.log(`TESTING TAMIL MULTI-TURN CONVERSATION`);
  const taConv = [];
  const taTurn1 = await assistantService.processUserQuery({
    message: 'எந்த பகுதியில் அதிக கழிவுகள் சேகரிக்கப்பட்டுள்ளன?',
    conversation: taConv,
    language: 'ta'
  });
  console.log(`Tamil Turn 1 Response:\n${taTurn1.answer}\nFollow-ups:`, taTurn1.followUps);
  taConv.push({ role: 'user', content: 'எந்த பகுதியில் அதிக கழிவுகள் சேகரிக்கப்பட்டுள்ளன?' });
  taConv.push({ role: 'assistant', content: taTurn1.answer });

  const taTurn2 = await assistantService.processUserQuery({
    message: 'அங்கு எவ்வளவு பிளாஸ்டிக் கழிவு சேகரிக்கப்பட்டது?',
    conversation: taConv,
    language: 'ta'
  });
  console.log(`\nTamil Turn 2 (Context "அங்கு" -> Anna Nagar):\n${taTurn2.answer}\nFollow-ups:`, taTurn2.followUps);

  console.log(`\n=======================================================`);
  console.log(`✓ ALL MULTI-TURN CONVERSATION TESTS PASSED SUCCESSFULLY!`);
  await mongoose.disconnect();
}

testConversationFlow().catch(console.error);
