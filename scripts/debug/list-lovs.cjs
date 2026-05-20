#!/usr/bin/env node
// List all LOVs in system_lovs to identify what we have vs what we want to delete.
// Usage: node scripts/debug/list-lovs.cjs
const admin = require('firebase-admin');
const path = require('path');
admin.initializeApp({ credential: admin.credential.cert(require(path.join(__dirname, '..', '..', 'leaderreps-pd-platform-firebase-adminsdk.json'))) });
const db = admin.firestore();
(async () => {
  const snap = await db.collection('system_lovs').get();
  console.log(`Total LOVs: ${snap.size}\n`);
  const rows = [];
  snap.forEach(d => {
    const data = d.data();
    rows.push({ id: d.id, title: data.title || '(no title)', items: (data.items || []).length });
  });
  rows.sort((a, b) => a.title.localeCompare(b.title));
  rows.forEach(r => console.log(`  ${r.id.padEnd(35)} ${r.title.padEnd(30)} ${r.items} items`));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
