const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const assistantService = require('../services/assistantService');

async function testAssistant() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('MONGO_URI is missing from .env');
    process.exit(1);
  }

  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB for CARPE AI Assistant tests...\n');

  const testQueries = [
    {
      label: '1. Highest waste location inquiry',
      message: 'Which location has the highest waste?',
      lang: 'en'
    },
    {
      label: '2. Specific location inquiry (Anna Nagar)',
      message: 'How much waste was collected in Anna Nagar?',
      lang: 'en'
    },
    {
      label: '3. Vehicle overview & top collection vehicle',
      message: 'Which vehicle collected the most waste?',
      lang: 'en'
    },
    {
      label: '4. Specific waste type (Plastic)',
      message: 'How much plastic waste was collected?',
      lang: 'en'
    },
    {
      label: '5. Growth and trend analysis',
      message: 'What waste category is increasing?',
      lang: 'en'
    },
    {
      label: '6. Operational alerts & attention zones',
      message: 'Which location needs more attention?',
      lang: 'en'
    },
    {
      label: '7. Overall summary inquiry',
      message: 'Give me a summary of the waste collection data.',
      lang: 'en'
    },
    {
      label: '8. General CARPE system definition',
      message: 'What is CARPE?',
      lang: 'en'
    },
    {
      label: '9. Tamil: Highest waste inquiry',
      message: 'எந்த பகுதியில் அதிக கழிவுகள் சேகரிக்கப்பட்டுள்ளன?',
      lang: 'ta'
    },
    {
      label: '10. Tamil: CARPE definition',
      message: 'கார்பே என்றால் என்ன?',
      lang: 'ta'
    }
  ];

  let passed = 0;

  for (const t of testQueries) {
    console.log(`========================================`);
    console.log(`TEST: ${t.label}`);
    console.log(`Message: "${t.message}" [Language: ${t.lang}]`);
    
    try {
      const result = await assistantService.processUserQuery({
        message: t.message,
        history: [],
        language: t.lang
      });

      console.log(`Intent Detected: ${result.intent}`);
      console.log(`Response Answer:\n${result.answer}`);
      
      if (result.answer && typeof result.answer === 'string' && result.answer.trim().length > 10) {
        console.log(`✓ Result: PASS`);
        passed++;
      } else {
        console.log(`✗ Result: FAIL (Empty or malformed answer)`);
      }
    } catch (err) {
      console.error(`✗ Error:`, err.message);
    }
    console.log('');
  }

  console.log(`========================================`);
  console.log(`Tests Completed: ${passed}/${testQueries.length} passed.`);
  await mongoose.disconnect();
}

testAssistant().catch(console.error);
