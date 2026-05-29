const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'leaderreps-pd-platform' });
const db = admin.firestore();
(async () => {
  const uid = '18BmIs35txM4VkyfxiycGcDvXIA3';
  const snap = await db.doc(`modules/${uid}/development_plan/current`).get();
  if (!snap.exists) { console.log('NO DOC'); process.exit(0); }
  const d = snap.data();
  console.log('=== KEYS ===');
  console.log(Object.keys(d).sort().join('\n'));
  const hist = d.assessmentHistory || [];
  console.log('\n=== assessmentHistory length:', hist.length, '===');
  hist.forEach((a, i) => {
    console.log(`\n[${i}] date=${a.date} cycle=${a.cycle} id=${a.id || '(none)'} version=${a.version || '(none)'}`);
    console.log('  scored answer keys:', Object.keys(a.answers || {}).filter(k => k !== 'q14' && k !== 'q15' && k !== 'q15_other').length);
    console.log('  q14:', String(a.answers?.q14 || '').slice(0, 80));
    console.log('  q15:', JSON.stringify(a.answers?.q15 || []));
    console.log('  has scores?', !!a.scores, a.scores ? `overall=${a.scores.overall}` : '');
  });
  console.log('\n=== currentAssessment ===');
  console.log(d.currentAssessment ? `date=${d.currentAssessment.date} cycle=${d.currentAssessment.cycle}` : '(none)');
  console.log('\n=== latestAssessmentSummary ===');
  console.log(d.latestAssessmentSummary || '(none)');
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
