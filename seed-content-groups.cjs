// seed-content-groups.cjs
// Script to initialize content_programs, content_workouts, content_skills LOVs in system_lovs

const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Initial Programs
const INITIAL_PROGRAMS = [
  {
    id: 'prog_quickstart',
    label: 'QuickStart Accelerator',
    description: 'Fast-track your leadership foundation with essential skills and techniques',
    thumbnail: '',
    displayOrder: 0,
    isActive: true,
    isHiddenUntilUnlocked: false,
    unlockDay: null,
    contentOrder: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prog_leadership_fundamentals',
    label: 'Leadership Fundamentals',
    description: 'Core leadership principles and practices for new managers',
    thumbnail: '',
    displayOrder: 1,
    isActive: true,
    isHiddenUntilUnlocked: true,
    unlockDay: 8,
    contentOrder: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prog_communication_mastery',
    label: 'Communication Mastery',
    description: 'Advanced communication techniques for leaders',
    thumbnail: '',
    displayOrder: 2,
    isActive: true,
    isHiddenUntilUnlocked: true,
    unlockDay: 15,
    contentOrder: [],
    createdAt: new Date().toISOString()
  }
];

// Initial Workouts
const INITIAL_WORKOUTS = [
  {
    id: 'workout_daily_leadership',
    label: 'Daily Leadership Drill',
    description: 'Quick daily exercises to build leadership habits',
    thumbnail: '',
    displayOrder: 0,
    isActive: true,
    isHiddenUntilUnlocked: false,
    unlockDay: null,
    contentOrder: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'workout_team_building',
    label: 'Team Building Workout',
    description: 'Exercises focused on building team cohesion and trust',
    thumbnail: '',
    displayOrder: 1,
    isActive: true,
    isHiddenUntilUnlocked: true,
    unlockDay: 10,
    contentOrder: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'workout_feedback_practice',
    label: 'Feedback Practice Session',
    description: 'Structured practice for giving and receiving feedback',
    thumbnail: '',
    displayOrder: 2,
    isActive: true,
    isHiddenUntilUnlocked: true,
    unlockDay: 14,
    contentOrder: [],
    createdAt: new Date().toISOString()
  }
];

// Initial Skills
const INITIAL_SKILLS = [
  {
    id: 'skill_communication',
    label: 'Communication',
    description: 'Effective verbal and written communication',
    thumbnail: '',
    displayOrder: 0,
    isActive: true,
    isHiddenUntilUnlocked: false,
    unlockDay: null,
    contentOrder: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'skill_delegation',
    label: 'Delegation',
    description: 'Effective task and responsibility delegation',
    thumbnail: '',
    displayOrder: 1,
    isActive: true,
    isHiddenUntilUnlocked: false,
    unlockDay: null,
    contentOrder: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'skill_feedback',
    label: 'Feedback',
    description: 'Giving and receiving constructive feedback',
    thumbnail: '',
    displayOrder: 2,
    isActive: true,
    isHiddenUntilUnlocked: false,
    unlockDay: null,
    contentOrder: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'skill_time_management',
    label: 'Time Management',
    description: 'Prioritization and time allocation skills',
    thumbnail: '',
    displayOrder: 3,
    isActive: true,
    isHiddenUntilUnlocked: false,
    unlockDay: null,
    contentOrder: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'skill_decision_making',
    label: 'Decision Making',
    description: 'Analytical and strategic decision making',
    thumbnail: '',
    displayOrder: 4,
    isActive: true,
    isHiddenUntilUnlocked: false,
    unlockDay: null,
    contentOrder: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'skill_conflict_resolution',
    label: 'Conflict Resolution',
    description: 'Managing and resolving workplace conflicts',
    thumbnail: '',
    displayOrder: 5,
    isActive: true,
    isHiddenUntilUnlocked: false,
    unlockDay: null,
    contentOrder: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'skill_coaching',
    label: 'Coaching',
    description: 'Developing team members through coaching',
    thumbnail: '',
    displayOrder: 6,
    isActive: true,
    isHiddenUntilUnlocked: false,
    unlockDay: null,
    contentOrder: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'skill_emotional_intelligence',
    label: 'Emotional Intelligence',
    description: 'Self-awareness and empathy in leadership',
    thumbnail: '',
    displayOrder: 7,
    isActive: true,
    isHiddenUntilUnlocked: false,
    unlockDay: null,
    contentOrder: [],
    createdAt: new Date().toISOString()
  }
];

async function seedContentGroups() {
  console.log('🌱 Seeding Content Groups to system_lovs...\n');
  
  const batch = db.batch();
  
  // Seed Programs
  const programsRef = db.collection('system_lovs').doc('content_programs');
  batch.set(programsRef, {
    title: 'Programs',
    description: 'Leadership development programs for content organization',
    items: INITIAL_PROGRAMS,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log(`📚 Programs: ${INITIAL_PROGRAMS.length} items prepared`);
  
  // Seed Workouts
  const workoutsRef = db.collection('system_lovs').doc('content_workouts');
  batch.set(workoutsRef, {
    title: 'Workouts',
    description: 'Leadership exercise workouts for content organization',
    items: INITIAL_WORKOUTS,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log(`💪 Workouts: ${INITIAL_WORKOUTS.length} items prepared`);
  
  // Seed Skills
  const skillsRef = db.collection('system_lovs').doc('content_skills');
  batch.set(skillsRef, {
    title: 'Skills',
    description: 'Leadership skills for content categorization',
    items: INITIAL_SKILLS,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log(`🎯 Skills: ${INITIAL_SKILLS.length} items prepared`);
  
  // Commit
  await batch.commit();
  
  console.log('\n✅ Content Groups seeded successfully!');
  console.log('\nSummary:');
  console.log(`  - Programs: ${INITIAL_PROGRAMS.length}`);
  console.log(`  - Workouts: ${INITIAL_WORKOUTS.length}`);
  console.log(`  - Skills: ${INITIAL_SKILLS.length}`);
}

seedContentGroups()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error seeding content groups:', err);
    process.exit(1);
  });
