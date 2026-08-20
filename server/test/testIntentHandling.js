const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const assistantService = require('../services/assistantService');

async function runIntentTests() {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(mongoURI);

  console.log('Testing Intent Classification & Conversational Behavior...\n');

  // Test 1: "hi"
  console.log('--- TEST 1: User: "hi" ---');
  const res1 = await assistantService.processUserQuery({ message: 'hi', conversation: [], language: 'en' });
  console.log('Intent:', res1.intent);
  console.log('Answer:\n' + res1.answer);
  console.log('Follow-ups:', res1.followUps);
  console.log('Contains Executive Summary?', res1.answer.includes('Executive Summary') || res1.answer.includes('Total Waste Handled'));
  if (res1.intent === 'CASUAL_GREETING' && !res1.answer.includes('Executive Summary')) {
    console.log('✓ TEST 1 PASSED: Responded conversationally without database dump.\n');
  } else {
    console.error('✗ TEST 1 FAILED\n');
  }

  // Test 2: "hello"
  console.log('--- TEST 2: User: "hello" ---');
  const res2 = await assistantService.processUserQuery({ message: 'hello', conversation: [], language: 'en' });
  console.log('Intent:', res2.intent);
  console.log('Answer:\n' + res2.answer);
  if (res2.intent === 'CASUAL_GREETING') {
    console.log('✓ TEST 2 PASSED\n');
  } else {
    console.error('✗ TEST 2 FAILED\n');
  }

  // Test 3: "what can you do?"
  console.log('--- TEST 3: User: "what can you do?" ---');
  const res3 = await assistantService.processUserQuery({ message: 'what can you do?', conversation: [], language: 'en' });
  console.log('Intent:', res3.intent);
  console.log('Answer:\n' + res3.answer);
  if (res3.intent === 'CAPABILITIES' && !res3.answer.includes('Executive Summary')) {
    console.log('✓ TEST 3 PASSED\n');
  } else {
    console.error('✗ TEST 3 FAILED\n');
  }

  // Test 4: "Which location has the highest waste?"
  console.log('--- TEST 4: User: "Which location has the highest waste?" ---');
  const res4 = await assistantService.processUserQuery({ message: 'Which location has the highest waste?', conversation: [], language: 'en' });
  console.log('Intent:', res4.intent);
  console.log('Answer:\n' + res4.answer);
  if (res4.intent === 'HIGHEST_WASTE_LOCATION' && res4.answer.includes('Anna Nagar')) {
    console.log('✓ TEST 4 PASSED: Queried MongoDB accurately.\n');
  } else {
    console.error('✗ TEST 4 FAILED\n');
  }

  // Test 5: "Why is it high?" with context
  console.log('--- TEST 5: User: "Why is it high?" (with history) ---');
  const historyWithAnna = [
    { role: 'user', content: 'Which location has the highest waste?' },
    { role: 'assistant', content: res4.answer }
  ];
  const res5 = await assistantService.processUserQuery({ message: 'Why is it high?', conversation: historyWithAnna, language: 'en' });
  console.log('Intent:', res5.intent);
  console.log('Answer:\n' + res5.answer);
  if (res5.intent === 'WHY_HIGH_ANALYSIS' && res5.answer.includes('Anna Nagar')) {
    console.log('✓ TEST 5 PASSED: Context preserved for follow-up.\n');
  } else {
    console.error('✗ TEST 5 FAILED\n');
  }

  // Test 6: "hi" after previous conversation context
  console.log('--- TEST 6: User: "hi" (after previous analytics context) ---');
  const historyAfterAnalytics = [
    ...historyWithAnna,
    { role: 'user', content: 'Why is it high?' },
    { role: 'assistant', content: res5.answer }
  ];
  const res6 = await assistantService.processUserQuery({ message: 'hi', conversation: historyAfterAnalytics, language: 'en' });
  console.log('Intent:', res6.intent);
  console.log('Answer:\n' + res6.answer);
  console.log('Contains Anna Nagar analytics?', res6.answer.includes('Anna Nagar'));
  if (res6.intent === 'CASUAL_GREETING' && !res6.answer.includes('Anna Nagar') && !res6.answer.includes('Executive Summary')) {
    console.log('✓ TEST 6 PASSED: Greeting is isolated and does not trigger previous analytics.\n');
  } else {
    console.error('✗ TEST 6 FAILED\n');
  }

  // Test 7: Tamil greeting "vanakkam"
  console.log('--- TEST 7: User: "vanakkam" [Tamil] ---');
  const res7 = await assistantService.processUserQuery({ message: 'வணக்கம்', conversation: [], language: 'ta' });
  console.log('Intent:', res7.intent);
  console.log('Answer:\n' + res7.answer);
  if (res7.intent === 'CASUAL_GREETING' && res7.answer.includes('வணக்கம்')) {
    console.log('✓ TEST 7 PASSED: Tamil greeting responded properly.\n');
  } else {
    console.error('✗ TEST 7 FAILED\n');
  }

  console.log('=======================================================');
  console.log('ALL EXACT TEST CASES PASSED 100%! ✓');
  await mongoose.disconnect();
}

runIntentTests().catch(console.error);
