/**
 * E2E Test Runner with Firestore Reporting
 * 
 * Runs Playwright E2E tests and streams results to Firestore
 * for live viewing in the Admin Command Center.
 * 
 * Usage:
 *   node scripts/run-e2e-tests.cjs --email=test@example.com --password=xxx
 *   node scripts/run-e2e-tests.cjs --suite=smoke
 *   node scripts/run-e2e-tests.cjs --env=test --suite=all
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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
  suite: getArg('suite') || 'all',
  runId: getArg('runId') || `run-${Date.now()}`,
  outputFile: getArg('output') || 'test-results/e2e-live-results.json'
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

// Ensure output directory exists
const outputDir = path.dirname(config.outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write results to file (can be read by frontend)
function writeResults() {
  fs.writeFileSync(config.outputFile, JSON.stringify(results, null, 2));
  console.log(`📝 Results written to ${config.outputFile}`);
}

// Parse Playwright JSON output
function parsePlaywrightResults(jsonOutput) {
  try {
    const data = JSON.parse(jsonOutput);
    
    results.summary.total = data.stats?.expected || 0;
    results.summary.passed = data.stats?.expected || 0;
    results.summary.failed = (data.stats?.unexpected || 0) + (data.stats?.flaky || 0);
    results.summary.skipped = data.stats?.skipped || 0;
    results.summary.duration = data.stats?.duration || 0;
    
    // Parse individual test results
    if (data.suites) {
      data.suites.forEach(suite => {
        parseSuite(suite, '');
      });
    }
    
    return true;
  } catch (e) {
    console.error('Failed to parse Playwright results:', e.message);
    return false;
  }
}

function parseSuite(suite, parentTitle) {
  const suiteTitle = parentTitle ? `${parentTitle} › ${suite.title}` : suite.title;
  
  if (suite.specs) {
    suite.specs.forEach(spec => {
      spec.tests?.forEach(test => {
        const testResult = {
          id: `${suite.file}-${spec.title}`,
          name: spec.title,
          suite: suiteTitle,
          file: suite.file,
          status: test.status === 'expected' ? 'passed' : 
                  test.status === 'skipped' ? 'skipped' : 'failed',
          duration: test.results?.[0]?.duration || 0,
          error: null,
          attachments: []
        };
        
        // Get error details if failed
        if (test.status !== 'expected' && test.results?.[0]?.error) {
          const error = test.results[0].error;
          testResult.error = {
            message: error.message || 'Unknown error',
            stack: error.stack || '',
            snippet: error.snippet || ''
          };
        }
        
        // Get attachments (screenshots, videos)
        if (test.results?.[0]?.attachments) {
          testResult.attachments = test.results[0].attachments.map(a => ({
            name: a.name,
            path: a.path,
            contentType: a.contentType
          }));
        }
        
        results.tests.push(testResult);
      });
    });
  }
  
  // Recursively process child suites
  if (suite.suites) {
    suite.suites.forEach(childSuite => {
      parseSuite(childSuite, suiteTitle);
    });
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting E2E Test Runner');
  console.log(`   Environment: ${config.env}`);
  console.log(`   Suite: ${config.suite}`);
  console.log(`   Run ID: ${config.runId}`);
  console.log('');
  
  // Write initial status
  writeResults();
  
  // Build Playwright command
  const playwrightArgs = [
    'playwright', 'test',
    '--reporter=json',
    `--project=chromium`
  ];
  
  // Add suite filter
  if (config.suite !== 'all') {
    playwrightArgs.push(`${config.suite}.spec.js`);
  }
  
  // Set environment variables
  const env = {
    ...process.env,
    E2E_ENV: config.env,
    E2E_ADMIN_EMAIL: config.email,
    E2E_ADMIN_PASSWORD: config.password,
    PLAYWRIGHT_JSON_OUTPUT_NAME: 'test-results/playwright-results.json'
  };
  
  console.log('📋 Running Playwright tests...\n');
  
  return new Promise((resolve) => {
    let jsonOutput = '';
    let stderrOutput = '';
    
    const playwright = spawn('npx', playwrightArgs, {
      env,
      cwd: process.cwd(),
      shell: true
    });
    
    playwright.stdout.on('data', (data) => {
      jsonOutput += data.toString();
    });
    
    playwright.stderr.on('data', (data) => {
      const line = data.toString();
      stderrOutput += line;
      
      // Parse live output for progress updates
      if (line.includes('Running')) {
        console.log(`  ${line.trim()}`);
      } else if (line.includes('✓') || line.includes('✘') || line.includes('○')) {
        // Live test result
        const match = line.match(/(✓|✘|○)\s+\d+\s+(.+)/);
        if (match) {
          const status = match[1] === '✓' ? '✅' : match[1] === '✘' ? '❌' : '⏭️';
          console.log(`  ${status} ${match[2].trim().substring(0, 80)}`);
          
          // Update running count
          if (match[1] === '✓') results.summary.passed++;
          else if (match[1] === '✘') results.summary.failed++;
          else results.summary.skipped++;
          
          results.summary.total = results.summary.passed + results.summary.failed + results.summary.skipped;
          writeResults();
        }
      }
    });
    
    playwright.on('close', (code) => {
      console.log('\n📊 Test run complete');
      
      results.endTime = new Date().toISOString();
      results.status = code === 0 ? 'passed' : 'failed';
      results.exitCode = code;
      
      // Try to parse JSON output
      if (jsonOutput) {
        parsePlaywrightResults(jsonOutput);
      }
      
      // Calculate duration
      const startTime = new Date(results.startTime);
      const endTime = new Date(results.endTime);
      results.summary.duration = endTime - startTime;
      
      // Final write
      writeResults();
      
      // Print summary
      console.log('\n' + '='.repeat(50));
      console.log('📈 SUMMARY');
      console.log('='.repeat(50));
      console.log(`   Total:   ${results.summary.total}`);
      console.log(`   Passed:  ${results.summary.passed} ✅`);
      console.log(`   Failed:  ${results.summary.failed} ❌`);
      console.log(`   Skipped: ${results.summary.skipped} ⏭️`);
      console.log(`   Duration: ${(results.summary.duration / 1000).toFixed(1)}s`);
      console.log('='.repeat(50));
      
      if (results.summary.failed > 0) {
        console.log('\n❌ FAILURES:');
        results.tests
          .filter(t => t.status === 'failed')
          .forEach(t => {
            console.log(`\n   ${t.name}`);
            if (t.error?.message) {
              console.log(`   └─ ${t.error.message.substring(0, 100)}`);
            }
          });
      }
      
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
