const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const csv = require('csv-parse/sync');

// Initialize Firebase Admin
const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// Content title to ID mapping - will be populated from CMS
let contentMap = {};

// Fuzzy match helper - finds best match for a title in the content map
function findContentId(title, type) {
  if (!title) return null;
  
  const normalizedTitle = title.toLowerCase().trim();
  
  // First try exact match
  if (contentMap[normalizedTitle]) {
    return contentMap[normalizedTitle];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(contentMap)) {
    if (key.includes(normalizedTitle) || normalizedTitle.includes(key)) {
      return value;
    }
  }
  
  // Try matching key terms
  const keyTerms = normalizedTitle.split(/\s+/).filter(t => t.length > 3);
  for (const [key, value] of Object.entries(contentMap)) {
    const matches = keyTerms.filter(term => key.includes(term));
    if (matches.length >= 2 || (matches.length === 1 && keyTerms.length === 1)) {
      return value;
    }
  }
  
  return null;
}

// Load content from CMS collections
async function loadContentMap() {
  console.log('📚 Loading CMS content for ID mapping...');
  
  const collections = ['cms_content', 'content', 'programs', 'tools', 'reading_catalog'];
  
  for (const collectionName of collections) {
    try {
      const snapshot = await db.collection(collectionName).get();
      snapshot.forEach(doc => {
        const data = doc.data();
        const title = (data.title || data.name || '').toLowerCase().trim();
        if (title) {
          contentMap[title] = doc.id;
          // Also add variations
          if (data.shortTitle) {
            contentMap[data.shortTitle.toLowerCase().trim()] = doc.id;
          }
        }
      });
      console.log(`   ✓ Loaded ${snapshot.size} items from ${collectionName}`);
    } catch (error) {
      console.log(`   ⚠ Could not load ${collectionName}: ${error.message}`);
    }
  }
  
  console.log(`📚 Content map loaded with ${Object.keys(contentMap).length} entries.`);
}

