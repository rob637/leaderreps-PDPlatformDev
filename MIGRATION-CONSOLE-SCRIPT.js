// MIGRATION INSTRUCTIONS
// You need to run this from WITHIN the Content Management screen

// 1. Go to: https://leaderreps-pd-platform.web.app
// 2. Login as admin and enable Developer Mode
// 3. Navigate to "Content Management" from the menu
// 4. Open browser DevTools (F12)
// 5. Go to the "Console" tab
// 6. Copy and paste this entire script
// 7. Press Enter to run

console.log('🚀 Starting migration...');

// Helper function to map tiers
function mapTier(oldTier) {
  const tierMap = {
    'free': 'free',
    'basic': 'basic', 
    'pro': 'professional',
    'professional': 'professional',
    'premium': 'professional',
    'elite': 'elite',
    'advanced': 'elite'
  };
  return tierMap[String(oldTier).toLowerCase()] || 'free';
}

// Migration function  
(async function migrateContent() {
  // Try to get db from React DevTools fiber
  let db = null;
  
  // Method 1: Try to find db in React fiber tree
  const rootElement = document.getElementById('root');
  if (rootElement && rootElement._reactRootContainer) {
    console.log('Found React root, searching for db...');
  }
  
  // Method 2: Wait for user to expose db
  console.log('⚠️  Need database access.');
  console.log('Please run this command first to expose the db:');
  console.log('window.__MIGRATION_DB__ = document.querySelector("[data-db]")?.__db__;');
  console.log('Then run this migration script again.');
  
  if (!window.__MIGRATION_DB__) {
    console.error('❌ Database not available. See instructions above.');
    return;
  }
  
  db = window.__MIGRATION_DB__;
  
  try {
    // Get reading catalog
    const readingRef = doc(db, 'metadata', 'reading_catalog');
    const readingDoc = await getDoc(readingRef);
    const readingData = readingDoc.data();
    const readings = readingData?.items || {};
    
    console.log(`📚 Found ${Object.keys(readings).length} readings`);
    
    let count = 0;
    const readingsRef = collection(db, 'content_readings');
    
    for (const [key, reading] of Object.entries(readings)) {
      await addDoc(readingsRef, {
        title: reading.title || key,
        description: reading.description || '',
        url: reading.url || reading.link || '',
        tier: mapTier(reading.tier || 'free'),
        category: reading.category || reading.theme || 'general',
        isActive: reading.isActive !== false,
        thumbnail: reading.thumbnail || reading.image || '',
        order: reading.order || 999,
        dateAdded: serverTimestamp(),
        dateModified: serverTimestamp(),
        metadata: {
          originalKey: key,
          author: reading.author || '',
          duration: reading.duration || '',
          source: reading.source || ''
        }
      });
      count++;
      if (count % 10 === 0) console.log(`   Migrated ${count} readings...`);
    }
    
    console.log(`✅ Migrated ${count} readings`);
    
    // Get video catalog
    try {
      const videoRef = doc(db, 'metadata', 'video_catalog');
      const videoDoc = await getDoc(videoRef);
      if (videoDoc.exists()) {
        const videoData = videoDoc.data();
        const videos = videoData?.items || [];
        
        console.log(`🎥 Found ${videos.length} videos`);
        
        let vCount = 0;
        const videosRef = collection(db, 'content_videos');
        
        for (const video of videos) {
          await addDoc(videosRef, {
            title: video.title || 'Untitled',
            description: video.description || '',
            url: video.url || video.videoUrl || '',
            tier: mapTier(video.tier || 'free'),
            category: video.category || 'general',
            isActive: video.isActive !== false,
            thumbnail: video.thumbnail || '',
            order: video.order || 999,
            dateAdded: serverTimestamp(),
            dateModified: serverTimestamp(),
            metadata: {
              duration: video.duration || '',
              videoId: video.videoId || '',
              speaker: video.speaker || ''
            }
          });
          vCount++;
        }
        console.log(`✅ Migrated ${vCount} videos`);
      }
    } catch (e) {
      console.log('ℹ️  No videos to migrate');
    }
    
    // Get course catalog
    try {
      const courseRef = doc(db, 'metadata', 'course_library');
      const courseDoc = await getDoc(courseRef);
      if (courseDoc.exists()) {
        const courseData = courseDoc.data();
        const courses = courseData?.items || [];
        
        console.log(`📖 Found ${courses.length} courses`);
        
        let cCount = 0;
        const coursesRef = collection(db, 'content_courses');
        
        for (const course of courses) {
          await addDoc(coursesRef, {
            title: course.title || 'Untitled',
            description: course.description || '',
            url: course.url || '',
            tier: mapTier(course.tier || 'free'),
            category: course.category || 'leadership',
            isActive: course.isActive !== false,
            thumbnail: course.thumbnail || '',
            order: course.order || 999,
            dateAdded: serverTimestamp(),
            dateModified: serverTimestamp(),
            metadata: {
              modules: course.modules || [],
              duration: course.duration || '',
              instructor: course.instructor || ''
            }
          });
          cCount++;
        }
        console.log(`✅ Migrated ${cCount} courses`);
      }
    } catch (e) {
      console.log('ℹ️  No courses to migrate');
    }
    
    console.log('\n✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})(); // Self-executing async function
