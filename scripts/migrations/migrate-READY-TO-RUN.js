// MIGRATION SCRIPT: leadership_plan → development_plan
// READY TO RUN VERSION
// Just update Firebase config and run: node migrate-READY-TO-RUN.js

require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp 
} = require('firebase/firestore');

// ============================================
// CONFIGURATION - UPDATE THIS!
// ============================================

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
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
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    console.log('✅ Firebase initialized');
  }
  
  async discoverUsers() {
    console.log('📋 STEP 1: Discovering users...');
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
// AUTO-EXECUTE ON RUN
// ============================================

async function main() {
  // Check if Firebase config is updated
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.log('\n');
    console.log('⚠️ '.repeat(40));
    console.log('❌ ERROR: Firebase credentials not configured!');
    console.log('⚠️ '.repeat(40));
    console.log('\n');
    console.log('📝 REQUIRED STEPS:');
    console.log('   1. Make sure you have a .env file with your Firebase credentials.');
    console.log('   2. Update FIREBASE_CONFIG (lines 10-17) with your actual credentials');
    console.log('   3. Get credentials from: https://console.firebase.google.com');
    console.log('   4. Save the file');
    console.log('   5. Run again: node migrate-READY-TO-RUN.js');
    console.log('\n');
    process.exit(1);
  }

  // Run migration
  const migration = new DevelopmentPlanMigration(MIGRATION_CONFIG);
  const result = await migration.run();
  
  // Offer to export backup
  if (result.success) {
    console.log('\n💡 TIP: To export backup data, run this in Node REPL:');
    console.log('   const { DevelopmentPlanMigration } = require("./migrate-READY-TO-RUN.js");');
    console.log('   const m = new DevelopmentPlanMigration(...);');
    console.log('   m.exportBackup();');
  }
  
  process.exit(result.success ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { DevelopmentPlanMigration, MIGRATION_CONFIG };