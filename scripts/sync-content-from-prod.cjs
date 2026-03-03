#!/usr/bin/env node
/**
 * Sync Content FROM Production → Test → Dev
 * 
 * USE THIS FOR:
 *   ✅ Media Vault (media_assets)
 *   ✅ Content Library (content_library, content)
 *   ✅ Videos, Readings, Documents
 *   ✅ Skills taxonomy
 *   ✅ Video series
 * 
 * This is the CORRECT direction for content that is authored in Production.
 * Content authors work in Prod where CDN URLs and previews are real.
 * 
 * USAGE:
 *   npm run data:sync-content-from-prod
 *   npm run data:sync-content-from-prod -- --to-test-only
 *   npm run data:sync-content-from-prod -- --to-dev-only
 */

const { execSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const toTestOnly = args.includes('--to-test-only');
const toDevOnly = args.includes('--to-dev-only');

console.log(`
╔════════════════════════════════════════════════════════════╗
║       SYNC CONTENT FROM PRODUCTION                         ║
║       Direction: Prod → Test → Dev                         ║
╚════════════════════════════════════════════════════════════╝
`);

console.log('📤 Step 1: Exporting from Production...\n');

try {
  execSync('node scripts/migrate-app-data.cjs export prod', { 
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
const exportFile = `./data-exports/app-data-prod-${today}.json`;

if (!fs.existsSync(path.resolve(__dirname, '..', exportFile))) {
  console.error(`❌ Export file not found: ${exportFile}`);
  process.exit(1);
}

if (!toDevOnly) {
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
}

if (!toTestOnly) {
  console.log('\n📥 Step 3: Importing to Dev...\n');
  try {
    execSync(`node scripts/migrate-app-data.cjs import dev ${exportFile}`, { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
  } catch (error) {
    console.error('❌ Import to Dev failed');
    process.exit(1);
  }
}

console.log(`
════════════════════════════════════════════════════════════
✅ CONTENT SYNC COMPLETE
════════════════════════════════════════════════════════════
   Source: Production
   Targets: ${toTestOnly ? 'Test only' : toDevOnly ? 'Dev only' : 'Test + Dev'}
   Export: ${exportFile}

   All environments now have the same content!
════════════════════════════════════════════════════════════
`);
