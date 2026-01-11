/**
 * Firestore Test Reporter - Playwright Custom Reporter
 * 
 * Uploads E2E test results to Firestore for display in the app.
 * Screenshots of failures are uploaded to Firebase Storage (auto-expire in 7 days).
 * 
 * Results are stored in: metadata/e2e-test-results
 * History stored in: metadata/e2e-test-history/{timestamp}
 * Screenshots stored in: gs://[bucket]/e2e-screenshots/{timestamp}/{test-name}.png
 * 
 * To use: npx playwright test --reporter=./e2e-tests/reporters/firestore-reporter.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync, existsSync } from 'fs';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
let db = null;
let storage = null;
let bucketName = null;

function initFirebase() {
  if (db) return { db, storage, bucketName };
  
  try {
    // Try to load service account from project root
    const serviceAccountPaths = [
      { path: join(__dirname, '../../leaderreps-test-firebase-adminsdk.json'), bucket: 'leaderreps-test.appspot.com' },
      { path: join(__dirname, '../../leaderreps-pd-platform-firebase-adminsdk.json'), bucket: 'leaderreps-pd-platform.appspot.com' },
    ];
    
    let serviceAccount = null;
    for (const config of serviceAccountPaths) {
      if (existsSync(config.path)) {
        serviceAccount = JSON.parse(readFileSync(config.path, 'utf8'));
        bucketName = config.bucket;
        break;
      }
    }
    
    if (!serviceAccount) {
      console.warn('⚠️ No Firebase service account found. Results will only be logged locally.');
      return { db: null, storage: null, bucketName: null };
    }
    
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: bucketName
    });
    
    db = getFirestore();
    storage = getStorage();
    return { db, storage, bucketName };
  } catch (error) {
    console.warn('⚠️ Could not initialize Firebase:', error.message);
    return { db: null, storage: null, bucketName: null };
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
    this.screenshotsToUpload = []; // Queue of screenshots to upload
    this.runTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
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
    };
    
    // Only store error details for failures (reduces storage significantly)
    if (result.status === 'failed' || result.status === 'timedOut') {
      testResult.error = result.error ? {
        message: result.error.message?.slice(0, 500), // Truncate for storage
      } : null;
      
      // Find screenshot attachment for this failure
      const screenshotAttachment = result.attachments?.find(
        a => a.name === 'screenshot' && a.contentType === 'image/png'
      );
      
      if (screenshotAttachment?.path && existsSync(screenshotAttachment.path)) {
        // Queue screenshot for upload
        const safeName = test.title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50);
        this.screenshotsToUpload.push({
          localPath: screenshotAttachment.path,
          storagePath: `e2e-screenshots/${this.runTimestamp}/${suiteName}/${safeName}.png`,
          testResult: testResult
        });
      }
      
      // Only add failed tests to the suite
      suite.tests.push(testResult);
    }
    // Don't store passed test details - just count them
    
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
    const { db, storage, bucketName } = initFirebase();
    if (!db) {
      console.log('\n📝 Results saved locally (Firestore not configured)');
      return;
    }
    
    try {
      const timestamp = this.runTimestamp;
      
      // Upload screenshots to Firebase Storage (only failures)
      if (storage && this.screenshotsToUpload.length > 0) {
        console.log(`\n📸 Uploading ${this.screenshotsToUpload.length} screenshot(s)...`);
        const bucket = storage.bucket();
        
        for (const screenshot of this.screenshotsToUpload) {
          try {
            const fileBuffer = readFileSync(screenshot.localPath);
            const file = bucket.file(screenshot.storagePath);
            
            await file.save(fileBuffer, {
              metadata: {
                contentType: 'image/png',
                // Set custom metadata for lifecycle management
                metadata: {
                  createdAt: new Date().toISOString(),
                  environment: this.results.environment,
                  autoDelete: 'true' // Flag for cleanup scripts
                }
              }
            });
            
            // Get public URL (signed URL valid for 7 days)
            const [signedUrl] = await file.getSignedUrl({
              action: 'read',
              expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            
            // Add URL to the test result
            screenshot.testResult.screenshotUrl = signedUrl;
            console.log(`   ✅ ${basename(screenshot.storagePath)}`);
          } catch (uploadErr) {
            console.warn(`   ⚠️ Failed to upload ${basename(screenshot.storagePath)}: ${uploadErr.message}`);
          }
        }
      }
      
      // Create minimal results object (only summary + failures)
      const minimalResults = {
        startTime: this.results.startTime,
        endTime: this.results.endTime,
        duration: this.results.duration,
        environment: this.results.environment,
        summary: this.results.summary,
        // Only include suites that have failures
        failedTests: this.results.suites
          .filter(s => s.failed > 0)
          .map(s => ({
            name: s.name,
            failed: s.failed,
            tests: s.tests // Already filtered to only failures, now includes screenshotUrl
          })),
        updatedAt: new Date().toISOString()
      };
      
      // Save current results (overwrite - single document)
      await db.collection('metadata').doc('e2e-test-results').set(minimalResults);
      
      // Only save to history if there were failures (saves storage)
      if (this.results.summary.failed > 0) {
        await db.collection('metadata').doc('e2e-test-history')
          .collection('runs')
          .doc(timestamp)
          .set(minimalResults);
        console.log(`   History: metadata/e2e-test-history/runs/${timestamp}`);
      }
      
      console.log('\n✅ Results uploaded to Firestore!');
      console.log(`   Latest: metadata/e2e-test-results`);
      if (this.screenshotsToUpload.length > 0) {
        console.log(`   Screenshots: ${this.screenshotsToUpload.length} (expire in 7 days)`);
      }
      
    } catch (error) {
      console.error('\n❌ Failed to upload results:', error.message);
    }
  }
}

export default FirestoreReporter;