async function importDailyPlan() {
  console.log('🚀 Starting Daily Plan Import...');

  // First, load the content map for ID resolution
  await loadContentMap();

  // 1. Read CSV
  const csvPath = path.join(__dirname, '../8-week.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  // Parse as arrays to handle double-header structure
  const records = csv.parse(fileContent, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true
  });

  console.log(`📊 Found ${records.length} rows in CSV.`);

  // 2. Process Records
  const batchSize = 400;
  let batch = db.batch();
  let count = 0;
  let totalImported = 0;
  let unmappedContent = [];

  // Skip Row 0 (Main Headers) and Row 1 (Sub Headers)
  // Start from Row 2
  for (let i = 2; i < records.length; i++) {
    const row = records[i];
    
    // Parse Day Number (Col 0: Sys Day)
    let dayNumber = parseInt(row[0]);
    
    // Handle Prep Days (Col 2: Week:Day)
    if (isNaN(dayNumber)) {
        const weekDay = parseInt(row[2]);
        if (!isNaN(weekDay)) {
            dayNumber = weekDay;
        } else {
            continue;
        }
    }

    const weekNumber = parseInt(row[1]) || 0;
    
    // Construct Document ID
    const dayId = dayNumber >= 0 
        ? `day-${String(dayNumber).padStart(3, '0')}` 
        : `day-${String(dayNumber)}`;

    // --- Parse Dashboard Flags (Cols 4-9) ---
    // 4: Weekly Focus, 5: Grounding Rep, 6: Win The Day, 7: Daily Reps, 8: Notifications, 9: PM Reflection
    
    const dashboard = {
        showWeeklyFocus: !!row[4], 
        showGroundingRep: (row[5] || '').toLowerCase().includes('available') && !(row[5] || '').toLowerCase().includes('lis builder'),
        showLISBuilder: (row[5] || '').toLowerCase().includes('lis builder'),
        showWinTheDay: (row[6] || '').toLowerCase().includes('available'),
        showDailyReps: !!(row[7] || '').trim(),
        showNotifications: (row[8] || '').toLowerCase().includes('yes') || (row[8] || '').toLowerCase().includes('remind'),
        notificationText: row[8] || '', // Store the raw text for display
        showPMReflection: (row[9] || '').toLowerCase().includes('yes') || (row[9] || '').toLowerCase().includes('available'),
    };

    // --- Parse Actions (Cols 12-13) ---
    // 12: This Week's Actions, 13: Daily Reps
    const actions = [];
    
    if (row[12]) {
        const items = row[12].split(/[\n*•]/).map(s => s.trim()).filter(s => s && s.length > 2);
        items.forEach((item, idx) => {
            actions.push({
                id: `action-${dayId}-w-${idx}`,
                type: 'weekly_action',
                label: item.replace(/^[-*•]\s*/, ''),
                isCompleted: false
            });
        });
    }

    if (row[13]) {
        const items = row[13].split(/[\n*•]/).map(s => s.trim()).filter(s => s && s.length > 2);
        items.forEach((item, idx) => {
            actions.push({
                id: `action-${dayId}-d-${idx}`,
                type: 'daily_rep',
                label: item.replace(/^[-*•]\s*/, ''),
                isCompleted: false
            });
        });
    }

    // --- Parse Content (Cols 15-17) with ID mapping ---
    // 15: Courses, 16: Read & Reps, 17: Media
    const content = [];
    
    if (row[15]) {
      const id = findContentId(row[15], 'course');
      content.push({ 
        type: 'course', 
        title: row[15],
        id: id || `course-${dayId}`,
        isHiddenUntilUnlocked: true
      });
      if (!id) unmappedContent.push({ day: dayNumber, type: 'course', title: row[15] });
    }
    if (row[16]) {
      const id = findContentId(row[16], 'reading');
      content.push({ 
        type: 'reading', 
        title: row[16],
        id: id || `reading-${dayId}`,
        isHiddenUntilUnlocked: true
      });
      if (!id) unmappedContent.push({ day: dayNumber, type: 'reading', title: row[16] });
    }
    if (row[17]) {
      const id = findContentId(row[17], 'media');
      content.push({ 
        type: 'media', 
        title: row[17],
        id: id || `media-${dayId}`,
        isHiddenUntilUnlocked: true
      });
      if (!id) unmappedContent.push({ day: dayNumber, type: 'media', title: row[17] });
    }

    // --- Parse Community (Cols 18-19) ---
    const community = [];
    if (row[18]) community.push({ type: 'community', title: row[18], id: findContentId(row[18], 'community') });
    if (row[19]) community.push({ type: 'community', title: row[19], id: findContentId(row[19], 'community') });

    // --- Parse Coaching (Cols 20-21) ---
    const coaching = [];
    if (row[20]) coaching.push({ type: 'coaching', title: row[20], id: findContentId(row[20], 'coaching') });
    if (row[21]) coaching.push({ type: 'coaching', title: row[21], id: findContentId(row[21], 'coaching') });

    // --- Parse Locker (Cols 22-27) ---
    const locker = {
      showProfile: (row[22] || '').toLowerCase().includes('complete') || (row[22] || '').toLowerCase().includes('yes'),
      showReminders: (row[23] || '').toLowerCase().includes('yes') || (row[23] || '').toLowerCase().includes('remind'),
      showAMWins: (row[24] || '').toLowerCase().includes('yes'),
      showDailyReps: (row[25] || '').toLowerCase().includes('yes'),
      showScorecard: (row[26] || '').toLowerCase().includes('yes'),
      showReflection: (row[27] || '').toLowerCase().includes('yes'),
    };

    const docData = {
        dayNumber: dayNumber,
        weekNumber: weekNumber,
        title: row[3] || `Day ${dayNumber}`,
        focus: row[11] || row[4] || '', // Col 11 is Dev Plan -> Weekly Focus, fallback to Col 4
        description: row[3] || '',
        
        actions: actions,
        content: content,
        community: community,
        coaching: coaching,
        dashboard: dashboard,
        locker: locker,
        
        isWeekend: (dayNumber > 0 && (dayNumber % 7 === 6 || dayNumber % 7 === 0)),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = db.collection('daily_plan_v1').doc(dayId);
    batch.set(docRef, docData);
    
    count++;
    totalImported++;

    if (count >= batchSize) {
        await batch.commit();
        console.log(`💾 Committed batch of ${count} records.`);
        batch = db.batch();
        count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`💾 Committed final batch of ${count} records.`);
  }

  console.log(`✅ Import Complete! Imported ${totalImported} days.`);
  
  if (unmappedContent.length > 0) {
    console.log(`\n⚠️  ${unmappedContent.length} content items could not be mapped to CMS IDs:`);
    unmappedContent.forEach(item => {
      console.log(`   Day ${item.day} | ${item.type}: "${item.title}"`);
    });
    console.log('\nTo fix: Add these items to CMS or create a manual mapping.');
  }
}

importDailyPlan().catch(console.error);
