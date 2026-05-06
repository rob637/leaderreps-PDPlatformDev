/**
 * Audit all cohorts in the TEST environment for malformed facilitator entries.
 * Reports any null / non-object / missing-name entries in `facilitators` arrays
 * and any malformed singular `facilitator` field.
 *
 * Read-only. Run: node scripts/debug/audit-test-cohort-facilitators.cjs
 */
const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.resolve(
  __dirname,
  '../../leaderreps-test-firebase-adminsdk.json'
));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

function isValidTrainer(t) {
  return t && typeof t === 'object' && (t.name || t.email || t.id);
}

function describe(t) {
  if (t === null) return 'null';
  if (t === undefined) return 'undefined';
  if (typeof t !== 'object') return `${typeof t}: ${JSON.stringify(t)}`;
  const keys = Object.keys(t);
  return `object keys=[${keys.join(',')}] sample=${JSON.stringify(t).slice(0, 200)}`;
}

(async () => {
  const snap = await db.collection('cohorts').get();
  console.log(`\nScanned ${snap.size} cohort docs in TEST.\n`);
  let problems = 0;

  snap.forEach((doc) => {
    const data = doc.data() || {};
    const issues = [];

    if ('facilitators' in data) {
      if (!Array.isArray(data.facilitators)) {
        issues.push(`facilitators is not an array (${typeof data.facilitators})`);
      } else {
        data.facilitators.forEach((t, i) => {
          if (!isValidTrainer(t)) {
            issues.push(`facilitators[${i}] invalid → ${describe(t)}`);
          }
        });
      }
    }

    if ('facilitator' in data && data.facilitator != null && !isValidTrainer(data.facilitator)) {
      issues.push(`facilitator (singular) invalid → ${describe(data.facilitator)}`);
    }

    if (issues.length) {
      problems++;
      console.log(`✗ ${doc.id}  name="${data.name || ''}"`);
      issues.forEach((m) => console.log(`    - ${m}`));
    }
  });

  if (!problems) {
    console.log('✓ No malformed facilitator entries found.');
  } else {
    console.log(`\nFound ${problems} cohort(s) with issues.`);
  }
})()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
