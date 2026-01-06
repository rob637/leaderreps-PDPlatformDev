/**
 * Add Interactive Content Items to Content Library
 * 
 * Creates INTERACTIVE type content items for:
 * 1. Leader Profile - in-app form for user profile completion
 * 2. Baseline Assessment - in-app assessment form
 * 
 * These items can be managed by admins (title, description, time estimates)
 * while the actual form fields remain code-controlled for data integrity.
 * 
 * Run: node scripts/add-interactive-content.cjs
 */

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
    id: 'interactive-leader-profile',
    type: 'INTERACTIVE',
    title: 'Complete Your Leader Profile',
    description: 'Tell us about yourself to personalize your journey',
    status: 'PUBLISHED',
    
    // Admin-editable metadata
    estimatedMinutes: 3,
    required: true,
    
    // Handler configuration (maps to in-app component)
    handlerType: 'leader-profile',
    
    // Display details
    details: {
      icon: 'User',
      helperText: 'Share your background, role, and goals so we can personalize your Foundation journey.',
      benefits: [
        'Personalized content recommendations',
        'Better coaching matching',
        'Tailored development plan'
      ],
      completionMessage: 'Your personalized journey is ready!'
    },
    
    // Metadata
    category: 'Onboarding',
    tier: 'all',
    visibility: ['INTERACTIVE'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'interactive-baseline-assessment',
    type: 'INTERACTIVE',
    title: 'Take Baseline Assessment',
    description: 'Assess your current leadership skills',
    status: 'PUBLISHED',
    
    // Admin-editable metadata
    estimatedMinutes: 5,
    required: true,
    
    // Handler configuration (maps to in-app component)
    handlerType: 'baseline-assessment',
    
    // Display details
    details: {
      icon: 'ClipboardCheck',
      helperText: 'Answer 10 quick questions to assess your current leadership skills. This creates your personalized development plan.',
      benefits: [
        'Identify growth areas',
        'Set development goals',
        'Track progress over time'
      ],
      completionMessage: 'Your personalized leadership plan is ready!'
    },
    
    // Metadata
    category: 'Onboarding',
    tier: 'all',
    visibility: ['INTERACTIVE'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

async function addInteractiveContent() {
  console.log('Adding Interactive Content Items to content_library...\n');
  
  for (const item of INTERACTIVE_CONTENT) {
    const { id, ...data } = item;
    
    try {
      // Check if document already exists
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
  console.log('\nInteractive content items are now available in the Content Library.');
  console.log('Admins can update title, description, and time estimates.');
  console.log('Form fields remain code-controlled for data integrity.');
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
