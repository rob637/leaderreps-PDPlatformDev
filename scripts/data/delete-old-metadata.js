// Delete old metadata collections that have been migrated to CMS
// Run this from browser console after navigating to the site

const deleteOldMetadata = async () => {
  const { getFirestore, doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  const db = getFirestore();
  
  console.log('🗑️ Deleting old metadata documents...');
  
  try {
    await deleteDoc(doc(db, 'metadata', 'reading_catalog'));
    console.log('✅ Deleted metadata/reading_catalog');
  } catch (e) {
    console.log('❌ Error deleting reading_catalog:', e.message);
  }
  
  try {
    await deleteDoc(doc(db, 'metadata', 'video_catalog'));
    console.log('✅ Deleted metadata/video_catalog');
  } catch (e) {
    console.log('❌ Error deleting video_catalog:', e.message);
  }
  
  try {
    await deleteDoc(doc(db, 'metadata', 'course_library'));
    console.log('✅ Deleted metadata/course_library');
  } catch (e) {
    console.log('❌ Error deleting course_library:', e.message);
  }
  
  console.log('✅ Old metadata cleanup complete!');
};

// Call the function
deleteOldMetadata();
