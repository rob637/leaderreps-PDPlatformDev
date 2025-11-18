// ========================================
// BROWSER CONSOLE SCRIPT - Remove Duplicate Videos
// ========================================
// Instructions:
// 1. Navigate to Content Management > Videos in your browser
// 2. Open Browser DevTools Console (F12)
// 3. Copy and paste this entire script into the console
// 4. Press Enter to run it
// ========================================

(async function removeDuplicateVideos() {
  console.log('🔍 Starting duplicate video removal...');
  
  // Access Firebase from the page's existing connection
  const { getFirestore, collection, getDocs, deleteDoc, doc } = window.firebaseFirestore;
  const db = getFirestore();
  
  console.log('🔍 Fetching all videos from content_videos...');
  
  const videosRef = collection(db, 'content_videos');
  const snapshot = await getDocs(videosRef);
  
  console.log(`📊 Total videos found: ${snapshot.docs.length}`);
  
  const videoMap = new Map(); // title -> {id, doc}
  const duplicates = [];
  
  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data();
    const title = data.title;
    
    if (videoMap.has(title)) {
      // This is a duplicate
      duplicates.push({
        id: docSnap.id,
        title: title,
        url: data.url
      });
      console.log(`❌ Duplicate found: "${title}" (ID: ${docSnap.id})`);
    } else {
      // First occurrence, keep it
      videoMap.set(title, {
        id: docSnap.id,
        data: data
      });
    }
  });
  
  console.log(`\n📋 Summary:`);
  console.log(`   Unique videos: ${videoMap.size}`);
  console.log(`   Duplicates to delete: ${duplicates.length}`);
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }
  
  console.log('\n🗑️  Deleting duplicates...');
  
  for (const dup of duplicates) {
    try {
      await deleteDoc(doc(db, 'content_videos', dup.id));
      console.log(`   ✅ Deleted: "${dup.title}" (ID: ${dup.id})`);
    } catch (error) {
      console.error(`   ❌ Error deleting ${dup.id}:`, error);
    }
  }
  
  console.log('\n✅ Duplicate removal complete!');
  console.log(`   Remaining videos: ${videoMap.size}`);
  console.log('\n🔄 Refresh the page to see the updated video list.');
})();
