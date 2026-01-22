// Demo Content Library Data
import { BookOpen, MessageSquare, Users } from 'lucide-react';

export const demoVideos = [
  {
    id: 'v1',
    title: 'The Art of Strategic Communication',
    description: 'Master the fundamentals of clear, impactful communication that drives results.',
    thumbnail: '/demo-assets/video-thumb-1.svg',
    duration: '12:34',
    category: 'Communication',
    skill: 'Communication',
    watched: true,
    watchedDate: '2026-01-05',
    progress: 100,
  },
  {
    id: 'v2',
    title: 'Building High-Performance Teams',
    description: 'Learn the science behind team dynamics and how to foster collaboration.',
    thumbnail: '/demo-assets/video-thumb-2.svg',
    duration: '15:22',
    category: 'Team Building',
    skill: 'Team Building',
    watched: true,
    watchedDate: '2026-01-07',
    progress: 100,
  },
  {
    id: 'v3',
    title: 'Navigating Difficult Conversations',
    description: 'Framework for handling challenging discussions with confidence and empathy.',
    thumbnail: '/demo-assets/video-thumb-3.svg',
    duration: '18:45',
    category: 'Conflict Resolution',
    skill: 'Conflict',
    watched: false,
    progress: 35,
  },
  {
    id: 'v4',
    title: 'Strategic Thinking for Managers',
    description: 'Develop your ability to see the big picture and plan for the future.',
    thumbnail: '/demo-assets/video-thumb-4.svg',
    duration: '14:18',
    category: 'Strategy',
    skill: 'Strategy',
    watched: false,
    progress: 0,
  },
  {
    id: 'v5',
    title: 'The Coaching Mindset',
    description: 'Transform from director to coach and unlock your team potential.',
    thumbnail: '/demo-assets/video-thumb-5.svg',
    duration: '11:56',
    category: 'Coaching',
    skill: 'Coaching',
    watched: true,
    watchedDate: '2026-01-02',
    progress: 100,
  },
  {
    id: 'v6',
    title: 'Leading Through Change',
    description: 'Guide your team through transitions with clarity and compassion.',
    thumbnail: '/demo-assets/video-thumb-6.svg',
    duration: '16:30',
    category: 'Leadership',
    skill: 'Leadership',
    watched: false,
    progress: 0,
    isNew: true,
  },
];

export const demoDocuments = [
  {
    id: 'd1',
    title: '1-on-1 Meeting Template',
    description: 'Structured template for effective one-on-one meetings.',
    type: 'PDF',
    category: 'Meetings',
    downloads: 1247,
    saved: true,
  },
  {
    id: 'd2',
    title: 'Feedback Framework Guide',
    description: 'SBI model and best practices for giving constructive feedback.',
    type: 'PDF',
    category: 'Feedback',
    downloads: 892,
    saved: true,
  },
  {
    id: 'd3',
    title: 'Team Health Check Survey',
    description: 'Assessment tool to gauge team morale.',
    type: 'Form',
    category: 'Teams',
    downloads: 634,
    saved: false,
  },
  {
    id: 'd4',
    title: 'Strategic Planning Workbook',
    description: 'Step-by-step workbook for creating your leadership strategy.',
    type: 'Workbook',
    category: 'Strategy',
    downloads: 421,
    saved: false,
  },
];

// Combined content export for screens
export const demoContent = {
  videos: demoVideos.map(video => ({
    ...video,
    isNew: video.isNew || false,
    favorite: video.watched
  })),
  
  programs: [
    {
      id: 'p1',
      title: 'Leadership Foundations',
      description: 'Build your core leadership competencies with this comprehensive program.',
      icon: BookOpen,
      color: '#3B82F6',
      videoCount: 8,
      duration: '4 weeks',
      progress: 75,
    },
    {
      id: 'p2',
      title: 'Communication Mastery',
      description: 'Deep dive into strategic communication for maximum impact.',
      icon: MessageSquare,
      color: '#10B981',
      videoCount: 6,
      duration: '3 weeks',
      progress: 67,
    },
    {
      id: 'p3',
      title: 'Team Dynamics',
      description: 'Master building and leading high-performing teams.',
      icon: Users,
      color: '#8B5CF6',
      videoCount: 5,
      duration: '2 weeks',
      progress: 40,
    },
  ],
  
  documents: demoDocuments.map(doc => ({
    ...doc,
    size: doc.type === 'PDF' ? '1.2 MB' : '856 KB',
    downloaded: doc.saved
  }))
};
