const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
// Ensure you have GOOGLE_APPLICATION_CREDENTIALS set or are running in an environment with access
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'leaderreps-pd-platform'
  });
}

const db = admin.firestore();

// --- DATA SOURCES ---
const READING_CATALOG_PATH = path.join(__dirname, '../reading-catalog-firestore.json');
const RESOURCE_LIBRARY_PATH = path.join(__dirname, '../resource_library_items.json');

// --- HELPER: SLUGIFY ---
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
};

async function migrate() {
  console.log('🚀 Starting Migration to Unified Content Architecture...');

  const batch = db.batch();
  let operationCount = 0;
  const BATCH_SIZE = 400;

  const commitBatch = async () => {
    if (operationCount > 0) {
      console.log(`💾 Committing batch of ${operationCount} operations...`);
      await batch.commit();
      operationCount = 0;
      // Re-instantiate batch is not needed in recent SDKs but good practice to reset if using a new batch object
      // In this script we use one batch object but commit resets it? No, commit finalizes it.
      // We need a new batch.
    }
  };
  
  // We need to manage batches carefully. 
  // Actually, let's just write one by one for safety in this script or manage new batches.
  // For simplicity in this migration script, I'll write sequentially or use a helper.
  
  const writeDoc = async (collection, id, data) => {
    const docRef = db.collection(collection).doc(id);
    await docRef.set(data, { merge: true });
    console.log(`✅ Wrote ${collection}/${id}`);
  };

  // 1. MIGRATE READINGS (READ_REP)
  if (fs.existsSync(READING_CATALOG_PATH)) {
    console.log('📚 Migrating Readings...');
    const readingData = JSON.parse(fs.readFileSync(READING_CATALOG_PATH, 'utf8'));
    const categories = readingData.metadata?.reading_catalog?.items || {};

    for (const [category, books] of Object.entries(categories)) {
      for (const book of books) {
        const id = `rr_${slugify(book.title)}`;
        const docData = {
          id: id,
          type: 'READ_REP',
          title: book.title,
          slug: slugify(book.title),
          description: book.theme || '',
          status: 'PUBLISHED',
          metadata: {
            author: book.author,
            complexity: book.complexity,
            durationMin: book.duration,
            focusAreas: book.focus ? book.focus.split(',').map(s => s.trim()) : [],
            category: category
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await writeDoc('content', id, docData);
      }
    }
  }

  // 2. MIGRATE RESOURCES (TOOLS / VIDEOS)
  if (fs.existsSync(RESOURCE_LIBRARY_PATH)) {
    console.log('🛠️ Migrating Resources...');
    const resourceData = JSON.parse(fs.readFileSync(RESOURCE_LIBRARY_PATH, 'utf8'));
    const items = resourceData.items || [];

    for (const item of items) {
      let type = 'TOOL';
      let toolType = 'RESOURCE';
      
      if (item.type === 'Video') {
        // For now, treat standalone videos as Tools of type VIDEO_RESOURCE
        // In the future, they will be embedded in Workouts
        type = 'TOOL'; 
        toolType = 'VIDEO_RESOURCE';
      } else if (item.type === 'Article') {
        type = 'TOOL';
        toolType = 'ARTICLE';
      } else if (item.type === 'Tool') {
        type = 'TOOL';
        toolType = 'TEMPLATE';
      }

      const id = item.resource_id || `res_${slugify(item.title)}`;
      
      const docData = {
        id: id,
        type: type,
        title: item.title,
        slug: slugify(item.title),
        description: item.summary || '',
        status: 'PUBLISHED',
        metadata: {
          url: item.url,
          toolType: toolType,
          domainId: item.domain_id
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      await writeDoc('content', id, docData);
    }
  }

  // 3. CREATE SAMPLE PROGRAMS & WORKOUTS (SCAFFOLDING)
  console.log('🏗️ Scaffolding Programs & Workouts...');

  // -- SKILLS --
  const skills = ['Feedback', 'Delegation', 'Coaching', 'Trust', 'Accountability'];
  for (const skill of skills) {
    const id = `skill_${slugify(skill)}`;
    await writeDoc('skills', id, {
      id: id,
      name: skill,
      slug: slugify(skill),
      description: `Master the art of ${skill}.`
    });
  }

  // -- WORKOUT: FEEDBACK --
  const feedbackWorkoutId = 'wkt_feedback_foundations';
  await writeDoc('content', feedbackWorkoutId, {
    id: feedbackWorkoutId,
    type: 'WORKOUT',
    title: 'Feedback Foundations',
    slug: 'feedback-foundations',
    description: 'Learn the core principles of giving effective feedback.',
    status: 'PUBLISHED',
    metadata: {
      durationMin: 45,
      difficulty: 'FOUNDATION',
      skills: ['skill_feedback']
    }
  });

  // -- WORKOUT: DELEGATION --
  const delegationWorkoutId = 'wkt_delegation_essentials';
  await writeDoc('content', delegationWorkoutId, {
    id: delegationWorkoutId,
    type: 'WORKOUT',
    title: 'Delegation Essentials',
    slug: 'delegation-essentials',
    description: 'How to delegate without micromanaging.',
    status: 'PUBLISHED',
    metadata: {
      durationMin: 30,
      difficulty: 'PRO',
      skills: ['skill_delegation']
    }
  });

  // -- PROGRAM: QUICKSTART --
  const programId = 'prog_quickstart';
  await writeDoc('content', programId, {
    id: programId,
    type: 'PROGRAM',
    title: 'LeaderReps QuickStart',
    slug: 'quickstart',
    description: 'The essential 4-week program for new managers.',
    status: 'PUBLISHED',
    metadata: {
      durationWeeks: 4,
      outcome: 'Shift from player to coach.',
      workoutIds: [feedbackWorkoutId, delegationWorkoutId] // Ordered list
    }
  });

  console.log('✨ Migration Complete!');
}

migrate().catch(console.error);
