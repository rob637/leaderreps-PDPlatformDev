// src/components/screens/LeadershipVideos.jsx (Refactored for Consistency)

import React, { useEffect, useMemo } from 'react';
// --- Icons ---
import { Film, User, Clock, ArrowRight, Zap, Briefcase, ArrowLeft } from 'lucide-react'; // Added Zap, Briefcase for section headers
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5355', PURPLE: '#7C3AED', BG: '#F9FAFB' }; // cite: App.jsx

// --- Standardized Button Component (Local Definition, Styled Consistently) ---
// Note: Ideally, this would be imported from a shared UI library.
// Kept local as per original file structure, but styles updated to match standard.
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
  if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
  if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
  else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`;
  else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
  else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
  if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
  return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

/**
 * VideoCard Component
 * Displays individual video information in a card format.
 * Styled to align with the standard Card component appearance.
 */
const VideoCard = ({ title, speaker, duration, url, description, accent }) => {
    // Determine accent color, defaulting to NAVY
    const accentColor = COLORS[accent] || COLORS.NAVY; // cite: Original File

    return (
        // Use relative positioning for the accent bar
        <div className={`relative p-6 rounded-2xl border-2 shadow-xl bg-white transition-all duration-300 text-left hover:shadow-2xl h-full flex flex-col`} // Added h-full and flex-col
             style={{ borderColor: COLORS.SUBTLE }}> {/* Use subtle border */}
            {/* Accent Bar */}
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />

            {/* Card Content */}
            <div className="flex-grow pt-2"> {/* Added flex-grow */}
                {/* Header: Title, Speaker, Duration */}
                <div className="flex justify-between items-start mb-3">
                    <div className='space-y-1 mr-2'> {/* Added margin-right */}
                        <h3 className="text-lg font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h3> {/* Slightly smaller title */}
                        <p className="text-xs text-gray-600 flex items-center"> {/* Smaller text */}
                            <User className='w-3 h-3 mr-1.5 text-gray-500' /> {speaker} {/* Smaller icon/margin */}
                        </p>
                    </div>
                    {/* Duration */}
                    <div className='flex items-center text-xs font-medium text-gray-500 flex-shrink-0 pt-1'> {/* Smaller text, added padding-top */}
                        <Clock className='w-3 h-3 mr-1' /> {duration}
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-4">{description}</p> {/* Use consistent text color */}
            </div>

            {/* Action Button (aligned to bottom) */}
            <div className="mt-auto"> {/* Pushes button to bottom */}
                <a href={url} target="_blank" rel="noopener noreferrer"
                    // Apply button-like styling for consistency
                    className={`flex items-center justify-center w-full px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1`}
                    style={{ background: accentColor, boxShadow: `0 3px 0 ${accentColor}AA`, focusRingColor: accentColor }} // Adjusted shadow and focus
                >
                    <Film className='w-4 h-4 mr-2' /> Watch Video
                </a>
            </div>
        </div>
    );
};

// --- CURATED VIDEO LISTS (FALLBACK DATA) ---
// This data is used only if the VIDEO_CATALOG from useAppServices is unavailable.
const VIDEO_LISTS_FALLBACK = { // cite: Original File
    "INSPIRATIONAL": [
        // ... (Fallback video data remains unchanged) ...
         { "title": "How great leaders inspire action", "speaker": "Simon Sinek (TED Talk)", "duration": "18 min", "url": "https://www.youtube.com/watch?v=7zFeuSagktM", "description": "The foundational concept of starting with 'Why' (The Golden Circle) to build loyalty and inspire action. A must-watch for defining purpose." },
         { "title": "The Infinite Game: The Trap Leaders Must Avoid", "speaker": "Simon Sinek", "duration": "11 min", "url": "https://www.youtube.com/watch?v=RyTQ5-SQYTo", "description": "How to shift your mindset from playing to win (finite) to playing to advance your cause (infinite), focusing on resilience and long-term vision." },
         { "title": "Your Body Language May Shape Who You Are", "speaker": "Amy Cuddy (TED Talk)", "duration": "21 min", "url": "https://www.youtube.com/watch?v=Ks-_Mh1QhMc", "description": "Examines how 'power posing'—changing your body language—can change the chemicals in your brain and impact your leadership confidence and performance." },
         { "title": "Good leaders talk last", "speaker": "Ty Wiggins (CEO Coach)", "duration": "10 min", "url": "https://www.youtube.com/watch?v=EcdNFn0BNXM", "description": "A coach shares the critical communication skill new CEOs must learn: listening to and prioritizing the team's input before giving direction." },
         { "title": "The power of vulnerability", "speaker": "Brené Brown (TED Talk)", "duration": "20 min", "url": "https://www.youtube.com/watch?v=iCvmsMYoE_A", "description": "A powerful talk on how vulnerability is not weakness, but the birthplace of innovation, creativity, and deeper, vulnerability-based trust." },
         { "title": "What 140 CEOs Said About the Future of Leadership", "speaker": "Jacob Morgan", "duration": "9 min", "url": "https://www.youtube.com/watch?v=a65oFN8rUPA", "description": "A summary of research on the skills and mindsets leaders need for the future, including clarity, humility, and the ability to define leadership itself." },
         { "title": "How to Build a Company Where the Best Ideas Win", "speaker": "Ray Dalio (Bridgewater Founder)", "duration": "5 min", "url": "https://www.youtube.com/watch?v=r0XWd4Q5iB8", "description": "The founder of the world's largest hedge fund discusses creating an 'idea meritocracy' where people can speak up and say what they really think." },
         { "title": "The Key to Success? Grit", "speaker": "Angela Lee Duckworth (TED Talk)", "duration": "6 min", "url": "https://www.youtube.com/watch?v=BNY3Jt_uXFw", "description": "Explains that the secret to outstanding achievement is not genius, but a special blend of passion and persistence called 'grit'." }
    ],
    "ACTIONABLE": [
        // ... (Fallback video data remains unchanged) ...
        { "title": "The Key to Effective Leadership: Micro-Behaviors", "speaker": "Simon Sinek", "duration": "3 min", "url": "https://www.youtube.com/watch?v=C2Tko2rKwVs", "description": "Practical demonstration of small actions (eye contact, putting the phone away) that leaders must perform consistently to build trust and culture." },
        { "title": "Transform Your Team: The Power of Positive Leadership", "speaker": "Simon Sinek", "duration": "6 min", "url": "https://www.youtube.com/watch?v=uNtOiqp1Tzs", "description": "Actionable advice on using positive reinforcement ('catching people doing things right') to build confidence in underperformers." },
        { "title": "The New Way to Lead Your Team Without Burning Out", "speaker": "ProcessDriven", "duration": "17 min", "url": "https://www.youtube.com/watch?v=HsvqN5fCbSg", "description": "7 steps for managers to change team work habits, including ritualizing successful behaviors and correctly delegating responsibility to avoid manager burnout." },
        { "title": "How to Become a Leader at Work in 4 Ways", "speaker": "Alexander Lyon", "duration": "17 min", "url": "https://www.youtube.com/watch?v=b0-YhEHYnOY", "description": "Focuses on four observable behaviors that demonstrate leadership regardless of title, primarily centered on solution-oriented communication." },
        { "title": "5 Levels of Delegation and How to Use Them", "speaker": "ProjectManager", "duration": "7 min", "url": "https://www.youtube.com/watch?v=wX-jO8g047A", "description": "A practical guide to the 5 key levels of delegation (Tell, Sell, Consult, Agree, Empower) and choosing the right level for the right task." },
        { "title": "Mastering the Art of Conflict Management", "speaker": "Harvard Business Review", "duration": "4 min", "url": "https://www.youtube.com/watch?v=Q-dO0rE-4oQ", "description": "A quick, actionable overview of the Thomas-Kilmann Conflict Mode Instrument (TKI) and how to choose between competing, collaborating, and compromising." },
        { "title": "Giving Feedback: The SBI Method", "speaker": "Training Industry", "duration": "3 min", "url": "https://www.youtube.com/watch?v=1rA5-n7a0wE", "description": "A clear, concise breakdown of the Situation, Behavior, Impact (SBI) feedback model for structured, non-judgmental performance discussions." },
        { "title": "How to Speak Like a CEO in Meetings", "speaker": "Executive Impressions", "duration": "10 min", "url": "https://www.youtube.com/watch?v=wh5rLnsc8LU", "description": "Tactical communication tips on speaking with clarity, enthusiasm, and confidence to ensure your message is heard and taken seriously by senior leaders." }
    ],
};

/**
 * LeadershipVideosScreen Component
 * Displays curated lists of leadership videos categorized as Inspirational/Philosophical and Actionable/Practical.
 * Pulls video data from the VIDEO_CATALOG in useAppServices, with a local fallback.
 */
const LeadershipVideosScreen = () => {
    // --- Consume services ---
    // Get navigate function and VIDEO_CATALOG data
    const { navigate, VIDEO_CATALOG } = useAppServices(); // cite: useAppServices.jsx

    // --- Effect to scroll to top on mount ---
    useEffect(() => {
        // Ensure this runs only client-side
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []); // Empty dependency array ensures it runs only once on mount

    // --- Determine Video Data Source ---
    // Use VIDEO_CATALOG from services if available and valid, otherwise use local fallback
    // Assumes VIDEO_CATALOG structure is { items: { INSPIRATIONAL: [...], ACTIONABLE: [...] } }
    const VIDEO_LISTS = useMemo(() => {
        const catalogItems = VIDEO_CATALOG?.items;
        // Basic validation: Check if catalogItems is an object with the expected keys
        if (catalogItems && typeof catalogItems === 'object' && catalogItems.INSPIRATIONAL && catalogItems.ACTIONABLE) {
             console.log("[LeadershipVideos] Using VIDEO_CATALOG from services."); // Log source
            return catalogItems;
        } else {
            console.warn("[LeadershipVideos] VIDEO_CATALOG from services is missing or invalid. Using fallback data."); // Log warning
            return VIDEO_LISTS_FALLBACK;
        }
    }, [VIDEO_CATALOG]); // Dependency: VIDEO_CATALOG

    // --- Safely access video arrays, defaulting to empty arrays ---
    const inspirationalVideos = useMemo(() => VIDEO_LISTS?.INSPIRATIONAL || [], [VIDEO_LISTS]);
    const actionableVideos = useMemo(() => VIDEO_LISTS?.ACTIONABLE || [], [VIDEO_LISTS]);

    return (
        // Use consistent padding and background color
        <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG }}> {/* Use BG color */}
            {/* Header */}
            <header className='flex items-center gap-4 border-b-2 pb-3 mb-8' style={{borderColor: COLORS.PURPLE+'30'}}> {/* Use consistent header style */}
                <Film className='w-10 h-10 flex-shrink-0' style={{color: COLORS.PURPLE}}/>
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Content: Leader Talks</h1>
                    <p className="text-md text-gray-600 mt-1">(Content Pillar 1)</p>
                </div>
            </header>
            <p className="text-lg text-gray-700 mb-10 max-w-3xl"> {/* Use consistent text color */}
                Explore these curated video lessons ("Leader Talks") to inspire your thinking and provide actionable techniques for leading your team effectively.
            </p>

            {/* --- SECTION 1: INSPIRATIONAL & PHILOSOPHY --- */}
            <section className="mb-12">
                {/* Section Header with Accent */}
                <h2 className="text-2xl md:text-3xl font-bold mb-6 border-l-4 pl-3 flex items-center gap-3"
                    style={{ color: COLORS.NAVY, borderColor: COLORS.ORANGE }}>
                    <Zap className='w-6 h-6' style={{color: COLORS.ORANGE}}/> Philosophical Insights & Mindset
                </h2>
                {/* Video Grid */}
                {inspirationalVideos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {inspirationalVideos.map((video, index) => (
                            <VideoCard
                                key={video.id || index} // Prefer unique ID if available
                                title={video.title}
                                speaker={video.speaker}
                                duration={video.duration}
                                url={video.url}
                                description={video.description}
                                accent="ORANGE" // Use ORANGE accent for this section
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No inspirational videos found.</p> // Empty state
                )}
            </section>

            {/* --- SECTION 2: ACTIONABLE & PRACTICAL --- */}
            <section>
                {/* Section Header with Accent */}
                <h2 className="text-2xl md:text-3xl font-bold mb-6 border-l-4 pl-3 flex items-center gap-3"
                    style={{ color: COLORS.NAVY, borderColor: COLORS.TEAL }}>
                    <Briefcase className='w-6 h-6' style={{color: COLORS.TEAL}}/> Actionable Leadership Techniques
                </h2>
                {/* Video Grid */}
                {actionableVideos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {actionableVideos.map((video, index) => (
                            <VideoCard
                                key={video.id || index} // Prefer unique ID
                                title={video.title}
                                speaker={video.speaker}
                                duration={video.duration}
                                url={video.url}
                                description={video.description}
                                accent="TEAL" // Use TEAL accent for this section
                            />
                        ))}
                    </div>
                 ) : (
                    <p className="text-gray-500 italic">No actionable technique videos found.</p> // Empty state
                )}
            </section>

            {/* --- Footer Navigation --- */}
            <footer className='mt-12 pt-8 border-t border-gray-200'> {/* Use consistent footer style */}
                <Button onClick={() => navigate('dashboard')} variant='outline' size="sm"> {/* Use standard Button */}
                    <ArrowLeft className='w-4 h-4 mr-2' /> {/* Use ArrowLeft for "Back" */}
                    Back to The Arena
                </Button>
            </footer>
        </div>
    );
};

export default LeadershipVideosScreen;