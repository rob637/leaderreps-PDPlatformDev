// MIGRATION SCRIPT: leadership_plan → development_plan
// ES MODULE VERSION (for projects with "type": "module")
// Run: node migrate.mjs

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';

// ============================================
// CONFIGURATION - UPDATE THIS!
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyBf_js_jWW-GctwOLvN5PUqRAiZyezgXAo",
  authDomain: "leaderreps-pd-platform.firebaseapp.com",
  projectId: "leaderreps-pd-platform",
  storageBucket: "leaderreps-pd-platform.firebasestorage.app",
  messagingSenderId: "336868581775",
  appId: "1:336868581775:web:f439e98a560f705516abfa",
  measurementId: "G-7YVDMDK01J"
};

const MIGRATION_CONFIG = {
  sourceCollection: 'leadership_plan',
  sourcePath: 'profile/roadmap',
  targetCollection: 'development_plan',
  targetPath: 'user_state/profile',
  dryRun: true,  // ⚠️ Set to false for actual migration
  backupToConsole: true,
  verifyAfterMigration: true,
};

// ============================================
// MIGRATION CLASS
// ============================================

class DevelopmentPlanMigration {
  constructor(config) {
    this.config = config;
    this.app = null;
    this.db = null;
    this.migrationLog = [];
    this.errors = [];
    this.backupData = {};
  }

  async initialize() {
    console.log('🔥 Initializing Firebase...');
    this.app = initializeApp(FIREBASE_CONFIG);
    this.db = getFirestore(this.app);
    console.log('✅ Firebase initialized');
  }

  async discoverUsers() {
    console.log('\n📋 STEP 1: Discovering users...');
    console.log('='.repeat(60));
    
    try {
      const sourceCollectionRef = collection(this.db, this.config.sourceCollection);
      const snapshot = await getDocs(sourceCollectionRef);
      
      const userIds = [];
      snapshot.forEach(docSnap => {
        userIds.push(docSnap.id);
      });
      
      console.log(`✅ Found ${userIds.length} user(s) with data`);
      userIds.forEach((uid, idx) => {
        console.log(`   ${idx + 1}. ${uid}`);
      });
      
      this.migrationLog.push({
        step: 'discovery',
        timestamp: new Date().toISOString(),
        usersFound: userIds.length,
        userIds
      });
      
      return userIds;
    } catch (error) {
      console.error('❌ Error discovering users:', error);
      this.errors.push({ step: 'discovery', error: error.message });
      throw error;
    }
  }

  async backupUserData(userId) {
    console.log(`\n💾 Backing up data for user: ${userId}`);
    
    try {
      const sourcePath = `${this.config.sourceCollection}/${userId}/${this.config.sourcePath}`;
      const docRef = doc(this.db, sourcePath);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.backupData[userId] = {
          sourcePath,
          data,
          timestamp: new Date().toISOString()
        };
        
        console.log(`✅ Backed up ${Object.keys(data).length} fields`);
        
        if (this.config.backupToConsole) {
          console.log('📄 Data preview:', {
            currentCycle: data.currentCycle,
            assessmentCount: data.assessmentHistory?.length || 0,
            planCount: data.planHistory?.length || 0,
            hasFocusAreas: !!data.currentPlan?.focusAreas,
            focusAreaCount: data.currentPlan?.focusAreas?.length || 0
          });
        }
        
        return data;
      } else {
        console.log(`⚠️ No data found at ${sourcePath}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error backing up user ${userId}:`, error);
      this.errors.push({ step: 'backup', userId, error: error.message });
      throw error;
    }
  }

