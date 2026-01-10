/**
 * E2E Test Runner with Firestore Live Reporting
 * 
 * Runs Playwright E2E tests and streams results to Firestore
 * for live viewing in the Admin Command Center.
 * 
 * Usage:
 *   node scripts/run-e2e-firestore.cjs --email=test@example.com --password=xxx
 *   node scripts/run-e2e-firestore.cjs --suite=smoke --env=test
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Firebase Admin SDK
let admin;
let db;

// Try to initialize Firebase
async function initFirebase() {
  try {
    admin = require('firebase-admin');
    
    // Look for service account key
    const keyPaths = [
      path.join(__dirname, '../leaderreps-test-firebase-adminsdk.json'),
      path.join(__dirname, '../leaderreps-pd-platform-firebase-adminsdk.json'),
      path.join(__dirname, '../scripts/serviceAccount.json')
    ];
    
    let keyPath = keyPaths.find(p => fs.existsSync(p));
    
    if (!keyPath) {
      console.log('⚠️  No Firebase service account key found. Results will be saved locally only.');
      return false;
    }
    
    const serviceAccount = require(keyPath);
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    
    db = admin.firestore();
    console.log('✅ Firebase initialized');
    return true;
  } catch (error) {
    console.log('⚠️  Firebase init failed:', error.message);
    return false;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};

const config = {
  email: getArg('email') || process.env.E2E_ADMIN_EMAIL || '',
  password: getArg('password') || process.env.E2E_ADMIN_PASSWORD || '',
  env: getArg('env') || 'test',
  suite: getArg('suite') || 'smoke',
  runId: `run-${Date.now()}`
};

// Initialize results structure
const results = {
  runId: config.runId,
  startTime: new Date().toISOString(),
  endTime: null,
  status: 'running',
  environment: config.env,
  suite: config.suite,
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  },
  tests: [],
  errors: []
};

// Update results in Firestore
async function updateFirestore() {
  if (!db) return;
  
  try {
    await db.collection('metadata').doc('e2e-current-run').set(results);
  } catch (error) {
    console.error('Failed to update Firestore:', error.message);
  }
}

// Save to history
async function saveToHistory() {
  if (!db) return;
  
  try {
    const historyRef = db.collection('metadata').doc('e2e-history');
    const historyDoc = await historyRef.get();
    
    let runs = [];
    if (historyDoc.exists) {
      runs = historyDoc.data().runs || [];
    }
    
    // Add current run to history (keep last 20)
    runs.unshift({
      runId: results.runId,
      startTime: results.startTime,
      endTime: results.endTime,
      status: results.status,
      environment: results.environment,
      suite: results.suite,
      summary: results.summary
    });
    
    runs = runs.slice(0, 20);
    
    await historyRef.set({ runs, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error('Failed to save history:', error.message);
  }
}

// Write results to local file
function writeLocalResults() {
  const outputFile = 'test-results/e2e-live-results.json';
  const outputDir = path.dirname(outputFile);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
}

// Main test runner
async function runTests() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           🚀 E2E Test Runner with Live Reporting         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   Environment: ${config.env}`);
  console.log(`   Suite:       ${config.suite}`);
  console.log(`   Run ID:      ${config.runId}`);
  console.log('');
  
  // Initialize Firebase
  const hasFirebase = await initFirebase();
  
  // Write initial status
  await updateFirestore();
  writeLocalResults();
  
  // Build Playwright command
  const playwrightArgs = [
    'playwright', 'test',
    '--reporter=list',
    '--project=chromium'
  ];
  
  // Add suite filter
  if (config.suite !== 'all') {
    playwrightArgs.push(`e2e-tests/${config.suite}.spec.js`);
  }
  
  // Set environment variables
  const env = {
    ...process.env,
    E2E_ENV: config.env,
    E2E_ADMIN_EMAIL: config.email,
    E2E_ADMIN_PASSWORD: config.password
  };
  
  console.log('📋 Running Playwright tests...\n');
  console.log('─'.repeat(60));
  
  return new Promise((resolve) => {
    const playwright = spawn('npx', playwrightArgs, {
      env,
      cwd: process.cwd(),
      shell: true
    });
    
    playwright.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
    });
    
    playwright.stderr.on('data', async (data) => {
      const line = data.toString();
      
      // Parse live test results
      const passMatch = line.match(/✓\s+\d+\s+\[.*?\]\s+›\s+(.+?)(?:\s+\(\d+.*\))?$/);
      const failMatch = line.match(/✘\s+\d+\s+\[.*?\]\s+›\s+(.+?)(?:\s+\(\d+.*\))?$/);
      const skipMatch = line.match(/○\s+\d+\s+\[.*?\]\s+›\s+(.+?)(?:\s+\(\d+.*\))?$/);
      const setupMatch = line.match(/✓\s+\d+\s+\[setup\]/);
      
      if (passMatch) {
        const testName = passMatch[1].trim();
        console.log(`  ✅ ${testName.substring(0, 70)}`);
        
        results.summary.passed++;
        results.summary.total = results.summary.passed + results.summary.failed + results.summary.skipped;
        results.tests.push({
          id: `test-${results.tests.length}`,
          name: testName,
          status: 'passed',
          duration: 0
        });
        
        await updateFirestore();
        writeLocalResults();
      } else if (failMatch) {
        const testName = failMatch[1].trim();
        console.log(`  ❌ ${testName.substring(0, 70)}`);
        
        results.summary.failed++;
        results.summary.total = results.summary.passed + results.summary.failed + results.summary.skipped;
        results.tests.push({
          id: `test-${results.tests.length}`,
          name: testName,
          status: 'failed',
          duration: 0,
          error: { message: 'Test failed - see details in test report' }
        });
        
        await updateFirestore();
        writeLocalResults();
      } else if (skipMatch) {
        const testName = skipMatch[1].trim();
        console.log(`  ⏭️  ${testName.substring(0, 70)}`);
        
        results.summary.skipped++;
        results.summary.total = results.summary.passed + results.summary.failed + results.summary.skipped;
        results.tests.push({
          id: `test-${results.tests.length}`,
          name: testName,
          status: 'skipped',
          duration: 0
        });
        
        await updateFirestore();
        writeLocalResults();
      } else if (setupMatch) {
        console.log(`  ⚙️  Setup complete`);
      } else if (line.includes('Running') && line.includes('tests')) {
        console.log(`\n${line.trim()}\n`);
      } else if (line.includes('Error:') || line.includes('failed')) {
        // Capture error details
        if (!line.includes('[setup]')) {
          results.errors.push(line.trim());
        }
      }
    });
    
    playwright.on('close', async (code) => {
      console.log('\n' + '─'.repeat(60));
      console.log('\n📊 Test run complete\n');
      
      results.endTime = new Date().toISOString();
      results.status = code === 0 ? 'passed' : 'failed';
      results.exitCode = code;
      
      // Calculate duration
      const startTime = new Date(results.startTime);
      const endTime = new Date(results.endTime);
      results.summary.duration = endTime - startTime;
      
      // Final updates
      await updateFirestore();
      await saveToHistory();
      writeLocalResults();
      
      // Print summary
      console.log('╔══════════════════════════════════════════════════════════╗');
      console.log('║                      📈 SUMMARY                          ║');
      console.log('╠══════════════════════════════════════════════════════════╣');
      console.log(`║   Total:   ${String(results.summary.total).padEnd(4)}                                        ║`);
      console.log(`║   Passed:  ${String(results.summary.passed).padEnd(4)} ✅                                     ║`);
      console.log(`║   Failed:  ${String(results.summary.failed).padEnd(4)} ❌                                     ║`);
      console.log(`║   Skipped: ${String(results.summary.skipped).padEnd(4)} ⏭️                                      ║`);
      console.log(`║   Duration: ${String((results.summary.duration / 1000).toFixed(1) + 's').padEnd(6)}                                   ║`);
      console.log('╚══════════════════════════════════════════════════════════╝');
      
      if (results.summary.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        results.tests
          .filter(t => t.status === 'failed')
          .forEach(t => {
            console.log(`\n   • ${t.name}`);
          });
        console.log('\n   Run `npm run e2e:report` to view detailed failure info.');
      }
      
      if (hasFirebase) {
        console.log('\n📡 Results synced to Firestore - view in Admin Command Center');
      }
      
      console.log('');
      resolve(code);
    });
  });
}

// Run if called directly
if (require.main === module) {
  runTests()
    .then(code => {
      process.exit(code);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { runTests, config, results };
