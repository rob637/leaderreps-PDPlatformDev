// src/components/screens/LeadershipVideos.jsx

import React from 'react';
import { Film, User, Zap, CornerRightUp, Briefcase, BookOpen, Clock, Users, ArrowRight } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx'; 

/* =========================================================
   HIGH-CONTRAST PALETTE (Centralized for Consistency)
========================================================= */
const COLORS = {
  NAVY: '#002E47',      
  TEAL: '#47A88D',      
  SUBTLE_TEAL: '#349881', 
  ORANGE: '#E04E1B',    
  GREEN: '#10B981',
  AMBER: '#F5A500',
  RED: '#E04E1B',
  LIGHT_GRAY: '#FCFCFA',
  OFF_WHITE: '#FFFFFF', 
  SUBTLE: '#E5E7EB',
  TEXT: '#002E47',
  MUTED: '#4B5355',
  PURPLE: '#7C3AED', 
  BG: '#F9FAFB',
};

// --- FIX: LOCAL COMPONENT DEFINITIONS ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }
  return (
    <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>
      {children}
    </button>
  );
};
// --- END LOCAL COMPONENT DEFINITIONS ---

// UI Component Placeholder (Card adapted for video listings)
const VideoCard = ({ title, speaker, duration, url, description, accent }) => {
    const accentColor = COLORS[accent] || COLORS.NAVY;
    
    return (
        <div className={`relative p-6 rounded-2xl border-2 shadow-xl bg-white transition-all duration-300 text-left hover:shadow-2xl`}>
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
            
            <div className="flex justify-between items-start mb-3 pt-2">
                <div className='space-y-1'>
                    <h3 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h3>
                    <p className="text-sm text-gray-700 flex items-center">
                        <User className='w-4 h-4 mr-2 text-gray-500' /> {speaker}
                    </p>
                </div>
                <div className='flex items-center text-sm font-medium text-gray-500'>
                    <Clock className='w-4 h-4 mr-1' /> {duration}
                </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{description}</p>
            
            <a href={url} target="_blank" rel="noopener noreferrer" 
                className={`flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-all shadow-md text-white`}
                style={{ background: accentColor, boxShadow: `0 3px 0 ${accentColor}AA` }}
            >
                <Film className='w-4 h-4 mr-2' /> Watch on YouTube
            </a>
        </div>
    );
};

// --- CURATED VIDEO LISTS DELETED ---
// Fallback data structure if service data is not available
const VIDEO_LISTS_FALLBACK = {
    INSPIRATIONAL: [{ 
            title: "Fallback: How great leaders inspire action", 
            speaker: "Simon Sinek (TED Talk)", 
            duration: "18 min", 
            url: "#", 
            description: "Data loading failure. Please check Firestore 'video_library/INSPIRATIONAL'." 
        }],
    ACTIONABLE: [{ 
            title: "Fallback: The Key to Effective Leadership", 
            speaker: "Simon Sinek", 
            duration: "3 min", 
            url: "#", 
            description: "Data loading failure. Please check Firestore 'video_library/ACTIONABLE'." 
        }],
};

const LeadershipVideosScreen = () => {
    const { navigate, VIDEO_CATALOG } = useAppServices();

    // CRITICAL FIX: Use service data (VIDEO_CATALOG), falling back to local mocks if necessary
    const VIDEO_LISTS = VIDEO_CATALOG || VIDEO_LISTS_FALLBACK;

    return (
        <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG, color: COLORS.TEXT }}>
            <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.PURPLE+'30'}}>
                <Film className='w-10 h-10' style={{color: COLORS.PURPLE}}/>
                <h1 className="text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Content: Leader Talks (Pillar 1)</h1>
            </div>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">
                The **Content Pillar** includes on-demand "Leader Talks"—curated video lessons to inspire your philosophical thinking and provide actionable techniques for team leadership.
            </p>

            {/* --- SECTION 1: INSPIRATIONAL & PHILOSOPHY --- */}
            <h2 className="text-3xl font-bold text-[#002E47] mb-6 border-l-4 border-[#E04E1B] pl-3 flex items-center">
                <Zap className='w-6 h-6 mr-3 text-[#E04E1B]'/> Philosophical Insights & Mindset (On-Demand Content)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {VIDEO_LISTS.INSPIRATIONAL?.map((video, index) => (
                    <VideoCard 
                        key={index}
                        title={video.title}
                        speaker={video.speaker}
                        duration={video.duration}
                        url={video.url}
                        description={video.description}
                        accent="ORANGE"
                    />
                ))}
            </div>

            {/* --- SECTION 2: ACTIONABLE & PRACTICAL --- */}
            <h2 className="text-3xl font-bold text-[#002E47] mb-6 border-l-4 border-[#47A88D] pl-3 flex items-center">
                <Briefcase className='w-6 h-6 mr-3 text-[#47A88D]'/> Actionable Leadership Examples (Practical Reps)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {VIDEO_LISTS.ACTIONABLE?.map((video, index) => (
                    <VideoCard 
                        key={index}
                        title={video.title}
                        speaker={video.speaker}
                        duration={video.duration}
                        url={video.url}
                        description={video.description}
                        accent="TEAL"
                    />
                ))}
            </div>

            <div className='mt-12 pt-6 border-t border-gray-200'>
                <Button onClick={() => navigate('dashboard')} variant='outline'>
                    <ArrowRight className='w-4 h-4 mr-2 rotate-180' /> Back to Dashboard
                </Button>
            </div>
        </div>
    );
};

export default LeadershipVideosScreen;