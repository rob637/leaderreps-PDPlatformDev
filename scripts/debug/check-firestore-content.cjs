const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkContent() {
  console.log('\n=== Checking content_readings ===');
  const readings = await db.collection('content_readings').limit(3).get();
  console.log(`Found ${readings.size} documents (showing first 3):`);
  readings.forEach(doc => {
    const data = doc.data();
    console.log(`\nID: ${doc.id}`);
    console.log(`Title: ${data.title}`);
    console.log(`Category: ${data.category}`);
    console.log(`Has metadata.fullFlyerHTML: ${!!data.metadata?.fullFlyerHTML}`);
    console.log(`Has metadata.executiveBriefHTML: ${!!data.metadata?.executiveBriefHTML}`);
    console.log(`Metadata keys: ${Object.keys(data.metadata || {}).join(', ')}`);
  });

  console.log('\n=== Checking content_videos ===');
  const videos = await db.collection('content_videos').limit(3).get();
  console.log(`Found ${videos.size} documents`);

  console.log('\n=== Checking content_courses ===');
  const courses = await db.collection('content_courses').limit(3).get();
  console.log(`Found ${courses.size} documents`);

  console.log('\n=== Checking old metadata/reading_catalog ===');
  const oldReading = await db.collection('metadata').doc('reading_catalog').get();
  if (oldReading.exists) {
    const data = oldReading.data();
    const categories = Object.keys(data.items || {});
    let totalBooks = 0;
    categories.forEach(cat => {
      if (Array.isArray(data.items[cat])) {
        totalBooks += data.items[cat].length;
      }
    });
    console.log(`Found ${categories.length} categories with ${totalBooks} total books`);
    console.log(`Categories: ${categories.join(', ')}`);
  }

  process.exit(0);
}

checkContent().catch(console.error);
