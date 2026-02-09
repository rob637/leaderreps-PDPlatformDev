export const BREADCRUMB_MAP = {
  // ============================================
  // HOME / DASHBOARD (No breadcrumbs - it's home)
  // ============================================
  'dashboard': [],
  
  // ============================================
  // DEVELOPMENT PLAN
  // ============================================
  'development-plan': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Development Plan', path: null }
  ],
  'daily-practice': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Daily Practice', path: null }
  ],
  'planning-hub': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Planning Hub', path: null }
  ],
  'quick-start-accelerator': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Foundation', path: null }
  ],
  'executive-reflection': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Executive Reflection', path: null }
  ],
  'conditioning': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Conditioning', path: null }
  ],
  
  // ============================================
  // LIBRARY - Main Hub
  // ============================================
  'library': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: null }
  ],
  
  // ============================================
  // LIBRARY - Programs
  // ============================================
  'programs-index': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Programs', path: null }
  ],
  'program-detail': (params) => [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Programs', path: 'programs-index' },
    { label: params?.title || 'Program', path: null }
  ],

  // ============================================
  // LIBRARY - Workouts
  // ============================================
  'workouts-index': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Workouts', path: null }
  ],
  'workout-detail': (params) => [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Workouts', path: 'workouts-index' },
    { label: params?.title || 'Workout', path: null }
  ],

  // ============================================
  // LIBRARY - Skills (Discovery Engine)
  // ============================================
  'skills-index': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Skills', path: null }
  ],
  'skill-detail': (params) => [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Skills', path: 'skills-index' },
    { label: params?.title || 'Skill', path: null }
  ],

  // ============================================
  // LIBRARY - Read & Reps
  // ============================================
  'read-reps-index': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Read & Reps', path: null }
  ],
  'read-rep-detail': (params) => [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Read & Reps', path: 'read-reps-index' },
    { label: params?.title || 'Book', path: null }
  ],
  // Legacy alias
  'business-readings': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Read & Reps', path: null }
  ],
  
  // ============================================
  // LIBRARY - Tools
  // ============================================
  'tools-index': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Tools', path: null }
  ],
  'tool-detail': (params) => [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Tools', path: 'tools-index' },
    { label: params?.title || 'Tool', path: null }
  ],

  // ============================================
  // LIBRARY - Videos
  // ============================================
  'videos-index': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Videos', path: null }
  ],
  'video-detail': (params) => [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Videos', path: 'videos-index' },
    { label: params?.title || 'Video', path: null }
  ],

  // ============================================
  // LIBRARY - Documents
  // ============================================
  'documents-index': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Documents', path: null }
  ],
  'document-detail': (params) => [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Documents', path: 'documents-index' },
    { label: params?.title || 'Document', path: null }
  ],

  // ============================================
  // COACHING HUB
  // ============================================
  'coaching-hub': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Coaching Hub', path: null }
  ],
  'coaching-lab': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Coaching Hub', path: null }
  ],
  'labs': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Coaching Hub', path: null }
  ],

  // ============================================
  // PERSONAL
  // ============================================
  'locker': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Your Locker', path: null }
  ],
  'app-settings': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Settings', path: null }
  ],
  'membership-upgrade': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Membership', path: null }
  ],
  'membership-module': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Membership', path: null }
  ],

  // ============================================
  // COMMUNITY
  // ============================================
  'community': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Community', path: null }
  ],

  // ============================================
  // LEGACY / MISC SCREENS
  // ============================================
  'applied-leadership': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Applied Leadership', path: null }
  ],
  'leadership-videos': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Library', path: 'library' },
    { label: 'Leadership Videos', path: null }
  ],
  'roadmap-tracker': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Roadmap', path: null }
  ],

  // ============================================
  // FEATURES LAB
  // ============================================
  'features-lab': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Features Lab', path: null }
  ],
  'reading-hub': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Features Lab', path: 'features-lab' },
    { label: 'Reading Hub', path: null }
  ],
  'course-library': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Features Lab', path: 'features-lab' },
    { label: 'Course Library', path: null }
  ],
  'strat-templates': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Features Lab', path: 'features-lab' },
    { label: 'Strategic Templates', path: null }
  ],
  'mastermind': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Features Lab', path: 'features-lab' },
    { label: 'Mastermind Groups', path: null }
  ],
  'mentor-match': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Features Lab', path: 'features-lab' },
    { label: 'Mentor Match', path: null }
  ],
  'live-events': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Features Lab', path: 'features-lab' },
    { label: 'Live Events', path: null }
  ],
  'ai-roleplay': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Features Lab', path: 'features-lab' },
    { label: 'AI Roleplay', path: null }
  ],
  '360-feedback': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Features Lab', path: 'features-lab' },
    { label: '360 Feedback', path: null }
  ],
  'roi-report': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Features Lab', path: 'features-lab' },
    { label: 'ROI Report', path: null }
  ],

  // ============================================
  // ADMIN
  // ============================================
  'admin-portal': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: null }
  ],
  'admin-content-home': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: 'admin-portal' },
    { label: 'Content Home', path: null }
  ],
  'admin-content-manager': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: 'admin-portal' },
    { label: 'Content Manager', path: null }
  ],
  'admin-dev-plan': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: 'admin-portal' },
    { label: 'Dev Plan Manager', path: null }
  ],
  'admin-community-manager': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: 'admin-portal' },
    { label: 'Community Manager', path: null }
  ],
  'admin-coaching-manager': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: 'admin-portal' },
    { label: 'Coaching Manager', path: null }
  ],
  'admin-lov-manager': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: 'admin-portal' },
    { label: 'LOV Manager', path: null }
  ],
  'admin-functions': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: 'admin-portal' },
    { label: 'Functions', path: null }
  ],
  'data-maintenance': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: 'admin-portal' },
    { label: 'Data Maintenance', path: null }
  ],
  'debug-data': [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: 'admin-portal' },
    { label: 'Debug Data', path: null }
  ]
};

export const getBreadcrumbs = (screen, params) => {
  const config = BREADCRUMB_MAP[screen];
  if (!config) return null;
  if (typeof config === 'function') return config(params);
  return config;
};