  async migrateUser(userId, data) {
    console.log(`\n🔄 Migrating user: ${userId}`);
    console.log('='.repeat(60));
    
    if (!data) {
      console.log('⏭️ No data to migrate, skipping');
      return { skipped: true };
    }

    try {
      const targetPath = `${this.config.targetCollection}/${userId}/${this.config.targetPath}`;
      
      const migrationData = {
        ...data,
        _migratedAt: serverTimestamp(),
        _migratedFrom: `${this.config.sourceCollection}/${userId}/${this.config.sourcePath}`,
        _migrationVersion: '1.0.0'
      };
      
      console.log(`📍 Target path: ${targetPath}`);
      console.log(`📦 Migrating ${Object.keys(migrationData).length} fields`);
      
      if (this.config.dryRun) {
        console.log('🔍 DRY RUN: Would write to:', targetPath);
        console.log('🔍 DRY RUN: Data preview:', {
          currentCycle: migrationData.currentCycle,
          hasFocusAreas: !!migrationData.currentPlan?.focusAreas,
          assessmentCount: migrationData.assessmentHistory?.length || 0
        });
        return { dryRun: true, targetPath, dataSize: Object.keys(migrationData).length };
      }
      
      const docRef = doc(this.db, targetPath);
      await setDoc(docRef, migrationData);
      
      console.log('✅ Migration successful!');
      
      this.migrationLog.push({
        step: 'migration',
        userId,
        sourcePath: `${this.config.sourceCollection}/${userId}/${this.config.sourcePath}`,
        targetPath,
        timestamp: new Date().toISOString(),
        fieldsCount: Object.keys(migrationData).length
      });
      
      return { success: true, targetPath };
    } catch (error) {
      console.error(`❌ Error migrating user ${userId}:`, error);
      this.errors.push({ step: 'migration', userId, error: error.message });
      throw error;
    }
  }

