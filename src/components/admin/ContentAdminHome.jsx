// src/components/admin/ContentAdminHome.jsx
// Admin dashboard for content management

import React, { useState } from 'react';
import { BookOpen, Film, GraduationCap, ArrowLeft, Settings, RefreshCw, Trash2 } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { CONTENT_COLLECTIONS, addContent } from '../../services/contentService';
import { collection, doc, getDoc, getDocs, deleteDoc } from 'firebase/firestore';

const COLORS = {
  NAVY: '#002E47',
  ORANGE: '#E04E1B',
  TEAL: '#47A88D',
  LIGHT_GRAY: '#FCFCFA',
  MUTED: '#6B7280'
};

const ContentAdminHome = () => {
  const { navigate, db } = useAppServices();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [removalStatus, setRemovalStatus] = useState('');

  const mapTier = (oldTier) => {
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
  };

  const handleMigration = async () => {
    if (!confirm('This will migrate videos and courses from hardcoded data to the new CMS. (Readings already migrated - this will skip them.) Continue?')) {
      return;
    }

    setIsMigrating(true);
    setMigrationStatus('Starting migration...');

    try {
      let totalCount = 0;
      
      // Skip readings - already migrated
      setMigrationStatus('⏭️ Skipping readings (already migrated)...');
      const readingCount = 0;

      setMigrationStatus('📹 Now migrating videos...');

      // Migrate videos
      try {
        const videoRef = doc(db, 'metadata', 'video_catalog');
        const videoDoc = await getDoc(videoRef);
        if (videoDoc.exists()) {
          const videoData = videoDoc.data();
          const videosOrCategories = videoData?.items || [];
          
          let videoCount = 0;
          
          // Check if items is an array or object (categories)
          if (Array.isArray(videosOrCategories)) {
            // Direct array of videos
            setMigrationStatus(`Found ${videosOrCategories.length} videos to migrate...`);
            
            for (const video of videosOrCategories) {
              await addContent(db, CONTENT_COLLECTIONS.VIDEOS, {
                title: video.title || 'Untitled',
                description: video.description || '',
                url: video.url || video.videoUrl || '',
                tier: mapTier(video.tier || 'free'),
                category: video.category || 'general',
                isActive: video.isActive !== false,
                thumbnail: video.thumbnail || '',
                order: video.order || 999,
                metadata: {
                  duration: video.duration || '',
                  videoId: video.videoId || '',
                  speaker: video.speaker || ''
                }
              });
              videoCount++;
            }
          } else {
            // Object with categories (like readings)
            let totalVideos = 0;
            for (const videosArray of Object.values(videosOrCategories)) {
              if (Array.isArray(videosArray)) {
                totalVideos += videosArray.length;
              }
            }
            setMigrationStatus(`Found ${totalVideos} videos across ${Object.keys(videosOrCategories).length} categories to migrate...`);
            
            for (const [categoryName, videosArray] of Object.entries(videosOrCategories)) {
              if (!Array.isArray(videosArray)) continue;
              
              for (const video of videosArray) {
                await addContent(db, CONTENT_COLLECTIONS.VIDEOS, {
                  title: video.title || 'Untitled',
                  description: video.description || '',
                  url: video.url || video.videoUrl || '',
                  tier: mapTier(video.tier || 'free'),
                  category: categoryName,
                  isActive: video.isActive !== false,
                  thumbnail: video.thumbnail || '',
                  order: video.order || 999,
                  metadata: {
                    duration: video.duration || '',
                    videoId: video.videoId || '',
                    speaker: video.speaker || ''
                  }
                });
                videoCount++;
              }
            }
          }
          
          totalCount += videoCount;
          setMigrationStatus(`✅ Migrated ${videoCount} videos. Now checking for courses...`);
        } else {
          setMigrationStatus('No videos found. Checking for courses...');
        }
      } catch (e) {
        console.log('No videos to migrate:', e);
        setMigrationStatus(`ℹ️ No videos in metadata/video_catalog. Checking for courses...`);
      }

      // Migrate courses
      try {
        const courseRef = doc(db, 'metadata', 'course_library');
        const courseDoc = await getDoc(courseRef);
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          const coursesOrCategories = courseData?.items || [];
          
          let courseCount = 0;
          
          // Check if items is an array or object (categories)
          if (Array.isArray(coursesOrCategories)) {
            // Direct array of courses
            setMigrationStatus(`Found ${coursesOrCategories.length} courses to migrate...`);
            
            for (const course of coursesOrCategories) {
              await addContent(db, CONTENT_COLLECTIONS.COURSES, {
                title: course.title || 'Untitled',
                description: course.description || '',
                url: course.url || '',
                tier: mapTier(course.tier || 'free'),
                category: course.category || 'leadership',
                isActive: course.isActive !== false,
                thumbnail: course.thumbnail || '',
                order: course.order || 999,
                metadata: {
                  modules: course.modules || [],
                  duration: course.duration || '',
                  instructor: course.instructor || ''
                }
              });
              courseCount++;
            }
          } else {
            // Object with categories (like readings)
            let totalCourses = 0;
            for (const coursesArray of Object.values(coursesOrCategories)) {
              if (Array.isArray(coursesArray)) {
                totalCourses += coursesArray.length;
              }
            }
            setMigrationStatus(`Found ${totalCourses} courses across ${Object.keys(coursesOrCategories).length} categories to migrate...`);
            
            for (const [categoryName, coursesArray] of Object.entries(coursesOrCategories)) {
              if (!Array.isArray(coursesArray)) continue;
              
              for (const course of coursesArray) {
                await addContent(db, CONTENT_COLLECTIONS.COURSES, {
                  title: course.title || 'Untitled',
                  description: course.description || '',
                  url: course.url || '',
                  tier: mapTier(course.tier || 'free'),
                  category: categoryName,
                  isActive: course.isActive !== false,
                  thumbnail: course.thumbnail || '',
                  order: course.order || 999,
                  metadata: {
                    modules: course.modules || [],
                    duration: course.duration || '',
                    instructor: course.instructor || ''
                  }
                });
                courseCount++;
              }
            }
          }
          
          totalCount += courseCount;
          setMigrationStatus(`✅ Migrated ${courseCount} courses!`);
        } else {
          setMigrationStatus('No courses found.');
        }
      } catch (e) {
        console.log('No courses to migrate:', e);
        setMigrationStatus(prev => prev + ' | ℹ️ No courses in metadata/course_library');
      }

      // Migrate hardcoded videos from LeadershipVideos.jsx
      setMigrationStatus('📹 Migrating hardcoded videos from code...');
      const HARDCODED_VIDEOS = {
        "INSPIRATIONAL": [
          { id: "sinek-why", title: "How great leaders inspire action", speaker: "Simon Sinek", duration: "18 min", url: "https://www.youtube.com/watch?v=u4ZoJKF_VuA", description: "The foundational concept of starting with 'Why' (The Golden Circle) to build loyalty and inspire action.", category: "Vision & Purpose" },
          { id: "sinek-infinite", title: "The Infinite Game: The Trap Leaders Must Avoid", speaker: "Simon Sinek", duration: "11 min", url: "https://www.youtube.com/watch?v=RyTQ5-SQYTo", description: "How to shift your mindset from playing to win (finite) to playing to advance your cause (infinite).", category: "Mindset" },
          { id: "cuddy-presence", title: "Your Body Language May Shape Who You Are", speaker: "Amy Cuddy", duration: "21 min", url: "https://www.youtube.com/watch?v=Ks-_Mh1QhMc", description: "Examines how 'power posing' can change the chemicals in your brain and impact your leadership confidence.", category: "Executive Presence" },
          { id: "brown-vulnerability", title: "The power of vulnerability", speaker: "Brené Brown", duration: "20 min", url: "https://www.youtube.com/watch?v=iCvmsMYoE_A", description: "How vulnerability is not weakness, but the birthplace of innovation and trust.", category: "Authentic Leadership" },
          { id: "duckworth-grit", title: "The Key to Success? Grit", speaker: "Angela Lee Duckworth", duration: "6 min", url: "https://www.youtube.com/watch?v=H14bBuluwB8", description: "The secret to outstanding achievement is a blend of passion and persistence called 'grit'.", category: "Resilience" },
          { id: "dalio-principles", title: "How to Build a Company Where the Best Ideas Win", speaker: "Ray Dalio", duration: "5 min", url: "https://www.youtube.com/watch?v=M95m2EFb7IQ", description: "Creating an 'idea meritocracy' where people can speak up and say what they really think.", category: "Culture Building" }
        ],
        "ACTIONABLE": [
          { id: "sinek-micro", title: "The Key to Effective Leadership: Micro-Behaviors", speaker: "Simon Sinek", duration: "3 min", url: "https://www.youtube.com/watch?v=ReRcHdeUG9Y", description: "Small actions (eye contact, putting phone away) that leaders must perform consistently to build trust.", category: "Daily Practices" },
          { id: "sinek-positive", title: "Transform Your Team: The Power of Positive Leadership", speaker: "Simon Sinek", duration: "6 min", url: "https://www.youtube.com/watch?v=uNtOiqp1Tzs", description: "Using positive reinforcement to build confidence in underperformers.", category: "Team Development" },
          { id: "delegation-levels", title: "5 Levels of Delegation and How to Use Them", speaker: "ProjectManager", duration: "7 min", url: "https://www.youtube.com/watch?v=wX-jO8g047A", description: "A practical guide to the 5 key levels of delegation.", category: "Delegation" },
          { id: "circle-of-safety", title: "Why Good Leaders Make You Feel Safe", speaker: "Simon Sinek", duration: "12 min", url: "https://www.youtube.com/watch?v=lmyZMtPVodo", description: "The 'Circle of Safety'—leaders must create an environment of trust for teams to flourish.", category: "Team Building" }
        ],
        "STRATEGIC": [
          { id: "collins-bhag", title: "Vision Framework: Big Hairy Audacious Goals", speaker: "Jim Collins", duration: "10 min", url: "https://www.youtube.com/watch?v=1rA5-n7a0wE", description: "Jim Collins explains BHAGs that energize progress and give meaning.", category: "Strategy" },
          { id: "pink-motivation", title: "The Puzzle of Motivation", speaker: "Dan Pink", duration: "18 min", url: "https://www.youtube.com/watch?v=rrkrvAUbU9Y", description: "3 factors (Autonomy, Mastery, Purpose) that drive high performance.", category: "Motivation Theory" },
          { id: "kotter-change", title: "Leading Change: Establish a Sense of Urgency", speaker: "John Kotter", duration: "4 min", url: "https://www.youtube.com/watch?v=Q-dO0rE-4oQ", description: "Step 1 of Kotter's 8-step process for leading change.", category: "Change Management" }
        ]
      };

      let videoCount = 0;
      for (const [categoryName, videos] of Object.entries(HARDCODED_VIDEOS)) {
        for (const video of videos) {
          await addContent(db, CONTENT_COLLECTIONS.VIDEOS, {
            title: video.title,
            description: video.description || '',
            url: video.url,
            tier: 'professional',
            category: categoryName,
            isActive: true,
            thumbnail: `https://img.youtube.com/vi/${video.url.split('v=')[1]}/hqdefault.jpg`,
            order: videoCount,
            metadata: {
              speaker: video.speaker || '',
              duration: video.duration || '',
              originalId: video.id || ''
            }
          });
          videoCount++;
        }
      }
      totalCount += videoCount;

      // Migrate hardcoded courses from mockData.js
      setMigrationStatus('📚 Migrating hardcoded courses from code...');
      const HARDCODED_COURSES = [
        { id: 'executive-presence-masterclass', title: 'Executive Presence Masterclass', description: 'A 6-week intensive program designed to help senior leaders develop commanding presence, influence, and gravitas.', instructor: 'Dr. Sarah Chen', duration: '6 weeks', tier: 'professional', category: 'Leadership Development', level: 'Advanced' },
        { id: 'feedback-mastery-bootcamp', title: 'Feedback Mastery Bootcamp', description: 'Master the art of giving and receiving feedback with this intensive 4-week program.', instructor: 'Marcus Rodriguez', duration: '4 weeks', tier: 'professional', category: 'Communication', level: 'Intermediate' },
        { id: 'strategic-thinking-academy', title: 'Strategic Thinking Academy', description: 'Develop strategic mindset and long-term thinking capabilities. 8-week deep dive into frameworks.', instructor: 'Dr. Jennifer Park', duration: '8 weeks', tier: 'elite', category: 'Strategy', level: 'Expert' }
      ];

      let hardcodedCourseCount = 0;
      for (const course of HARDCODED_COURSES) {
        await addContent(db, CONTENT_COLLECTIONS.COURSES, {
          title: course.title,
          description: course.description || '',
          url: course.url || '',
          tier: mapTier(course.tier || 'professional'),
          category: course.category || 'Leadership',
          isActive: true,
          thumbnail: '',
          order: hardcodedCourseCount,
          metadata: {
            instructor: course.instructor || '',
            duration: course.duration || '',
            level: course.level || '',
            originalId: course.id || ''
          }
        });
        hardcodedCourseCount++;
      }
      totalCount += hardcodedCourseCount;

      setMigrationStatus(`✅ Migration complete! Total items: ${totalCount} (${videoCount} videos, ${hardcodedCourseCount} courses)`);
      setTimeout(() => setMigrationStatus(''), 5000);

    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    if (!confirm('This will find and remove duplicate videos (keeping only one copy of each). Continue?')) {
      return;
    }

    setIsRemoving(true);
    setRemovalStatus('🔍 Scanning for duplicates...');

    try {
      const videosRef = collection(db, CONTENT_COLLECTIONS.VIDEOS);
      const snapshot = await getDocs(videosRef);
      
      setRemovalStatus(`📊 Found ${snapshot.docs.length} total videos. Checking for duplicates...`);
      
      const videoMap = new Map();
      const duplicates = [];
      
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const title = data.title;
        
        if (videoMap.has(title)) {
          duplicates.push({
            id: docSnap.id,
            title: title
          });
        } else {
          videoMap.set(title, docSnap.id);
        }
      });
      
      if (duplicates.length === 0) {
        setRemovalStatus('✅ No duplicates found!');
        setTimeout(() => setRemovalStatus(''), 3000);
        return;
      }
      
      setRemovalStatus(`🗑️  Found ${duplicates.length} duplicates. Deleting...`);
      
      for (const dup of duplicates) {
        await deleteDoc(doc(db, CONTENT_COLLECTIONS.VIDEOS, dup.id));
      }
      
      setRemovalStatus(`✅ Removed ${duplicates.length} duplicate videos. ${videoMap.size} unique videos remain.`);
      setTimeout(() => setRemovalStatus(''), 5000);
      
    } catch (error) {
      console.error('Error removing duplicates:', error);
      setRemovalStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsRemoving(false);
    }
  };

  const contentTypes = [
    {
      id: CONTENT_COLLECTIONS.READINGS,
      label: 'Readings',
      icon: BookOpen,
      description: 'Manage articles, blog posts, and reading materials',
      color: COLORS.TEAL
    },
    {
      id: CONTENT_COLLECTIONS.VIDEOS,
      label: 'Videos',
      icon: Film,
      description: 'Manage video content and tutorials',
      color: COLORS.ORANGE
    },
    {
      id: CONTENT_COLLECTIONS.COURSES,
      label: 'Courses',
      icon: GraduationCap,
      description: 'Manage structured courses and learning paths',
      color: COLORS.NAVY
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen" style={{ backgroundColor: COLORS.LIGHT_GRAY }}>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('dashboard')}
          className="flex items-center gap-2 text-sm mb-4 hover:opacity-70"
          style={{ color: COLORS.MUTED }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8" style={{ color: COLORS.TEAL }} />
          <div>
            <h1 className="text-3xl font-bold" style={{ color: COLORS.NAVY }}>
              Content Management
            </h1>
            <p style={{ color: COLORS.MUTED }}>
              Manage all content for your LeaderReps platform
            </p>
          </div>
        </div>
      </div>

      {/* Content Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {contentTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => navigate('admin-content-manager', { contentType: type.id })}
              className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all text-left border-2 hover:border-opacity-100"
              style={{ borderColor: `${type.color}40` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${type.color}20` }}
                >
                  <Icon className="w-6 h-6" style={{ color: type.color }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: COLORS.NAVY }}>
                  {type.label}
                </h2>
              </div>
              <p className="text-sm" style={{ color: COLORS.MUTED }}>
                {type.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Admin Tools */}
      <div className="mt-8 space-y-4">
        {/* Migration Tool */}
        <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border-2" style={{ borderColor: COLORS.ORANGE }}>
          <div className="flex items-start gap-4">
            <RefreshCw className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: COLORS.ORANGE }} />
            <div className="flex-1">
              <h3 className="font-bold mb-2" style={{ color: COLORS.NAVY }}>
                Migrate Legacy Content
              </h3>
              <p className="text-sm mb-4" style={{ color: COLORS.MUTED }}>
                Migrate your existing content from the old structure (metadata/reading_catalog) to the new CMS collections. This only needs to be done once.
              </p>
              <button
                onClick={handleMigration}
                disabled={isMigrating}
                className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.ORANGE }}
              >
                {isMigrating ? 'Migrating...' : 'Run Migration'}
              </button>
              {migrationStatus && (
                <p className="mt-3 text-sm font-medium" style={{ color: COLORS.NAVY }}>
                  {migrationStatus}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Remove Duplicates Tool */}
        <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-2 border-red-300">
          <div className="flex items-start gap-4">
            <Trash2 className="w-6 h-6 flex-shrink-0 mt-1 text-red-600" />
            <div className="flex-1">
              <h3 className="font-bold mb-2" style={{ color: COLORS.NAVY }}>
                Remove Duplicate Videos
              </h3>
              <p className="text-sm mb-4" style={{ color: COLORS.MUTED }}>
                Scan the video collection for duplicates (same title) and remove extras, keeping only one copy of each video.
              </p>
              <button
                onClick={handleRemoveDuplicates}
                disabled={isRemoving}
                className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
              >
                {isRemoving ? 'Scanning...' : 'Remove Duplicates'}
              </button>
              {removalStatus && (
                <p className="mt-3 text-sm font-medium" style={{ color: COLORS.NAVY }}>
                  {removalStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 p-6 bg-white rounded-xl border-l-4" style={{ borderColor: COLORS.TEAL }}>
        <h3 className="font-bold mb-2" style={{ color: COLORS.NAVY }}>
          About Content Management
        </h3>
        <ul className="space-y-2 text-sm" style={{ color: COLORS.MUTED }}>
          <li>• Content is organized by tier: Free, Basic, Professional, Elite</li>
          <li>• Users can only see content for their membership tier or lower</li>
          <li>• Inactive content is hidden from all users but not deleted</li>
          <li>• Changes take effect immediately across all user sessions</li>
        </ul>
      </div>
    </div>
  );
};

export default ContentAdminHome;
