#!/usr/bin/env node
/**
 * Disable Daily Rep Notification Rules
 * 
 * This script disables the Daily Rep reminder notifications since
 * daily reps have been removed from the app.
 * 
 * Usage:
 *   node scripts/fixes/disable-daily-rep-notifications.cjs [--env dev|test|prod]
 */

const admin = require('firebase-admin');
const path = require('path');

// Parse environment argument
const args = process.argv.slice(2);
let env = 'dev';
const envArgIndex = args.indexOf('--env');
if (envArgIndex !== -1 && args[envArgIndex + 1]) {
  env = args[envArgIndex + 1];
}

// Map environment to service account
const serviceAccountPaths = {
  dev: '../../leaderreps-pd-platform-firebase-adminsdk.json',
  test: '../../leaderreps-test-firebase-adminsdk.json',
  prod: '../../leaderreps-prod-firebase-adminsdk.json'
};

const serviceAccountPath = path.resolve(__dirname, serviceAccountPaths[env]);

console.log(`\n🔧 Disabling Daily Rep Notifications`);
console.log(`   Environment: ${env.toUpperCase()}`);
console.log(`   Service Account: ${serviceAccountPath}\n`);

// Initialize Firebase
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error(`❌ Failed to load service account for ${env}:`, error.message);
  process.exit(1);
}

const db = admin.firestore();

async function disableDailyRepNotifications() {
  try {
    // Get all notification rules
    const rulesSnap = await db.collection('notification_rules').get();
    
    if (rulesSnap.empty) {
      console.log('ℹ️  No notification rules found in the database.');
      return;
    }

    console.log(`Found ${rulesSnap.size} notification rule(s):\n`);

    let disabledCount = 0;
    
    for (const doc of rulesSnap.docs) {
      const rule = doc.data();
      const ruleName = rule.name || rule.title || doc.id;
      const isEnabled = rule.enabled === true;
      
      // Check if this is a Daily Rep related rule or deprecated bookend rule
      const isDailyRepRule = 
        (ruleName && /daily.*rep/i.test(ruleName)) ||
        (rule.title && /daily.*rep/i.test(rule.title)) ||
        (rule.body && /daily.*rep/i.test(rule.body)) ||
        (rule.criteria && /daily_action_incomplete/i.test(rule.criteria)) ||
        (rule.body && /streak.*alive/i.test(rule.body)) ||
        (rule.body && /done your daily/i.test(rule.body));
      
      // Also check for deprecated AM/PM bookend rules
      const isBookendRule = 
        (rule.criteria && /am_bookend_incomplete|pm_bookend_incomplete/i.test(rule.criteria)) ||
        (ruleName && /bookend.*reminder/i.test(ruleName));
      
      const shouldDisable = isDailyRepRule || isBookendRule;
      
      const status = isEnabled ? '✅ Enabled' : '❌ Disabled';
      const typeLabel = shouldDisable ? '🎯 DEPRECATED' : '   ';
      
      console.log(`  ${typeLabel} ${status} - "${ruleName}"`);
      if (rule.body) console.log(`       Body: "${rule.body.substring(0, 60)}..."`);
      if (rule.criteria) console.log(`       Criteria: ${rule.criteria}`);
      
      // Disable deprecated rules
      if (shouldDisable && isEnabled) {
        await doc.ref.update({
          enabled: false,
          disabledAt: admin.firestore.FieldValue.serverTimestamp(),
          disabledReason: 'Daily Reps and AM/PM Bookends features removed from app'
        });
        console.log(`       ➡️  DISABLED\n`);
        disabledCount++;
      } else {
        console.log('');
      }
    }

    console.log(`\n✅ Done! Disabled ${disabledCount} deprecated notification rule(s).`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

disableDailyRepNotifications().then(() => {
  console.log('\n👋 Script complete.');
  process.exit(0);
});
