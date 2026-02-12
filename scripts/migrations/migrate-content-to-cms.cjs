#!/usr/bin/env node
// migrate-content-to-cms.js
// Migrates existing content from metadata/reading_catalog to new CMS collections

const admin = require('firebase-admin');

// Initialize with application default credentials (works with Firebase CLI)
admin.initializeApp({
  projectId: 'leaderreps-pd-platform'
});

const db = admin.firestore();

async function migrateReadingCatalog() {
  console.log('📚 Starting migration of reading catalog...');
  
  try {
    // Get the old reading catalog
    const readingCatalogDoc = await db.collection('metadata').doc('reading_catalog').get();
    
    if (!readingCatalogDoc.exists) {
      console.log('❌ No reading_catalog found in metadata');
      return;
    }
    
    const catalogData = readingCatalogDoc.data();
    const items = catalogData?.items || {};
    
    if (Object.keys(items).length === 0) {
      console.log('❌ No items found in reading_catalog');
      return;
    }
    
    console.log(`Found ${Object.keys(items).length} readings to migrate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Migrate each reading
    for (const [key, reading] of Object.entries(items)) {
      try {
        // Map old structure to new CMS structure
        const newReading = {
          title: reading.title || key,
          description: reading.description || '',
          url: reading.url || reading.link || '',
          tier: mapTierToNew(reading.tier || reading.requiredTier || 'free'),
          category: reading.category || reading.theme || 'general',
          isActive: reading.isActive !== false, // Default to true
          thumbnail: reading.thumbnail || reading.image || '',
          order: reading.order || 999,
          dateAdded: admin.firestore.FieldValue.serverTimestamp(),
          dateModified: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            originalKey: key,
            author: reading.author || '',
            duration: reading.duration || reading.readingTime || '',
            source: reading.source || '',
            tags: reading.tags || []
          }
        };
        
        // Add to content_readings collection
        await db.collection('content_readings').add(newReading);
        successCount++;
        console.log(`✅ Migrated: ${newReading.title}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating ${key}:`, error.message);
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

async function migrateVideoCatalog() {
  console.log('\n🎥 Starting migration of video catalog...');
  
  try {
    // Get the old video catalog
    const videoCatalogDoc = await db.collection('metadata').doc('video_catalog').get();
    
    if (!videoCatalogDoc.exists) {
      console.log('ℹ️  No video_catalog found in metadata (this is okay)');
      return;
    }
    
    const catalogData = videoCatalogDoc.data();
    const items = catalogData?.items || [];
    
    if (items.length === 0) {
      console.log('ℹ️  No items found in video_catalog');
      return;
    }
    
    console.log(`Found ${items.length} videos to migrate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Migrate each video
    for (const video of items) {
      try {
        const newVideo = {
          title: video.title || 'Untitled Video',
          description: video.description || '',
          url: video.url || video.videoUrl || video.link || '',
          tier: mapTierToNew(video.tier || video.requiredTier || 'free'),
          category: video.category || video.topic || 'general',
          isActive: video.isActive !== false,
          thumbnail: video.thumbnail || video.thumbnailUrl || '',
          order: video.order || 999,
          dateAdded: admin.firestore.FieldValue.serverTimestamp(),
          dateModified: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            duration: video.duration || '',
            videoId: video.videoId || video.youtubeId || '',
            speaker: video.speaker || video.presenter || '',
            platform: video.platform || 'youtube'
          }
        };
        
        await db.collection('content_videos').add(newVideo);
        successCount++;
        console.log(`✅ Migrated: ${newVideo.title}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating video:`, error.message);
      }
    }
    
    console.log(`\n📊 Video Migration Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Video migration failed:', error);
  }
}

async function migrateCourseCatalog() {
  console.log('\n📖 Starting migration of course catalog...');
  
  try {
    // Get the old course library
    const courseLibraryDoc = await db.collection('metadata').doc('course_library').get();
    
    if (!courseLibraryDoc.exists) {
      console.log('ℹ️  No course_library found in metadata (this is okay)');
      return;
    }
    
    const catalogData = courseLibraryDoc.data();
    const items = catalogData?.items || [];
    
    if (items.length === 0) {
      console.log('ℹ️  No items found in course_library');
      return;
    }
    
    console.log(`Found ${items.length} courses to migrate`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Migrate each course
    for (const course of items) {
      try {
        const newCourse = {
          title: course.title || 'Untitled Course',
          description: course.description || '',
          url: course.url || '', // Courses might not have a single URL
          tier: mapTierToNew(course.tier || course.requiredTier || 'free'),
          category: course.category || 'leadership',
          isActive: course.isActive !== false,
          thumbnail: course.thumbnail || course.image || '',
          order: course.order || 999,
          dateAdded: admin.firestore.FieldValue.serverTimestamp(),
          dateModified: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            modules: course.modules || [],
            duration: course.duration || course.estimatedHours || '',
            instructor: course.instructor || '',
            level: course.level || 'intermediate'
          }
        };
        
        await db.collection('content_courses').add(newCourse);
        successCount++;
        console.log(`✅ Migrated: ${newCourse.title}`);
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating course:`, error.message);
      }
    }
    
    console.log(`\n📊 Course Migration Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Course migration failed:', error);
  }
}

function mapTierToNew(oldTier) {
  // Map old tier names to new standardized tier names
  const tierMap = {
    'free': 'free',
    'basic': 'basic',
    'pro': 'professional',
    'professional': 'professional',
    'premium': 'professional',
    'elite': 'elite',
    'advanced': 'elite'
  };
  
  const normalizedTier = String(oldTier).toLowerCase();
  return tierMap[normalizedTier] || 'free';
}

async function main() {
  console.log('🚀 Starting content migration to new CMS...\n');
  
  await migrateReadingCatalog();
  await migrateVideoCatalog();
  await migrateCourseCatalog();
  
  console.log('\n✅ Migration complete!');
  console.log('\nNext steps:');
  console.log('1. Check the Firebase Console to verify migrated data');
  console.log('2. Update your Firestore rules if needed');
  console.log('3. Test the Content Management interface');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
