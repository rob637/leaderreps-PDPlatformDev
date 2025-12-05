#!/usr/bin/env node
/**
 * Development Plan Report Generator
 * Generates a formatted report of all Development Plan weeks from Firestore
 * 
 * Usage: node scripts/generate-devplan-report.cjs
 * 
 * Outputs a formatted table with each week on one line for easy review.
 * Can be extended to output CSV, JSON, or other formats.
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (e) {
  console.error('❌ Error: serviceAccountKey.json not found.');
  console.error('   Please ensure the file exists at:', serviceAccountPath);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgCyan: '\x1b[46m'
};

// Phase colors mapping
const phaseColors = {
  'QuickStart': colors.green,
  'Spaced Learning': colors.yellow,
  'Clear Performance': colors.cyan,
  'Impact': colors.magenta,
  'default': colors.white
};

// Helper to pad strings for table alignment
const pad = (str, len, align = 'left') => {
  const s = String(str || '').slice(0, len);
  const padding = len - s.length;
  if (align === 'center') {
    const leftPad = Math.floor(padding / 2);
    return ' '.repeat(leftPad) + s + ' '.repeat(padding - leftPad);
  }
  return align === 'right' ? ' '.repeat(padding) + s : s + ' '.repeat(padding);
};

// Helper to truncate strings
const truncate = (str, len) => {
  const s = String(str || '');
  return s.length > len ? s.slice(0, len - 2) + '..' : s;
};

// Count array items safely
const countItems = (arr) => Array.isArray(arr) ? arr.length : 0;

async function generateReport() {
  console.log('\n' + colors.bright + colors.bgBlue + '  DEVELOPMENT PLAN REPORT  ' + colors.reset);
  console.log(colors.dim + '  Generated: ' + new Date().toLocaleString() + colors.reset + '\n');

  try {
    // Fetch all weeks from Firestore
    const weeksSnapshot = await db.collection('development_plan_v1')
      .orderBy('weekNumber', 'asc')
      .get();

    if (weeksSnapshot.empty) {
      console.log(colors.yellow + '⚠️  No weeks found in development_plan_v1 collection.' + colors.reset);
      process.exit(0);
    }

    const weeks = weeksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(colors.bright + `Found ${weeks.length} weeks in the Development Plan\n` + colors.reset);

    // Column definitions
    const cols = {
      week: 4,
      title: 24,
      focus: 18,
      phase: 18,
      skills: 28,
      pillars: 14,
      level: 12,
      time: 5,
      content: 7,
      community: 9,
      coaching: 8,
      reps: 4,
      status: 8
    };

    // Print header
    const separator = '─'.repeat(Object.values(cols).reduce((a, b) => a + b, 0) + Object.keys(cols).length * 3 - 1);
    
    console.log(colors.dim + separator + colors.reset);
    console.log(
      colors.bright +
      '│ ' + pad('Wk', cols.week, 'center') +
      ' │ ' + pad('Title', cols.title) +
      ' │ ' + pad('Focus', cols.focus) +
      ' │ ' + pad('Phase', cols.phase) +
      ' │ ' + pad('Skills', cols.skills) +
      ' │ ' + pad('Pillars', cols.pillars) +
      ' │ ' + pad('Difficulty', cols.level) +
      ' │ ' + pad('Min', cols.time, 'center') +
      ' │ ' + pad('Content', cols.content, 'center') +
      ' │ ' + pad('Community', cols.community, 'center') +
      ' │ ' + pad('Coaching', cols.coaching, 'center') +
      ' │ ' + pad('Reps', cols.reps, 'center') +
      ' │ ' + pad('Status', cols.status) + ' │' +
      colors.reset
    );
    console.log(colors.dim + separator + colors.reset);

    // Print each week
    weeks.forEach(week => {
      const phaseColor = phaseColors[week.phase] || phaseColors.default;
      const statusColor = week.isDraft ? colors.yellow : colors.green;
      const statusText = week.isDraft ? 'DRAFT' : 'ACTIVE';
      
      const skillsList = Array.isArray(week.skills) ? week.skills.join(', ') : '';
      const pillarsList = Array.isArray(week.pillars) ? week.pillars.join(', ') : '';

      console.log(
        '│ ' + colors.bright + pad(week.weekNumber, cols.week, 'center') + colors.reset +
        ' │ ' + pad(truncate(week.title, cols.title), cols.title) +
        ' │ ' + pad(truncate(week.focus, cols.focus), cols.focus) +
        ' │ ' + phaseColor + pad(truncate(week.phase, cols.phase), cols.phase) + colors.reset +
        ' │ ' + pad(truncate(skillsList, cols.skills), cols.skills) +
        ' │ ' + pad(truncate(pillarsList, cols.pillars), cols.pillars) +
        ' │ ' + pad(truncate(week.difficultyLevel, cols.level), cols.level) +
        ' │ ' + pad(week.estimatedTimeMinutes || '-', cols.time, 'center') +
        ' │ ' + pad(countItems(week.content), cols.content, 'center') +
        ' │ ' + pad(countItems(week.community), cols.community, 'center') +
        ' │ ' + pad(countItems(week.coaching), cols.coaching, 'center') +
        ' │ ' + pad(countItems(week.reps), cols.reps, 'center') +
        ' │ ' + statusColor + pad(statusText, cols.status) + colors.reset + ' │'
      );
    });

    console.log(colors.dim + separator + colors.reset);

    // Summary statistics
    console.log('\n' + colors.bright + '📊 SUMMARY STATISTICS' + colors.reset);
    console.log(colors.dim + '─'.repeat(50) + colors.reset);
    
    const totalContent = weeks.reduce((sum, w) => sum + countItems(w.content), 0);
    const totalCommunity = weeks.reduce((sum, w) => sum + countItems(w.community), 0);
    const totalCoaching = weeks.reduce((sum, w) => sum + countItems(w.coaching), 0);
    const totalReps = weeks.reduce((sum, w) => sum + countItems(w.reps), 0);
    const totalTime = weeks.reduce((sum, w) => sum + (w.estimatedTimeMinutes || 0), 0);
    const activeWeeks = weeks.filter(w => !w.isDraft).length;
    const draftWeeks = weeks.filter(w => w.isDraft).length;

    // Phase breakdown
    const phaseBreakdown = {};
    weeks.forEach(w => {
      phaseBreakdown[w.phase] = (phaseBreakdown[w.phase] || 0) + 1;
    });

    // Pillar breakdown
    const pillarBreakdown = {};
    weeks.forEach(w => {
      (w.pillars || []).forEach(p => {
        pillarBreakdown[p] = (pillarBreakdown[p] || 0) + 1;
      });
    });

    // Difficulty breakdown
    const difficultyBreakdown = {};
    weeks.forEach(w => {
      difficultyBreakdown[w.difficultyLevel] = (difficultyBreakdown[w.difficultyLevel] || 0) + 1;
    });

    console.log(`  Total Weeks:      ${colors.bright}${weeks.length}${colors.reset} (${colors.green}${activeWeeks} active${colors.reset}, ${colors.yellow}${draftWeeks} draft${colors.reset})`);
    console.log(`  Total Time:       ${colors.bright}${totalTime} minutes${colors.reset} (${(totalTime / 60).toFixed(1)} hours)`);
    console.log(`  Content Items:    ${colors.bright}${totalContent}${colors.reset}`);
    console.log(`  Community Items:  ${colors.bright}${totalCommunity}${colors.reset}`);
    console.log(`  Coaching Items:   ${colors.bright}${totalCoaching}${colors.reset}`);
    console.log(`  Daily Reps:       ${colors.bright}${totalReps}${colors.reset}`);

    console.log('\n' + colors.bright + '📈 BY PHASE:' + colors.reset);
    Object.entries(phaseBreakdown).forEach(([phase, count]) => {
      const phaseColor = phaseColors[phase] || phaseColors.default;
      console.log(`  ${phaseColor}${pad(phase, 20)}${colors.reset} ${count} week${count !== 1 ? 's' : ''}`);
    });

    console.log('\n' + colors.bright + '🎯 BY PILLAR:' + colors.reset);
    Object.entries(pillarBreakdown).forEach(([pillar, count]) => {
      console.log(`  ${pad(pillar, 20)} ${count} week${count !== 1 ? 's' : ''}`);
    });

    console.log('\n' + colors.bright + '📊 BY DIFFICULTY:' + colors.reset);
    Object.entries(difficultyBreakdown).forEach(([level, count]) => {
      console.log(`  ${pad(level, 20)} ${count} week${count !== 1 ? 's' : ''}`);
    });

    // Detailed view option
    if (process.argv.includes('--detailed') || process.argv.includes('-d')) {
      console.log('\n' + colors.bright + colors.bgCyan + '  DETAILED WEEK BREAKDOWN  ' + colors.reset + '\n');
      
      weeks.forEach(week => {
        const phaseColor = phaseColors[week.phase] || phaseColors.default;
        console.log(colors.bright + `\n${'═'.repeat(60)}` + colors.reset);
        console.log(colors.bright + `WEEK ${week.weekNumber}: ${week.title}` + colors.reset);
        console.log(`${'─'.repeat(60)}`);
        console.log(`Focus: ${week.focus} | Phase: ${phaseColor}${week.phase}${colors.reset} | ${week.difficultyLevel}`);
        console.log(`Time: ${week.estimatedTimeMinutes || '-'} min | Pillars: ${(week.pillars || []).join(', ')}`);
        console.log(`Skills: ${(week.skills || []).join(', ')}`);
        
        if (week.description) {
          console.log(`\n${colors.dim}Description:${colors.reset} ${week.description}`);
        }

        if (week.content && week.content.length > 0) {
          console.log(`\n${colors.cyan}Content (${week.content.length}):${colors.reset}`);
          week.content.forEach(c => {
            const req = c.isRequiredContent ? colors.green + '✓' + colors.reset : colors.dim + '○' + colors.reset;
            console.log(`  ${req} [${c.contentItemType}] ${c.contentItemLabel}`);
          });
        }

        if (week.community && week.community.length > 0) {
          console.log(`\n${colors.magenta}Community (${week.community.length}):${colors.reset}`);
          week.community.forEach(c => {
            console.log(`  ○ [${c.communityItemType}] ${c.communityItemLabel} (${c.recommendedWeekDay || 'Any day'})`);
          });
        }

        if (week.coaching && week.coaching.length > 0) {
          console.log(`\n${colors.yellow}Coaching (${week.coaching.length}):${colors.reset}`);
          week.coaching.forEach(c => {
            const opt = c.isOptionalCoachingItem ? colors.dim + '(optional)' + colors.reset : '';
            console.log(`  ○ [${c.coachingItemType}] ${c.coachingItemLabel} ${opt}`);
          });
        }

        if (week.reps && week.reps.length > 0) {
          console.log(`\n${colors.green}Daily Reps (${week.reps.length}):${colors.reset}`);
          week.reps.forEach(r => {
            const req = r.isRequired ? colors.green + '✓' + colors.reset : colors.dim + '○' + colors.reset;
            console.log(`  ${req} ${r.repLabel}`);
          });
        }

        if (week.reflectionPrompt) {
          console.log(`\n${colors.blue}Reflection:${colors.reset} ${week.reflectionPrompt}`);
        }
      });
    }

    console.log('\n' + colors.dim + '─'.repeat(50) + colors.reset);
    console.log(colors.dim + 'Tip: Run with --detailed or -d flag for expanded view' + colors.reset);
    console.log(colors.dim + 'Example: node scripts/generate-devplan-report.cjs --detailed\n' + colors.reset);

  } catch (error) {
    console.error(colors.red + '❌ Error generating report:' + colors.reset, error.message);
    process.exit(1);
  }

  process.exit(0);
}

generateReport();
