const admin = require('firebase-admin');
const path = require('path');

// Use dev credentials
const cwd = process.cwd();
const serviceAccount = require(path.join(cwd, '..', 'leaderreps-pd-platform-firebase-adminsdk.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkTools() {
  // Check content_library for TOOL type items
  console.log('\n=== Checking content_library for TOOL items ===\n');
  
  const toolSnapshot = await db.collection('content_library')
    .where('type', '==', 'TOOL')
    .get();
    
  console.log(`Found ${toolSnapshot.size} items with type='TOOL'`);
  
  if (toolSnapshot.size > 0) {
    toolSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: "${data.title}" (type: ${data.type}, status: ${data.status})`);
    });
  }
  
  // Check for any other type values that might be tools
  console.log('\n=== Checking for Tool-like items with other type values ===\n');
  
  const allSnapshot = await db.collection('content_library').limit(200).get();
  const typeValues = new Set();
  
  allSnapshot.docs.forEach(doc => {
    const data = doc.data();
    typeValues.add(data.type);
    
    // Check if title suggests it's a tool
    const title = (data.title || '').toLowerCase();
    if (title.includes('tool') || title.includes('template') || title.includes('checklist') || title.includes('prep') || title.includes('aid')) {
      console.log(`  Potential tool: "${data.title}" has type="${data.type}"`);
    }
  });
  
  console.log('\n=== All unique type values in content_library ===\n');
  console.log([...typeValues].sort().join(', '));
  
  process.exit(0);
}

checkTools().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
