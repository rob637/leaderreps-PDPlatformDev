#!/usr/bin/env node
/**
 * One-time migration script to move hardcoded video and course data from code to Firestore
 * Run with: node migrate-hardcoded-content.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('./leaderreps-pd-platform-firebase-adminsdk.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Hardcoded video data from LeadershipVideos.jsx
const VIDEOS = {
  "INSPIRATIONAL": [
    { 
      id: "sinek-why", 
      title: "How great leaders inspire action", 
      speaker: "Simon Sinek", 
      duration: "18 min", 
      url: "https://www.youtube.com/watch?v=u4ZoJKF_VuA", 
      description: "The foundational concept of starting with 'Why' (The Golden Circle) to build loyalty and inspire action. A must-watch for defining purpose.",
      category: "Vision & Purpose",
      rating: 4.9,
      views: "60M+ views",
      tags: ["vision", "purpose", "inspiration", "golden-circle"]
    },
    { 
      id: "sinek-infinite", 
      title: "The Infinite Game: The Trap Leaders Must Avoid", 
      speaker: "Simon Sinek", 
      duration: "11 min", 
      url: "https://www.youtube.com/watch?v=RyTQ5-SQYTo", 
      description: "How to shift your mindset from playing to win (finite) to playing to advance your cause (infinite), focusing on resilience and long-term vision.",
      category: "Mindset",
      rating: 4.7,
      views: "2.5M+ views",
      tags: ["mindset", "strategy", "long-term", "resilience"]
    },
    { 
      id: "cuddy-presence", 
      title: "Your Body Language May Shape Who You Are", 
      speaker: "Amy Cuddy", 
      duration: "21 min", 
      url: "https://www.youtube.com/watch?v=Ks-_Mh1QhMc", 
      description: "Examines how 'power posing'—changing your body language—can change the chemicals in your brain and impact your leadership confidence.",
      category: "Executive Presence",
      rating: 4.8,
      views: "70M+ views",
      tags: ["confidence", "presence", "body-language", "psychology"]
    },
    { 
      id: "brown-vulnerability", 
      title: "The power of vulnerability", 
      speaker: "Brené Brown", 
      duration: "20 min", 
      url: "https://www.youtube.com/watch?v=iCvmsMYoE_A", 
      description: "A powerful talk on how vulnerability is not weakness, but the birthplace of innovation, creativity, and deeper trust.",
      category: "Authentic Leadership",
      rating: 4.9,
      views: "50M+ views",
      tags: ["vulnerability", "trust", "authenticity", "courage"]
    },
    { 
      id: "duckworth-grit", 
      title: "The Key to Success? Grit", 
      speaker: "Angela Lee Duckworth", 
      duration: "6 min", 
      url: "https://www.youtube.com/watch?v=H14bBuluwB8", 
      description: "Explains that the secret to outstanding achievement is not genius, but a special blend of passion and persistence called 'grit'.",
      category: "Resilience",
      rating: 4.6,
      views: "30M+ views",
      tags: ["grit", "persistence", "success", "psychology"]
    },
    { 
      id: "dalio-principles", 
      title: "How to Build a Company Where the Best Ideas Win", 
      speaker: "Ray Dalio", 
      duration: "5 min", 
      url: "https://www.youtube.com/watch?v=M95m2EFb7IQ", 
      description: "The founder of the world's largest hedge fund discusses creating an 'idea meritocracy' where people can speak up and say what they really think.",
      category: "Culture Building",
      rating: 4.5,
      views: "5M+ views",
      tags: ["culture", "meritocracy", "feedback", "transparency"]
    }
  ],
  "ACTIONABLE": [
    { 
      id: "sinek-micro", 
      title: "The Key to Effective Leadership: Micro-Behaviors", 
      speaker: "Simon Sinek", 
      duration: "3 min", 
      url: "https://www.youtube.com/watch?v=ReRcHdeUG9Y", 
      description: "Practical demonstration of small actions (eye contact, putting the phone away) that leaders must perform consistently to build trust.",
      category: "Daily Practices",
      rating: 4.7,
      views: "8M+ views",
      tags: ["micro-behaviors", "trust", "daily-habits", "practical"]
    },
    { 
      id: "sinek-positive", 
      title: "Transform Your Team: The Power of Positive Leadership", 
      speaker: "Simon Sinek", 
      duration: "6 min", 
      url: "https://www.youtube.com/watch?v=uNtOiqp1Tzs", 
      description: "Actionable advice on using positive reinforcement ('catching people doing things right') to build confidence in underperformers.",
      category: "Team Development",
      rating: 4.6,
      views: "3M+ views",
      tags: ["positive-leadership", "reinforcement", "team-building", "motivation"]
    },
    { 
      id: "delegation-levels", 
      title: "5 Levels of Delegation and How to Use Them", 
      speaker: "ProjectManager", 
      duration: "7 min", 
      url: "https://www.youtube.com/watch?v=wX-jO8g047A", 
      description: "A practical guide to the 5 key levels of delegation (Tell, Sell, Consult, Agree, Empower) and choosing the right level for the right task.",
      category: "Delegation",
      rating: 4.4,
      views: "1.5M+ views",
      tags: ["delegation", "empowerment", "management", "frameworks"]
    },
    { 
      id: "circle-of-safety", 
      title: "Why Good Leaders Make You Feel Safe", 
      speaker: "Simon Sinek", 
      duration: "12 min", 
      url: "https://www.youtube.com/watch?v=lmyZMtPVodo", 
      description: "Explores what makes a great leader and introduces the 'Circle of Safety'—that leaders must create an environment of trust for teams to flourish.",
      category: "Team Building",
      rating: 4.8,
      views: "15M+ views",
      tags: ["safety", "trust", "team-building", "environment"]
    }
  ],
  "STRATEGIC": [
    { 
      id: "collins-bhag", 
      title: "Vision Framework: Big Hairy Audacious Goals", 
      speaker: "Jim Collins", 
      duration: "10 min", 
      url: "https://www.youtube.com/watch?v=1rA5-n7a0wE", 
      description: "Jim Collins explains one of the most important elements of visionary companies—a BHAG that energizes progress and gives meaning.",
      category: "Strategy",
      rating: 4.5,
      views: "800K+ views",
      tags: ["bhag", "vision", "strategy", "goals"]
    },
    { 
      id: "pink-motivation", 
      title: "The Puzzle of Motivation", 
      speaker: "Dan Pink", 
      duration: "18 min", 
      url: "https://www.youtube.com/watch?v=rrkrvAUbU9Y", 
      description: "Challenges the traditional reward-punishment approach and presents 3 factors (Autonomy, Mastery, Purpose) that drive high performance.",
      category: "Motivation Theory",
      rating: 4.7,
      views: "25M+ views",
      tags: ["motivation", "autonomy", "mastery", "purpose"]
    },
    { 
      id: "kotter-change", 
      title: "Leading Change: Establish a Sense of Urgency", 
      speaker: "John Kotter", 
      duration: "4 min", 
      url: "https://www.youtube.com/watch?v=Q-dO0rE-4oQ", 
      description: "Step 1 of Kotter's 8-step process for leading change: how to create a sense of urgency that rallies people around a transformation.",
      category: "Change Management",
      rating: 4.6,
      views: "2M+ views",
      tags: ["change", "urgency", "transformation", "strategy"]
    }
  ]
};

// Hardcoded course data from mockData.js
const COURSES = [
  {
    id: 'executive-presence-masterclass',
    title: 'Executive Presence Masterclass',
    description: 'A 6-week intensive program designed to help senior leaders develop commanding presence, influence, and gravitas in high-stakes situations.',
    instructor: 'Dr. Sarah Chen',
    duration: '6 weeks',
    tier: 'professional',
    category: 'Leadership Development',
    level: 'Advanced'
  },
  {
    id: 'feedback-mastery-bootcamp',
    title: 'Feedback Mastery Bootcamp',
    description: 'Master the art of giving and receiving feedback with this intensive 4-week program. Learn frameworks, practice scenarios, and build confidence.',
    instructor: 'Marcus Rodriguez',
    duration: '4 weeks',
    tier: 'professional',
    category: 'Communication',
    level: 'Intermediate'
  },
  {
    id: 'strategic-thinking-academy',
    title: 'Strategic Thinking Academy',
    description: 'Develop strategic mindset and long-term thinking capabilities. 8-week deep dive into frameworks used by top consultancies and Fortune 500 companies.',
    instructor: 'Dr. Jennifer Park',
    duration: '8 weeks',
    tier: 'elite',
    category: 'Strategy',
    level: 'Expert'
  }
];

async function migrateVideos() {
  console.log('\n📹 Migrating videos...');
  let count = 0;
  
  for (const [categoryName, videos] of Object.entries(VIDEOS)) {
    for (const video of videos) {
      await db.collection('content_videos').add({
        title: video.title,
        description: video.description || '',
        url: video.url,
        tier: 'professional', // All videos require professional tier
        category: categoryName,
        isActive: true,
        thumbnail: `https://img.youtube.com/vi/${video.url.split('v=')[1]}/hqdefault.jpg`,
        order: count,
        dateAdded: Timestamp.now(),
        dateModified: Timestamp.now(),
        metadata: {
          speaker: video.speaker || '',
          duration: video.duration || '',
          rating: video.rating || 0,
          views: video.views || '',
          tags: video.tags || [],
          originalId: video.id || ''
        }
      });
      count++;
      console.log(`  ✅ Added video: ${video.title}`);
    }
  }
  
  console.log(`\n✅ Migrated ${count} videos\n`);
  return count;
}

async function migrateCourses() {
  console.log('\n📚 Migrating courses...');
  let count = 0;
  
  for (const course of COURSES) {
    await db.collection('content_courses').add({
      title: course.title,
      description: course.description || '',
      url: course.url || '',
      tier: course.tier || 'professional',
      category: course.category || 'Leadership',
      isActive: true,
      thumbnail: '',
      order: count,
      dateAdded: Timestamp.now(),
      dateModified: Timestamp.now(),
      metadata: {
        instructor: course.instructor || '',
        duration: course.duration || '',
        level: course.level || '',
        originalId: course.id || ''
      }
    });
    count++;
    console.log(`  ✅ Added course: ${course.title}`);
  }
  
  console.log(`\n✅ Migrated ${count} courses\n`);
  return count;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting hardcoded content migration...\n');
    
    const videoCount = await migrateVideos();
    const courseCount = await migrateCourses();
    
    console.log('\n🎉 Migration complete!');
    console.log(`   Videos: ${videoCount}`);
    console.log(`   Courses: ${courseCount}`);
    console.log('\nYou can now view them in the Content Management admin.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
