#!/usr/bin/env node
/**
 * Data Refresh Script - Pull Production Content to Dev/Test
 * 
 * PHILOSOPHY:
 *   - Production is the source of truth for content/curriculum
 *   - Facilitators manage content DIRECTLY in Production
 *   - Developers pull fresh content FROM prod when needed
 *   - NEVER push TO production
 * 
 * USAGE:
 *   npm run data:refresh dev    # Pull prod content → dev
 *   npm run data:refresh test   # Pull prod content → test
 * 
 * WHAT GETS SYNCED (Content/Configuration):
 *   ✅ development_plan_v1    - 26-week master plan
 *   ✅ daily_plan_v1          - Day-by-Day curriculum
 *   ✅ content_library        - Videos, documents, tools
 *   ✅ content                 - Legacy content
 *   ✅ content_videos         - Video library
 *   ✅ content_documents      - Document wrappers
 *   ✅ content_readings       - Reading library
 *   ✅ content_courses        - Course catalog
 *   ✅ content_coaching       - Coaching scenarios
 *   ✅ skills                  - Skills taxonomy
 *   ✅ coaching_session_types - Session type definitions
 *   ✅ community_session_types - Community session type definitions
 *   ✅ daily_reps_library     - Daily reps library
 *   ✅ media_assets           - Media vault
 *   ✅ video_series           - Video series playlists
 *   ✅ unified-content        - Unified content (Admin CMS)
 *   ✅ content-groups         - Content groupings
 *   ✅ system_lovs            - System lists of values
 *   ✅ metadata               - App metadata
 *   ✅ config                 - Feature flags
 * 
 * WHAT STAYS IN EACH ENVIRONMENT (Operational Data):
 *   🔒 coaching_sessions      - Scheduled coaching sessions (created by facilitators)
 *   🔒 community_sessions     - Scheduled community events
 *   🔒 users/*                - User profiles and data
 *   🔒 modules/*              - User progress
 *   🔒 cohorts                - Cohort data with user references
 *   🔒 coaching_registrations - User registrations
 *   🔒 invitations            - User invitations
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

// Collections that contain CONTENT/CONFIG (pull from prod)
const CONTENT_COLLECTIONS = [
  'development_plan_v1',
  'daily_plan_v1',
  'content_library',
  'content',
  'content_videos',
  'content_documents', 
  'content_readings',
  'content_courses',
  'content_coaching',
  'skills',
  'coaching_session_types',
  'community_session_types',
  'daily_reps_library',
  'media_assets',
  'video_series',
  'unified-content',
  'content-groups',
  'system_lovs',
  'metadata',
  'config'
];

// Collections that are OPERATIONAL (never sync)
const OPERATIONAL_COLLECTIONS = [
  'coaching_sessions',      // Facilitators schedule these per-environment
  'community_sessions',     // Community events per-environment
  'coaching_registrations', // User sign-ups
  'users',                  // User data
  'modules',                // User progress
  'cohorts',                // Contains user references
  'invitations',            // User invitations
  'artifacts',              // User artifacts
  'content_community'       // User-generated content
];

// Firebase project configurations
const FIREBASE_PROJECTS = {
  dev: {
    projectId: 'leaderreps-pd-platform',
    serviceAccountPath: './leaderreps-pd-platform-firebase-adminsdk.json'
  },
  test: {
    projectId: 'leaderreps-test', 
    serviceAccountPath: './leaderreps-test-firebase-adminsdk.json'
  },
  prod: {
    projectId: 'leaderreps-prod',
    serviceAccountPath: './leaderreps-prod-firebase-adminsdk.json'
  }
};

// =============================================================================
// MAIN SCRIPT
// =============================================================================

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const NC = '\x1b[0m';

async function main() {
  const targetEnv = process.argv[2];
  
  // Show usage if no argument
  if (!targetEnv) {
    console.log(`
${CYAN}╔════════════════════════════════════════════════════════════╗
║          LeaderReps Data Refresh Tool                      ║
╚════════════════════════════════════════════════════════════╝${NC}

${YELLOW}Usage:${NC}
  npm run data:refresh dev     Pull production content → dev
  npm run data:refresh test    Pull production content → test

${GREEN}What gets synced:${NC}
  ✅ Curriculum (daily_plan, development_plan)
  ✅ Content library (videos, documents, tools)
  ✅ Skills taxonomy
  ✅ Session type definitions
  ✅ Feature flags and metadata

${RED}What stays untouched:${NC}
  🔒 Scheduled coaching sessions (each env has its own)
  🔒 User data and progress
  🔒 Cohorts and registrations
`);
    process.exit(0);
  }
  
  // Validate target environment
  if (!['dev', 'test'].includes(targetEnv)) {
    console.error(`${RED}❌ Invalid target: ${targetEnv}${NC}`);
    console.error(`   Only 'dev' or 'test' are allowed. Production content cannot be overwritten.`);
    process.exit(1);
  }
  
  // Block any attempt to write to prod
  if (targetEnv === 'prod') {
    console.error(`
${RED}╔════════════════════════════════════════════════════════════╗
║  ❌ BLOCKED: Cannot write to Production                    ║
╚════════════════════════════════════════════════════════════╝${NC}

Production is the SOURCE of truth for content. You can only:
  • Pull FROM prod to dev/test
  • Edit content directly in prod via admin tools
`);
    process.exit(1);
  }
  
  console.log(`
${CYAN}╔════════════════════════════════════════════════════════════╗
║          LeaderReps Data Refresh                           ║
╚════════════════════════════════════════════════════════════╝${NC}

${BLUE}Source:${NC} Production (${FIREBASE_PROJECTS.prod.projectId})
${BLUE}Target:${NC} ${targetEnv.toUpperCase()} (${FIREBASE_PROJECTS[targetEnv].projectId})
`);

  // Initialize Firebase apps
  const prodApp = admin.initializeApp({
    credential: admin.credential.cert(require(path.resolve(FIREBASE_PROJECTS.prod.serviceAccountPath))),
    projectId: FIREBASE_PROJECTS.prod.projectId
  }, 'prod');
  
  const targetApp = admin.initializeApp({
    credential: admin.credential.cert(require(path.resolve(FIREBASE_PROJECTS[targetEnv].serviceAccountPath))),
    projectId: FIREBASE_PROJECTS[targetEnv].projectId
  }, 'target');
  
  const prodDb = prodApp.firestore();
  const targetDb = targetApp.firestore();
  
  console.log(`${GREEN}✅ Connected to both environments${NC}\n`);
  
  // Track stats
  const stats = {
    collections: 0,
    documents: 0,
    skipped: 0
  };
  
  // Sync each collection
  for (const collectionName of CONTENT_COLLECTIONS) {
    process.stdout.write(`${YELLOW}📦 Syncing ${collectionName}...${NC}`);
    
    try {
      // Get all documents from production
      const prodSnap = await prodDb.collection(collectionName).get();
      
      if (prodSnap.empty) {
        console.log(` ${CYAN}(empty)${NC}`);
        continue;
      }
      
      // Delete existing documents in target (clean slate for this collection)
      const targetSnap = await targetDb.collection(collectionName).get();
      const deletePromises = targetSnap.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
      
      // Copy documents from prod to target
      const batch = targetDb.batch();
      let batchCount = 0;
      
      for (const doc of prodSnap.docs) {
        const targetRef = targetDb.collection(collectionName).doc(doc.id);
        batch.set(targetRef, doc.data());
        batchCount++;
        
        // Firestore batches have a limit of 500
        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }
      
      if (batchCount > 0) {
        await batch.commit();
      }
      
      console.log(` ${GREEN}✅ ${prodSnap.size} docs${NC}`);
      stats.collections++;
      stats.documents += prodSnap.size;
      
    } catch (error) {
      console.log(` ${RED}❌ Error: ${error.message}${NC}`);
    }
  }
  
  // Summary
  console.log(`
${GREEN}╔════════════════════════════════════════════════════════════╗
║  ✅ Data Refresh Complete!                                 ║
╚════════════════════════════════════════════════════════════╝${NC}

${BLUE}Summary:${NC}
  Collections synced: ${stats.collections}
  Documents copied:   ${stats.documents}

${YELLOW}Untouched (operational data):${NC}
  🔒 coaching_sessions - Your ${targetEnv} sessions are preserved
  🔒 community_sessions 
  🔒 users, modules, cohorts, registrations

${GREEN}Your ${targetEnv} environment now has fresh production content!${NC}
`);

  process.exit(0);
}

main().catch(err => {
  console.error(`${RED}Fatal error: ${err.message}${NC}`);
  process.exit(1);
});
