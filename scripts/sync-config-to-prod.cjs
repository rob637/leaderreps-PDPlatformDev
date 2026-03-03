#!/usr/bin/env node
/**
 * Sync Config/Structure FROM Dev → Test → Prod
 * 
 * USE THIS FOR:
 *   ✅ Feature flags (config/*)
 *   ✅ Daily Plan structure changes (daily_plan_v1)
 *   ✅ Development Plan structure changes (development_plan_v1)
 *   ✅ System LOVs (system_lovs)
 *   ✅ Coaching session types
 *   ✅ Community session types
 * 
 * This is the CORRECT direction for configuration tied to code changes.
 * Developers make structural changes in Dev, then promote to Test, then Prod.
 * 
 * ⚠️  WARNING: This will overwrite ALL app data including content!
 *     If you've been editing content in Prod, export Prod first!
 * 
 * USAGE:
 *   npm run data:sync-config-to-prod
 *   npm run data:sync-config-to-prod -- --to-test-only
 */

const { execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

const args = process.argv.slice(2);
const toTestOnly = args.includes('--to-test-only');
const skipConfirm = args.includes('--yes');

console.log(`
╔════════════════════════════════════════════════════════════╗
║       SYNC CONFIG TO PRODUCTION                            ║
║       Direction: Dev → Test → Prod                         ║
╚════════════════════════════════════════════════════════════╝
`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askConfirmation() {
  return new Promise((resolve) => {
    if (skipConfirm) {
      resolve(true);
      return;
    }
    
    console.log(`
⚠️  WARNING: This will sync ALL app data from Dev to ${toTestOnly ? 'Test' : 'Test + Prod'}.

   If you have been editing CONTENT in Production (videos, readings, etc.),
   those changes will be OVERWRITTEN.

   If that's the case, run this first:
   npm run data:sync-content-from-prod
   
`);
    
    rl.question('Are you sure you want to continue? (yes/no): ', (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function main() {
  const confirmed = await askConfirmation();
  rl.close();
  
  if (!confirmed) {
    console.log('❌ Cancelled');
    process.exit(0);
  }

  console.log('\n📤 Step 1: Exporting from Dev...\n');

  try {
    execSync('node scripts/migrate-app-data.cjs export dev', { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
  } catch (error) {
    console.error('❌ Export failed');
    process.exit(1);
  }

  // Find the export file (today's date)
  const fs = require('fs');
  const today = new Date().toISOString().split('T')[0];
  const exportFile = `./data-exports/app-data-dev-${today}.json`;

  if (!fs.existsSync(path.resolve(__dirname, '..', exportFile))) {
    console.error(`❌ Export file not found: ${exportFile}`);
    process.exit(1);
  }

  console.log('\n📥 Step 2: Importing to Test...\n');
  try {
    execSync(`node scripts/migrate-app-data.cjs import test ${exportFile}`, { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
  } catch (error) {
    console.error('❌ Import to Test failed');
    process.exit(1);
  }

  if (!toTestOnly) {
    console.log('\n📥 Step 3: Importing to Prod...\n');
    try {
      execSync(`node scripts/migrate-app-data.cjs import prod ${exportFile}`, { 
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..')
      });
    } catch (error) {
      console.error('❌ Import to Prod failed');
      process.exit(1);
    }
  }

  console.log(`
════════════════════════════════════════════════════════════
✅ CONFIG SYNC COMPLETE
════════════════════════════════════════════════════════════
   Source: Dev
   Targets: ${toTestOnly ? 'Test only' : 'Test + Prod'}
   Export: ${exportFile}

   All environments now have the same configuration!
════════════════════════════════════════════════════════════
`);
}

main();
