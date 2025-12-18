const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function migrateDocuments() {
  console.log('🚀 Starting Document Migration to Unified Content...');
  
  const oldCollection = db.collection('content_documents');
  const newCollection = db.collection('content_library');
  
  const snapshot = await oldCollection.get();
  console.log(`Found ${snapshot.size} documents to migrate.`);
  
  let migratedCount = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const oldId = doc.id;
    
    console.log(`Migrating: ${data.title} (${oldId})`);
    
    // Check if already migrated (by title for now, or could check ID if we preserved it)
    // Let's just create new ones to be safe, or check if title exists
    const existingQuery = await newCollection
      .where('type', '==', 'DOCUMENT')
      .where('title', '==', data.title)
      .get();
      
    if (!existingQuery.empty) {
      console.log(`  ⚠️  Skipping ${data.title} - already exists.`);
      continue;
    }
    
    // Determine File Type
    let fileType = 'PDF';
    if (data.metadata?.fileName?.endsWith('.docx')) fileType = 'DOCX';
    if (data.metadata?.fileName?.endsWith('.xlsx')) fileType = 'XLSX';
    if (data.metadata?.fileName?.endsWith('.pptx')) fileType = 'PPTX';
    
    const newDoc = {
      type: 'DOCUMENT',
      title: data.title || 'Untitled Document',
      description: data.description || '',
      status: data.isActive ? 'PUBLISHED' : 'DRAFT',
      difficulty: 'FOUNDATION', // Default
      roleLevel: 'ALL', // Default
      estimatedTime: '5', // Default 5 mins
      isHiddenUntilUnlocked: data.isHiddenUntilUnlocked || false,
      visibility: ['DOCUMENT'],
      createdAt: data.dateAdded || admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: data.dateModified || admin.firestore.FieldValue.serverTimestamp(),
      details: {
        url: data.url || '',
        fileType: fileType,
        fileName: data.metadata?.fileName || '',
        fileSize: data.metadata?.fileSize || 0,
        storagePath: data.metadata?.storagePath || ''
      }
    };
    
    await newCollection.add(newDoc);
    console.log(`  ✅ Migrated ${data.title}`);
    migratedCount++;
  }
  
  console.log(`\n🎉 Migration Complete. Migrated ${migratedCount} documents.`);
}

migrateDocuments().catch(console.error);
