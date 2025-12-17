// seed-sample-content.js
// Run with: node seed-sample-content.js
// Seeds sample Read & Rep (Atomic Habits) and Video (Simon Sinek) to content_library

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const COLLECTION = 'content_library';

// Sample Book: Atomic Habits by James Clear
const atomicHabitsBook = {
  type: 'READ_REP',
  title: 'Atomic Habits',
  description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. James Clear reveals practical strategies to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.',
  status: 'PUBLISHED',
  tier: 'free',
  difficulty: 'FOUNDATION',
  roleLevel: 'ALL',
  estimatedTime: 45,
  skills: [],
  metadata: {
    author: 'James Clear',
    category: 'Personal Development',
    readingTimeMin: 45,
    difficulty: 'FOUNDATION',
    publishedYear: 2018,
    isbn: '978-0735211292'
  },
  details: {
    synopsis: `Atomic Habits is the definitive guide to breaking bad behaviors and adopting good ones in four steps. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.

If you're having trouble changing your habits, the problem isn't you. The problem is your system. Bad habits repeat themselves again and again not because you don't want to change, but because you have the wrong system for change.

You do not rise to the level of your goals. You fall to the level of your systems.`,
    
    keyPoints: [
      {
        title: 'The 1% Rule',
        content: 'Small improvements compound over time. Getting 1% better every day leads to being 37 times better over a year. Habits are the compound interest of self-improvement.'
      },
      {
        title: 'The Four Laws of Behavior Change',
        content: '1) Make it Obvious, 2) Make it Attractive, 3) Make it Easy, 4) Make it Satisfying. To break a bad habit, invert these laws.'
      },
      {
        title: 'Identity-Based Habits',
        content: 'The most effective way to change your habits is to focus not on what you want to achieve, but on who you wish to become. Every action is a vote for the type of person you want to be.'
      },
      {
        title: 'Habit Stacking',
        content: 'Link a new habit to an existing one using the formula: "After I [CURRENT HABIT], I will [NEW HABIT]." This creates a chain of automatic behaviors.'
      },
      {
        title: 'Environment Design',
        content: 'Make the cues of good habits obvious and the cues of bad habits invisible. Your environment shapes your behavior more than motivation.'
      },
      {
        title: 'The Two-Minute Rule',
        content: 'When you start a new habit, it should take less than two minutes to do. Scale down your habit until it can be done in 120 seconds or less.'
      }
    ],
    
    reflectionQuestions: [
      'What is one small habit (1%) you could implement today that would compound positively over time?',
      'Which of your current habits are voting for the person you want to become? Which are voting against?',
      'How could you redesign your environment to make good habits more obvious and bad habits invisible?',
      'What existing habit could you use as a trigger to stack a new positive behavior?'
    ],
    
    actionItems: [
      'Identify one habit you want to build and make its cue obvious in your environment',
      'Create a habit stack: "After I [morning coffee], I will [review my top 3 priorities]"',
      'Use the two-minute rule: Start your new habit with just 2 minutes of action',
      'Track your habit with a simple checkbox for the next 30 days'
    ]
  },
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

// Sample Video: Simon Sinek - Start With Why (TED Talk)
const simonSinekVideo = {
  type: 'VIDEO',
  title: 'Start With Why - How Great Leaders Inspire Action',
  description: 'Simon Sinek presents a simple but powerful model for how leaders inspire action, starting with a golden circle and the question "Why?" His examples include Apple, Martin Luther King Jr., and the Wright brothers.',
  status: 'PUBLISHED',
  tier: 'free',
  difficulty: 'FOUNDATION',
  roleLevel: 'ALL',
  estimatedTime: 18,
  skills: [],
  metadata: {
    speaker: 'Simon Sinek',
    source: 'TED Talk',
    category: 'Leadership',
    durationMin: 18,
    difficulty: 'FOUNDATION',
    externalUrl: 'https://www.youtube.com/watch?v=u4ZoJKF_VuA',
    thumbnail: 'https://img.youtube.com/vi/u4ZoJKF_VuA/maxresdefault.jpg'
  },
  details: {
    externalUrl: 'https://www.youtube.com/watch?v=u4ZoJKF_VuA',
    speaker: 'Simon Sinek',
    source: 'TED Talk',
    category: 'Leadership',
    durationMin: 18,
    keyTakeaways: `People don't buy what you do, they buy why you do it
The Golden Circle: Why → How → What
Great leaders inspire rather than manipulate
Start with purpose, cause, or belief
Those who lead inspire us to act for ourselves`
  },
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

async function seedContent() {
  try {
    console.log('🚀 Seeding sample content...\n');

    // Check if content already exists
    const existingBook = await db.collection(COLLECTION)
      .where('type', '==', 'READ_REP')
      .where('title', '==', 'Atomic Habits')
      .get();
    
    if (existingBook.empty) {
      const bookRef = await db.collection(COLLECTION).add(atomicHabitsBook);
      console.log('📚 Created Atomic Habits book:', bookRef.id);
    } else {
      console.log('📚 Atomic Habits already exists, skipping...');
    }

    const existingVideo = await db.collection(COLLECTION)
      .where('type', '==', 'VIDEO')
      .where('title', '==', 'Start With Why - How Great Leaders Inspire Action')
      .get();
    
    if (existingVideo.empty) {
      const videoRef = await db.collection(COLLECTION).add(simonSinekVideo);
      console.log('🎬 Created Simon Sinek video:', videoRef.id);
    } else {
      console.log('🎬 Simon Sinek video already exists, skipping...');
    }

    console.log('\n✅ Sample content seeded successfully!');
    console.log('\nContent can now be found in:');
    console.log('  - Content > Read & Reps');
    console.log('  - Content > Videos');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding content:', error);
    process.exit(1);
  }
}

seedContent();
