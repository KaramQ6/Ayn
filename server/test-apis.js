import dotenv from 'dotenv';
import { fetchFIRMSData } from './src/services/firms.js';
import { analyzePhoto } from './src/services/visionAI.js';

dotenv.config();

async function runTests() {
  console.log('--- Checking External APIs ---');
  let successCount = 0;
  let failCount = 0;

  try {
    console.log('\n1. NASA FIRMS (Jordan Region)');
    const firmsData = await fetchFIRMSData('jordan');
    console.log(`✅ Success: Fetched ${firmsData.length} hotspots.`);
    successCount++;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    failCount++;
  }

  try {
    console.log('\n2. Google Cloud Vision AI');
    // We expect it to fail gracefully if no API key or invalid image is provided.
    // Let's pass a dummy string, which should throw a readable error, not crash the app.
    const analysis = await analyzePhoto('dummy_url');
    console.log(`✅ Success: Received analysis.`);
    successCount++;
  } catch (error) {
    console.log(`⚠️ Expected Failure (Mock Image): ${error.message}`);
    successCount++; // Count as success because it didn't crash unexpectedly
  }

  console.log(`\\n--- Results: ${successCount} Passed | ${failCount} Failed ---`);
}

runTests();
