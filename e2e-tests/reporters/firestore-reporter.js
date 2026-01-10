/**
 * Firestore Test Reporter - Playwright Custom Reporter
 * 
 * Uploads E2E test results to Firestore for display in the app.
 * 
 * Results are stored in: metadata/e2e-test-results
 * History stored in: metadata/e2e-test-history/{timestamp}
 * 
 * To use: npx playwright test --reporter=./e2e-tests/reporters/firestore-reporter.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
let db = null;

function initFirebase() {
  if (db) return db;
  
  try {
    // Try to load service account from project root
    const serviceAccountPaths = [
      join(__dirname, '../../leaderreps-test-firebase-adminsdk.json'),
      join(__dirname, '../../leaderreps-pd-platform-firebase-adminsdk.json'),
    ];
    
    let serviceAccount = null;
    for (const path of serviceAccountPaths) {
      if (existsSync(path)) {
        serviceAccount = JSON.parse(readFileSync(path, 'utf8'));
        break;
      }
    }
    
    if (!serviceAccount) {
      console.warn('⚠️ No Firebase service account found. Results will only be logged locally.');
      return null;
    }
    
    initializeApp({
      credential: cert(serviceAccount)
    });
    
    db = getFirestore();
    return db;
  } catch (error) {
    console.warn('⚠️ Could not initialize Firebase:', error.message);
    return null;
  }
}

class FirestoreReporter {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      startTime: null,
      endTime: null,
      duration: 0,
      environment: process.env.E2E_ENV || 'local',
      suites: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0
      }
    };
    this.currentSuite = null;
  }

  onBegin(config, suite) {
    this.results.startTime = new Date().toISOString();
    console.log('\n🚀 Starting E2E Tests with Firestore Reporter');
    console.log(`   Environment: ${this.results.environment}`);
    console.log(`   Total projects: ${config.projects.length}`);
  }

  onTestBegin(test, result) {
    // Track test start
  }

  onTestEnd(test, result) {
    // Update suite tracking
    const suiteName = test.parent?.title || 'Unknown Suite';
    
    let suite = this.results.suites.find(s => s.name === suiteName);
    if (!suite) {
      suite = {
        name: suiteName,
        file: test.location?.file || '',
        tests: [],
        passed: 0,
        failed: 0,
        skipped: 0
      };
      this.results.suites.push(suite);
    }
    
    const testResult = {
      name: test.title,
      status: result.status,
      duration: result.duration,
      retries: result.retry,
      error: result.error ? {
        message: result.error.message,
        stack: result.error.stack?.slice(0, 500) // Truncate for storage
      } : null
    };
    
    suite.tests.push(testResult);
    
    // Update counters
    this.results.summary.total++;
    if (result.status === 'passed') {
      this.results.summary.passed++;
      suite.passed++;
    } else if (result.status === 'failed' || result.status === 'timedOut') {
      this.results.summary.failed++;
      suite.failed++;
    } else if (result.status === 'skipped') {
      this.results.summary.skipped++;
      suite.skipped++;
    }
    
    // Log progress
    const icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
    console.log(`${icon} ${test.title} (${result.duration}ms)`);
  }

  async onEnd(result) {
    this.results.endTime = new Date().toISOString();
    this.results.duration = result.duration;
    this.results.overallStatus = result.status;
    
    // Calculate pass rate
    const { passed, total } = this.results.summary;
    this.results.summary.passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    // Log summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 E2E TEST RESULTS SUMMARY');
    console.log('═'.repeat(60));
    console.log(`   Total:   ${this.results.summary.total} tests`);
    console.log(`   Passed:  ${this.results.summary.passed} ✅`);
    console.log(`   Failed:  ${this.results.summary.failed} ❌`);
    console.log(`   Skipped: ${this.results.summary.skipped} ⏭️`);
    console.log(`   Pass Rate: ${this.results.summary.passRate}%`);
    console.log(`   Duration: ${(this.results.duration / 1000).toFixed(1)}s`);
    console.log('═'.repeat(60));
    
    // Upload to Firestore
    await this.uploadResults();
  }

  async uploadResults() {
    const db = initFirebase();
    if (!db) {
      console.log('\n📝 Results saved locally (Firestore not configured)');
      return;
    }
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Save current results (overwrite)
      await db.collection('metadata').doc('e2e-test-results').set({
        ...this.results,
        updatedAt: new Date().toISOString()
      });
      
      // Save to history
      await db.collection('metadata').doc('e2e-test-history')
        .collection('runs')
        .doc(timestamp)
        .set(this.results);
      
      console.log('\n✅ Results uploaded to Firestore!');
      console.log(`   Latest: metadata/e2e-test-results`);
      console.log(`   History: metadata/e2e-test-history/runs/${timestamp}`);
      
    } catch (error) {
      console.error('\n❌ Failed to upload results:', error.message);
    }
  }
}

export default FirestoreReporter;
