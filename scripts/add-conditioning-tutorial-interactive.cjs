const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'leaderreps-pd-platform-firebase-adminsdk.json'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Interactive Content Items
const INTERACTIVE_CONTENT = [
  {
    id: 'interactive-conditioning-tutorial',
    type: 'INTERACTIVE',
    title: 'Conditioning Tutorial',
    description: 'Learn the core principles of conditioning loops',
    status: 'PUBLISHED',
    
    // Admin-editable metadata
    estimatedMinutes: 5,
    required: true,
    
    // Handler configuration (maps to in-app component)
    handlerType: 'conditioning-tutorial',
    
    // Display details
    details: {
      icon: 'BookOpen',
      helperText: 'A quick tutorial to introduce the Set Clear Expectations and Deliver Reinforcing Feedback reps.',
      benefits: [
        'Understand the Conditioning Loop',
        'Learn the core elements of feedback',
      ],
      completionMessage: 'You are ready to start conditioning!'
    },
    
    // Metadata
    category: 'Conditioning',
    tier: 'all',
    visibility: ['INTERACTIVE', 'CONDITIONING'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

async function addInteractiveContent() {
  console.log('Adding Interactive Content Items to content_library...\n');
  
  for (const item of INTERACTIVE_CONTENT) {
    const { id, ...data } = item;
    
    try {
      const existing = await db.collection('content_library').doc(id).get();
      
      if (existing.exists) {
        console.log(`⚠️  ${item.title} already exists (${id}) - updating...`);
        await db.collection('content_library').doc(id).update({
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`   ✅ Updated successfully`);
      } else {
        await db.collection('content_library').doc(id).set(data);
        console.log(`✅ Created: ${item.title} (${id})`);
      }
    } catch (error) {
      console.error(`❌ Error adding ${item.title}:`, error.message);
    }
  }
  
  console.log('\n--- Summary ---');
  console.log(`Total items processed: ${INTERACTIVE_CONTENT.length}`);
}

addInteractiveContent()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
