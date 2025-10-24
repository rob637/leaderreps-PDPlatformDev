// import-data.patched.js — REST-mode + timeouts + Windows trust shim
// Usage:
//   node import-data.patched.js [path/to/master_import.json] [path/to/service-account-key.json]
//
// If args are omitted, defaults are ./master_import.json and ./service-account-key.json

// 0) On Windows behind corp proxy, trust Windows root store if available (no-op if module missing)
try { require('win-ca'); } catch (_) {}

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1) Paths & env checks
const JSON_PATH = process.argv[2] || './master_import.json';
const KEY_PATH  = process.argv[3] || process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account-key.json';

if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
  console.error('Refusing to run with NODE_TLS_REJECT_UNAUTHORIZED=0. Unset it and retry.');
  process.exit(1);
}

// 2) Read & validate JSON input
let data;
try {
  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  data = JSON.parse(raw);
} catch (e) {
  console.error(`CRITICAL IMPORT ERROR: Unable to read/parse ${JSON_PATH}:`, e.message);
  process.exit(1);
}

const metadataConfig = data?.metadata?.config;
const userTemplateContent = data?.initial_data?.user_template;
if (!metadataConfig || !userTemplateContent) {
  console.error("CRITICAL IMPORT ERROR: JSON missing required 'metadata.config' or 'initial_data.user_template'.");
  console.error('Top-level keys:', Object.keys(data || {}));
  process.exit(1);
}

// 3) Initialize Admin SDK
let serviceAccount;
try {
  serviceAccount = require(path.resolve(KEY_PATH));
} catch (e) {
  console.error(`CRITICAL AUTH ERROR: Cannot read service account JSON at ${KEY_PATH}:`, e.message);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();

// >>> IMPORTANT <<< Set REST transport BEFORE any reads/writes
if (typeof db.settings === 'function') {
  try {
    db.settings({ preferRest: true });
    console.log('[net] Firestore set to prefer REST transport.');
  } catch (e) {
    console.warn('[net] Could not set preferRest:', e.message);
  }
}

// 4) Helper: add timeouts so we fail fast instead of hanging forever
function withTimeout(label, promise, ms = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ]);
}

// 5) Import
async function importData() {
  console.log(`Starting data import from ${JSON_PATH}...`);

  console.log('1. Importing Global Configuration (metadata/config)...');
  await withTimeout('Write metadata/config', 
    db.collection('metadata').doc('config').set(metadataConfig, { merge: true })
  );
  console.log('   -> Metadata import complete.');

  console.log('2. Importing User Template (initial_data/user_template)...');
  await withTimeout('Write initial_data/user_template', 
    db.collection('initial_data').doc('user_template').set(userTemplateContent, { merge: true })
  );
  console.log('   -> User template import complete.');

  console.log('\n✅ ALL DATA IMPORTED SUCCESSFULLY.');
}

importData()
  .then(async () => {
    try { await admin.app().delete(); } catch {}
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('CRITICAL IMPORT ERROR:', err);
    try { await admin.app().delete(); } catch {}
    process.exit(1);
  });