  async verifyMigration(userId, originalData) {
    console.log(`\n🔍 Verifying migration for user: ${userId}`);
    
    try {
      const targetPath = `${this.config.targetCollection}/${userId}/${this.config.targetPath}`;
      const docRef = doc(this.db, targetPath);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log('❌ VERIFICATION FAILED: Document does not exist!');
        return { success: false, reason: 'Document not found' };
      }
      
      const migratedData = docSnap.data();
      
      const checks = {
        currentCycle: originalData.currentCycle === migratedData.currentCycle,
        hasCurrentPlan: !!migratedData.currentPlan,
        hasFocusAreas: !!migratedData.currentPlan?.focusAreas,
        focusAreaCount: originalData.currentPlan?.focusAreas?.length === migratedData.currentPlan?.focusAreas?.length,
        assessmentCount: originalData.assessmentHistory?.length === migratedData.assessmentHistory?.length,
        planHistoryCount: originalData.planHistory?.length === migratedData.planHistory?.length,
      };
      
      const allChecksPassed = Object.values(checks).every(v => v === true);
      
      console.log('📊 Verification Results:');
      Object.entries(checks).forEach(([key, passed]) => {
        console.log(`   ${passed ? '✅' : '❌'} ${key}`);
      });
      
      if (allChecksPassed) {
        console.log('✅ VERIFICATION PASSED!');
      } else {
        console.log('⚠️ VERIFICATION ISSUES DETECTED');
      }
      
      this.migrationLog.push({
        step: 'verification',
        userId,
        checks,
        allChecksPassed,
        timestamp: new Date().toISOString()
      });
      
      return { success: allChecksPassed, checks };
    } catch (error) {
      console.error(`❌ Error verifying user ${userId}:`, error);
      this.errors.push({ step: 'verification', userId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async run() {
    console.log('\n');
    console.log('='.repeat(80));
    console.log('🚀 DEVELOPMENT PLAN MIGRATION');
    console.log('='.repeat(80));
    console.log(`From: ${this.config.sourceCollection}/${'{userId}'}/${this.config.sourcePath}`);
    console.log(`To:   ${this.config.targetCollection}/${'{userId}'}/${this.config.targetPath}`);
    console.log(`Mode: ${this.config.dryRun ? '🔍 DRY RUN' : '🔥 LIVE MIGRATION'}`);
    console.log('='.repeat(80));
    console.log('\n');

    try {
      await this.initialize();
      
      const userIds = await this.discoverUsers();
      
      if (userIds.length === 0) {
        console.log('\n⚠️ No users found to migrate!');
        return { success: false, reason: 'No users found' };
      }
      
      const results = [];
      
      for (const userId of userIds) {
        console.log('\n' + '━'.repeat(80));
        console.log(`👤 Processing User: ${userId}`);
        console.log('━'.repeat(80));
        
        try {
          const originalData = await this.backupUserData(userId);
          const migrationResult = await this.migrateUser(userId, originalData);
          
          let verificationResult = null;
          if (!this.config.dryRun && this.config.verifyAfterMigration) {
            verificationResult = await this.verifyMigration(userId, originalData);
          }
          
          results.push({
            userId,
            backup: !!originalData,
            migration: migrationResult,
            verification: verificationResult
          });
          
        } catch (error) {
          console.error(`❌ Failed to process user ${userId}:`, error);
          results.push({
            userId,
            error: error.message
          });
        }
      }
      
      this.printSummary(results);
      
      return {
        success: true,
        results,
        log: this.migrationLog,
        errors: this.errors,
        backup: this.backupData
      };
      
    } catch (error) {
      console.error('\n❌ MIGRATION FAILED:', error);
      return {
        success: false,
        error: error.message,
        log: this.migrationLog,
        errors: this.errors,
        backup: this.backupData
      };
    }
  }

  printSummary(results) {
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    
    const total = results.length;
    const successful = results.filter(r => r.migration?.success || r.migration?.dryRun).length;
    const failed = results.filter(r => r.error).length;
    const verified = results.filter(r => r.verification?.success).length;
    
    console.log(`\n✨ Total Users: ${total}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    if (this.config.verifyAfterMigration && !this.config.dryRun) {
      console.log(`🔍 Verified: ${verified}`);
    }
    
    if (this.errors.length > 0) {
      console.log('\n⚠️ ERRORS ENCOUNTERED:');
      this.errors.forEach((error, idx) => {
        console.log(`   ${idx + 1}. ${error.step}: ${error.error}`);
      });
    }
    
    if (this.config.dryRun) {
      console.log('\n🔍 DRY RUN COMPLETE - No changes made');
      console.log('💡 Set dryRun: false to perform actual migration');
    } else {
      console.log('\n✅ MIGRATION COMPLETE!');
      console.log('💾 Backup data saved in memory');
    }
    
    console.log('='.repeat(80));
    console.log('\n');
  }

  exportBackup() {
    const backup = {
      timestamp: new Date().toISOString(),
      source: `${this.config.sourceCollection}/${'{userId}'}/${this.config.sourcePath}`,
      data: this.backupData,
      log: this.migrationLog
    };
    
    console.log('\n💾 BACKUP DATA:');
    console.log(JSON.stringify(backup, null, 2));
    
    return backup;
  }
}

// ============================================
// AUTO-EXECUTE
// ============================================

async function main() {
  // Check if Firebase config is updated
  if (FIREBASE_CONFIG.apiKey === "YOUR_API_KEY") {
    console.log('\n');
    console.log('⚠️ '.repeat(40));
    console.log('❌ ERROR: Firebase credentials not configured!');
    console.log('⚠️ '.repeat(40));
    console.log('\n');
    console.log('📝 REQUIRED STEPS:');
    console.log('   1. Open this file: migrate.mjs');
    console.log('   2. Update FIREBASE_CONFIG (lines 19-26) with your actual credentials');
    console.log('   3. Get credentials from: https://console.firebase.google.com');
    console.log('      → Project Settings → Your apps → Config');
    console.log('   4. Save the file');
    console.log('   5. Run again: node migrate.mjs');
    console.log('\n');
    process.exit(1);
  }

  // Run migration
  const migration = new DevelopmentPlanMigration(MIGRATION_CONFIG);
  const result = await migration.run();
  
  // Offer to export backup
  if (result.success) {
    console.log('\n💡 TIP: Backup data is saved in memory during this run');
    console.log('    To export to JSON file, modify script to call:');
    console.log('    migration.exportBackup()');
  }
  
  process.exit(result.success ? 0 : 1);
}

// Run the migration
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export { DevelopmentPlanMigration, MIGRATION_CONFIG };
