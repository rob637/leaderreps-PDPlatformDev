// src/components/screens/AppliedLeadership.jsx (FIXED: Missing Icons and Modal State)

import React, { useState, useMemo, useCallback, useEffect } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx
import { useNavigation } from '../../providers/NavigationProvider.jsx';

// --- ICONS: CRITICAL FIX - Import all icons used in sub-components/rendering logic ---
import { ArrowLeft, BookOpen, ChevronRight, Loader, AlertTriangle, ShieldCheck, Zap, Briefcase, Lightbulb, CheckCircle, X, CornerRightUp } from 'lucide-react'; 

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#002E47', ORANGE: '#E04E1B', GREEN: '#47A88D', AMBER: '#E04E1B', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', PURPLE: '#47A88D', BG: '#F9FAFB' }; // cite: App.jsx

// --- Standardized Button Component (Matches Dashboard) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use exact Button definition from Dashboard.jsx ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#47A88D] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

// --- Standardized Card Component (Matches Dashboard) ---
const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => { /* ... Re-use exact Card definition from Dashboard.jsx ... */
    const interactive = !!onClick; const Tag = interactive ? 'button' : 'div'; const accentColor = COLORS[accent] || COLORS.NAVY; const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };
    return (
        <Tag {...(interactive ? { type: 'button' } : {})} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} onKeyDown={handleKeyDown} className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.NAVY }} onClick={onClick}>
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
            {Icon && title && ( <div className="flex items-center gap-3 mb-4"> <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: accentColor }} /> </div> <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2> </div> )}
            {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>}
            <div className={Icon || title ? '' : ''}>{children}</div>
        </Tag>
    );
};

// --- Standardized Loading Spinner ---
const LoadingSpinner = ({ message = "Loading..." }) => ( /* ... Re-use definition from DevelopmentPlan.jsx ... */
    <div className="min-h-[300px] flex items-center justify-center" style={{ background: COLORS.BG }}> <div className="flex flex-col items-center"> <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} /> <p className="font-semibold" style={{ color: COLORS.NAVY }}>{message}</p> </div> </div>
);

/* =========================================================
   PLACEHOLDER COMPONENTS (Styled Consistently)
========================================================= */

/**
 * Placeholder for AI Coaching Simulator specific to a skill/course.
 */
const AICoachingSimulator = ({ item, isCourse = false }) => (
  <Card title={`AI Rep Coach for ${item.title || item.name}`} icon={ShieldCheck} accent="PURPLE" className="my-8">
    <p className="text-sm text-gray-600 mb-4">Practice applying '{item.title || item.name}' principles in simulated scenarios.</p>
    {/* Placeholder content */}
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center text-purple-700 font-medium italic">
      {isCourse ? `Access the dedicated AI Coach for this course's modules.` : `AI Coaching Simulator coming soon...`}
    </div>
  </Card>
);

/**
 * Modal to display details of a selected resource.
 */
const ResourceDetailModal = ({ isVisible, onClose, resource, skill }) => { // Renamed prop to 'skill'
    if (!isVisible || !resource || !skill) return null;

    // Use X icon (imported)
    // Note: X icon is now imported at the top.
    
    return (
        // Standard modal structure with backdrop and content
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center pb-3 mb-4 border-b" style={{ borderColor: COLORS.SUBTLE }}>
                    <h3 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>{resource.title}</h3>
                    <Button onClick={onClose} variant="ghost" size="sm" className="!p-1 text-gray-400 hover:text-red-600 absolute top-3 right-3"> {/* Use Button */}
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                {/* Content */}
                <p className="text-xs font-semibold uppercase mb-1" style={{ color: COLORS.TEAL }}>Skill: {skill.name}</p>
                <p className="text-sm text-gray-600 mb-4">{resource.summary || 'Details unavailable.'}</p>
                {/* Additional details like type, duration could go here */}
                {resource.type && <p className="text-xs text-gray-500 mb-1">Type: {resource.type}</p>}
                {/* Link */}
                 {resource.url && (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-blue-600 hover:underline text-sm font-medium group">
                        View Resource <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
                    </a>
                 )}
                 {/* Close Button */}
                <Button onClick={onClose} variant="outline" size="sm" className="mt-6 w-full">Close</Button>
            </div>
        </div>
    );
};


/**
 * Renders the detail view for a full Course (like QuickStart).
 * The Course structure is assumed to be { id, title, summary, icon, modules: [...] }
 */
const CourseDetailView = ({ course, setCourseDetail }) => {
    // Determine Icon and Color
    const { IconMap, LEADERSHIP_TIERS, navigate } = useAppServices();
    const IconComponent = IconMap?.[course.icon] || ShieldCheck;
    const tierMeta = LEADERSHIP_TIERS?.[course.tier_id];
    const accentColorKey = tierMeta?.color?.split('-')[0].toUpperCase() || 'TEAL';
    const accentColor = COLORS[accentColorKey] || COLORS.TEAL;

    return (
        <div className="p-6 md:p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 lg:p-10 max-w-4xl mx-auto">
            {/* Back Button */}
            <Button onClick={() => setCourseDetail(null)} variant='nav-back' className='mb-6'>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Course Library
            </Button>

            {/* Course Header Card */}
            <Card accent={accentColorKey} className="mb-8">
                 <div className='flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4'>
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg flex-shrink-0" style={{ background: `${accentColor}1A` }}>
                        {IconComponent && <IconComponent className="w-8 h-8" style={{ color: accentColor }} />}
                    </div>
                    {/* Title & Summary */}
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-xl sm:text-2xl sm:text-3xl font-extrabold" style={{ color: COLORS.NAVY }}>{course.title}</h1>
                        <p className="text-md md:text-lg text-gray-600 mt-1">{course.description}</p>
                        
                        {/* Course Meta Information */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="text-xs text-gray-500 uppercase">Duration</span>
                                <p className="font-semibold">{course.duration}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 uppercase">Format</span>
                                <p className="font-semibold">{course.format}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 uppercase">Level</span>
                                <p className="font-semibold">{course.level}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 uppercase">Price</span>
                                <p className="font-semibold text-lg" style={{ color: accentColor }}>${course.price}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
            
            {/* Enrollment and Schedule Card */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Enrollment Info */}
                <Card title="Enrollment" icon={Users} accent='TEAL'>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">Enrollment Progress</span>
                                <span className="text-sm font-semibold">{course.currentEnrollment}/{course.maxParticipants}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="h-2 rounded-full" 
                                    style={{ 
                                        backgroundColor: COLORS.TEAL,
                                        width: `${(course.currentEnrollment / course.maxParticipants) * 100}%` 
                                    }}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Start Date:</span>
                                <span className="font-medium">{new Date(course.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">End Date:</span>
                                <span className="font-medium">{new Date(course.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Enrollment Deadline:</span>
                                <span className="font-medium text-red-600">{new Date(course.enrollmentDeadline).toLocaleDateString()}</span>
                            </div>
                        </div>
                        
                        <Button 
                            variant="primary" 
                            className="w-full mt-4"
                            onClick={() => alert(`Enrollment for ${course.title} - Implementation coming soon!`)}
                        >
                            Enroll Now - ${course.price}
                        </Button>
                    </div>
                </Card>
                
                {/* Schedule & Instructor */}
                <Card title="Schedule & Instructor" icon={Calendar} accent='NAVY'>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-sm mb-2">Meeting Times:</h4>
                            <ul className="space-y-1">
                                {course.meetingTimes?.map((time, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {time}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-sm mb-2">Instructor:</h4>
                            <p className="font-medium">{course.instructor}</p>
                            <p className="text-sm text-gray-600">{course.instructorBio}</p>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-sm mb-2">Prerequisites:</h4>
                            <ul className="space-y-1">
                                {course.prerequisites?.map((prereq, idx) => (
                                    <li key={idx} className="text-sm text-gray-600">• {prereq}</li>
                                ))}
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-sm mb-2">Learning Outcomes:</h4>
                            <ul className="space-y-1">
                                {course.learningOutcomes?.map((outcome, idx) => (
                                    <li key={idx} className="text-sm text-gray-600">✓ {outcome}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>

            {/* AI Coaching Simulator for the Course */}
            <AICoachingSimulator item={course} isCourse={true} />

            {/* Modules/Sessions Card */}
            <Card title="Course Modules" icon={Briefcase} accent='NAVY' className='mt-8'>
                <div className="space-y-4">
                    {(course.modules || []).map((module, index) => (
                        <div key={module.id || index} className="p-4 rounded-lg border shadow-sm bg-white hover:border-blue-400 transition">
                            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.NAVY }}>
                                <span className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-extrabold text-white" style={{ background: accentColor }}>{module.id || index + 1}</span>
                                {module.title}
                            </h3>
                            {/* Why it Matters */}
                            <details className="my-3 group">
                                <summary className="text-sm font-semibold cursor-pointer list-none flex items-center gap-1" style={{ color: COLORS.TEAL }}>
                                    <Lightbulb className="w-4 h-4 text-amber-500"/> Rationale: {module.focus}
                                    <span className="text-xs text-gray-400 group-open:rotate-90 transition-transform">▶</span>
                                </summary>
                                <blockquote className="mt-2 border-l-4 pl-4 py-1 text-sm italic text-gray-600" style={{ borderColor: COLORS.TEAL }}>
                                    {module.rationale}
                                </blockquote>
                            </details>

                            {/* Pre-Work Checklist */}
                            <div className='mt-3 pt-3 border-t' style={{ borderColor: COLORS.SUBTLE }}>
                                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.ORANGE }}><CheckCircle className='w-4 h-4 inline-block mr-1'/> Pre-Work Required:</p>
                                <ul className="list-disc pl-5 text-gray-700 space-y-0.5 text-sm">
                                    {(module.preWork || []).map((item, idx) => (
                                        <li key={idx} className='text-xs'>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            {/* Special case link for LIS Auditor if it's QuickStart Session 2 */}
                            {course.id === 'quickstart_accelerator' && module.id === 2 && (
                                <Button onClick={() => navigate('quick-start-accelerator')} variant="secondary" size="sm" className='mt-4'>
                                    <Zap className="w-4 h-4" /> Go to LIS Auditor Tool
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};


/**
 * Renders the detail view for an individual Skill.
 */
const SkillDetailView = ({ skill, setSelectedSkill, resourceLibrary, getTierName }) => {
    // FIX: Define local state for modal visibility and resource
    const [isResourceModalVisible, setIsResourceModalVisible] = useState(false);
    const [currentResource, setCurrentResource] = useState(null);

    // FIX: Update modal handlers to use local state
    const localHandleOpenResource = (resource) => {
        setCurrentResource(resource);
        setIsResourceModalVisible(true);
    };

    const localHandleCloseResource = () => {
        setIsResourceModalVisible(false);
        setTimeout(() => setCurrentResource(null), 300);
    };

    // Get resources associated with this skill's ID from the pre-transformed library
    const resources = resourceLibrary?.[skill.skill_id] || []; // cite: useAppServices.jsx
    // Get the icon component from IconMap, fallback to BookOpen
    const { IconMap, LEADERSHIP_TIERS } = useAppServices();
    const IconComponent = IconMap?.[skill.icon] || BookOpen; // cite: useAppServices.jsx
    // Determine accent color based on the skill's tier
    const tierMeta = LEADERSHIP_TIERS?.[skill.tier_id]; // cite: useAppServices.jsx
    const accentColorKey = tierMeta?.color?.split('-')[0].toUpperCase();
    const accentColor = COLORS[accentColorKey] || COLORS.TEAL;

    return (
        // Consistent padding and max-width for detail view
        <div className="p-6 md:p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 lg:p-10 max-w-4xl mx-auto">
            {/* Back Button */}
            <Button onClick={() => setSelectedSkill(null)} variant='nav-back' className='mb-6'>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Course Library
            </Button>

            {/* Skill Header Card */}
            <Card accent={accentColorKey} className="mb-8">
                 <div className='flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4'>
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg flex-shrink-0" style={{ background: `${accentColor}1A` }}>
                        {IconComponent && <IconComponent className="w-8 h-8" style={{ color: accentColor }} />}
                    </div>
                    {/* Title, Summary, Tier Badge */}
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-xl sm:text-2xl sm:text-3xl font-extrabold" style={{ color: COLORS.NAVY }}>{skill.name}</h1>
                        <p className="text-md md:text-lg text-gray-600 mt-1">{skill.summary}</p>
                        <p className="text-xs font-semibold mt-3 px-3 py-1 rounded-full inline-block" style={{ background: `${accentColor}20`, color: accentColor }}>
                           {getTierName(skill.tier_id)} {/* Display tier name */}
                        </p>
                    </div>
                </div>
            </Card>

            {/* AI Coaching Simulator (Placeholder) */}
            <AICoachingSimulator item={skill} isCourse={false} />

            {/* Curated Resources Card */}
            <Card title="Curated Deep Dive Resources" icon={BookOpen} accent='NAVY' className='mt-8'>
                {/* Empty State */}
                {resources.length === 0 && (
                    <p className="text-gray-500 italic text-sm text-center py-4">
                        No specific resources linked to this skill yet.
                    </p>
                )}
                {/* Resource List */}
                <div className="space-y-3">
                    {resources.map((resource, index) => (
                        <button
                            key={resource.resource_id || index} // Use unique ID if available
                            onClick={() => localHandleOpenResource(resource)} // FIX: Use local handler
                            // Styling for resource list items
                            className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 transition flex justify-between items-center group focus:outline-none focus:ring-2 focus:ring-[${COLORS.TEAL}]"
                        >
                            <div className="overflow-hidden"> {/* Prevent text overflow */}
                                <p className="font-semibold text-sm truncate" style={{ color: COLORS.NAVY }}>{resource.title}</p>
                                <p className="text-xs text-gray-500">{resource.type || 'Resource'}</p>
                            </div>
                            <ChevronRight className='w-5 h-5 text-gray-400 flex-shrink-0 ml-2 group-hover:text-[${COLORS.TEAL}] transition-colors'/>
                        </button>
                    ))}
                </div>
            </Card>

            {/* Resource Detail Modal - FIX: Use local state and handlers */}
            <ResourceDetailModal
                isVisible={isResourceModalVisible}
                onClose={localHandleCloseResource}
                resource={currentResource}
                skill={skill} // Pass skill context
            />
        </div>
    );
};


/* =========================================================
   MAIN SCREEN COMPONENT: AppliedLeadershipScreen (Course Library)
========================================================= */

export default function AppliedLeadershipScreen() {
    // Scroll to top when component mounts
    React.useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);
    
    // Navigation context
    const { canGoBack, goBack } = useNavigation();
    
    // --- Consume services ---
    const {
        SKILL_CATALOG, // Contains individual skills
        COURSE_LIBRARY, // Contains full courses (like QuickStart)
        RESOURCE_LIBRARY,
        LEADERSHIP_TIERS,
        IconMap,
        isLoading: isAppLoading,
        error: appError,
    } = useAppServices();

    // --- Local State ---
    const [selectedSkill, setSelectedSkill] = useState(null); // Holds the currently viewed skill object
    const [selectedCourse, setSelectedCourse] = useState(null); // Holds the currently viewed course object
    const [isModalVisible, setIsModalVisible] = useState(false); // Modal for resource detail (only used in legacy structure/home view)
    const [selectedResource, setSelectedResource] = useState(null);

    // --- Effect to scroll to top on mount or when detail changes ---
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [selectedSkill, selectedCourse]);

    // --- Derived Data ---
    // Safely extract the array of individual skills
    const safeSkills = useMemo(() => {
        if (isAppLoading) return [];
        if (SKILL_CATALOG && typeof SKILL_CATALOG === 'object' && Array.isArray(SKILL_CATALOG.items)) {
            return SKILL_CATALOG.items;
        }
        console.warn("[AppliedLeadership] SKILL_CATALOG data is missing or invalid.");
        return [];
    }, [SKILL_CATALOG, isAppLoading]); // cite: useAppServices.jsx

    // Safely extract the array of courses
    const safeCourses = useMemo(() => {
        if (isAppLoading) return [];
        console.log("[AppliedLeadership] COURSE_LIBRARY data:", COURSE_LIBRARY);
        if (COURSE_LIBRARY && typeof COURSE_LIBRARY === 'object' && Array.isArray(COURSE_LIBRARY.items)) {
            // Courses are expected to have a 'title' field
            const filteredCourses = COURSE_LIBRARY.items.filter(item => item.title);
            console.log("[AppliedLeadership] Found", filteredCourses.length, "courses:", filteredCourses.map(c => c.title));
            return filteredCourses;
        }
        console.warn("[AppliedLeadership] COURSE_LIBRARY data is missing or invalid. Using empty array.");
        return [];
    }, [COURSE_LIBRARY, isAppLoading]); // cite: useAppServices.jsx

    // --- Callbacks ---
    const handleSelectSkill = useCallback((skill) => {
        console.log("[AppliedLeadership] Selecting skill:", skill.name);
        setSelectedCourse(null); // Clear course selection
        setSelectedSkill(skill);
    }, []);

    const handleSelectCourse = useCallback((course) => {
        console.log("[AppliedLeadership] Selecting course:", course.title);
        setSelectedSkill(null); // Clear skill selection
        setSelectedCourse(course);
    }, []);

    // These resource handlers are now only relevant for the top-level home view if it links to resources directly
    // They are no longer needed for SkillDetailView since it manages its own state.
    const handleOpenResource = useCallback((resource) => {
        console.log("[AppliedLeadership] Opening resource (Home View):", resource.title);
        setSelectedResource(resource);
        setIsModalVisible(true);
    }, []);

    const handleCloseResource = useCallback(() => {
        setIsModalVisible(false);
        setTimeout(() => setSelectedResource(null), 300);
    }, []);

    const getTierName = useCallback((tierId) => {
        return LEADERSHIP_TIERS?.[tierId]?.name || `Tier ${tierId}`; // cite: useAppServices.jsx
    }, [LEADERSHIP_TIERS]);

    // --- RENDER: Skill Grid View (Course Library Home) ---
    const renderLibraryHome = () => (
        <div className="p-6 md:p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 lg:p-10">
            {/* Back Button */}
            <Button onClick={() => window.history.back()} variant="nav-back" size="sm" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Library
            </Button>
            
            {/* Header */}
            <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.NAVY+'30'}}>
                <ShieldCheck className='w-10 h-10' style={{color: COLORS.NAVY}}/> {/* Use consistent header style */}
                <h1 className="text-xl sm:text-2xl sm:text-3xl md:text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Course Library</h1>
            </div>
            <p className="text-lg text-gray-600 mb-10 max-w-3xl">
                Explore leadership skills, access curated resources, practice with AI coaching, and build mastery through focused reps. **Practice over theory.**
            </p>

            {/* Loading/Error States */}
            {isAppLoading && <LoadingSpinner message="Loading course library..." />}
            {!isAppLoading && appError && (
                 <div className="text-red-600 italic text-center py-10 bg-red-50 p-4 rounded-lg border border-red-200 max-w-2xl mx-auto flex items-center justify-center gap-2">
                     <AlertTriangle className="w-5 h-5 text-red-500"/>
                     <span>Error loading library: {appError.message}. Please try again later.</span>
                 </div>
            )}

            {/* --- 1. COURSE Section (QuickStart, etc.) --- */}
            {safeCourses.length > 0 && (
                <section className='mb-12'>
                    <h2 className='text-2xl font-bold mb-6 border-l-4 pl-3 flex items-center gap-2' style={{ color: COLORS.NAVY, borderColor: COLORS.ORANGE }}>
                        <Zap className='w-6 h-6' style={{color: COLORS.ORANGE}}/> Programs & Courses
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:p-4 lg:p-6">
                        {safeCourses.map((course) => {
                            const IconComponent = IconMap?.[course.icon] || Briefcase;
                            const accentColorKey = (course.tier_id ? LEADERSHIP_TIERS?.[course.tier_id]?.color?.split('-')[0].toUpperCase() : null) || 'ORANGE';
                            const accentColor = COLORS[accentColorKey] || COLORS.ORANGE;
                            const moduleCount = course.modules?.length || 0;

                            return (
                                <button
                                    key={course.id}
                                    onClick={() => handleSelectCourse(course)}
                                    className="text-left block w-full group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${COLORS.ORANGE}] rounded-2xl"
                                >
                                    <div className={`p-6 rounded-2xl border-2 shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl h-full flex flex-col`}
                                         style={{ borderColor: `${accentColor}30`, background: COLORS.LIGHT_GRAY }}>
                                        <div className='flex items-center space-x-3 mb-3'>
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md flex-shrink-0" style={{ background: `${accentColor}1A` }}>
                                                {IconComponent && <IconComponent className="w-6 h-6" style={{ color: accentColor }} />}
                                            </div>
                                            <h2 className="text-lg font-extrabold flex-1" style={{ color: COLORS.NAVY }}>{course.title}</h2>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4 flex-grow" style={{ minHeight: '3rem' }}>{course.description}</p>
                                        
                                        {/* Course Details */}
                                        <div className="space-y-2 mb-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500">Duration:</span>
                                                <span className="font-medium">{course.duration}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500">Format:</span>
                                                <span className="font-medium">{course.format}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500">Starts:</span>
                                                <span className="font-medium">{new Date(course.startDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500">Enrollment:</span>
                                                <span className="font-medium">{course.currentEnrollment}/{course.maxParticipants}</span>
                                            </div>
                                        </div>
                                        
                                        <div className='mt-auto pt-3 border-t' style={{ borderColor: COLORS.SUBTLE }}>
                                            <div className='flex justify-between items-center'>
                                                <div className="flex flex-col">
                                                    <span className='text-xs font-semibold uppercase' style={{ color: accentColor }}>
                                                        {moduleCount} Module{moduleCount !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className='text-sm font-bold' style={{ color: COLORS.NAVY }}>
                                                        ${course.price}
                                                    </span>
                                                </div>
                                                <ChevronRight className='w-4 h-4' style={{ color: accentColor }}/>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* --- 2. SKILL Section --- */}
            {safeSkills.length > 0 && (
                <section>
                    <h2 className='text-2xl font-bold mb-6 border-l-4 pl-3 flex items-center gap-2' style={{ color: COLORS.NAVY, borderColor: COLORS.TEAL }}>
                        <Briefcase className='w-6 h-6' style={{color: COLORS.TEAL}}/> Individual Skills & Micro-Learning
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:p-4 lg:p-6">
                        {safeSkills.map((skill) => {
                            const IconComponent = IconMap?.[skill.icon] || BookOpen;
                            const tierMeta = LEADERSHIP_TIERS?.[skill.tier_id];
                            const accentColorKey = tierMeta?.color?.split('-')[0].toUpperCase();
                            const accentColor = COLORS[accentColorKey] || COLORS.TEAL;
                            const resourceCount = RESOURCE_LIBRARY?.[skill.skill_id]?.length || 0;

                            return (
                                <button
                                    key={skill.skill_id}
                                    onClick={() => handleSelectSkill(skill)}
                                    className="text-left block w-full group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${COLORS.TEAL}] rounded-2xl"
                                >
                                    <div className={`p-6 rounded-2xl border-2 shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl h-full flex flex-col`}
                                         style={{ borderColor: `${accentColor}30`, background: COLORS.LIGHT_GRAY }}>
                                        <div className='flex items-center space-x-3 mb-3'>
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md flex-shrink-0" style={{ background: `${accentColor}1A` }}>
                                                {IconComponent && <IconComponent className="w-6 h-6" style={{ color: accentColor }} />}
                                            </div>
                                            <h2 className="text-lg font-extrabold flex-1" style={{ color: COLORS.NAVY }}>{skill.name}</h2>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4 flex-grow" style={{ minHeight: '3rem' }}>{skill.summary}</p>
                                        <div className='mt-auto pt-3 border-t' style={{ borderColor: COLORS.SUBTLE }}>
                                            <div className='flex justify-between items-center'>
                                                <span className='text-xs font-semibold uppercase' style={{ color: accentColor }}>
                                                    {resourceCount} Resource{resourceCount !== 1 ? 's' : ''}
                                                </span>
                                                <ChevronRight className='w-4 h-4' style={{ color: accentColor }}/>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Empty State (Post-Loading, No Error) */}
            {!isAppLoading && !appError && safeSkills.length === 0 && safeCourses.length === 0 && (
                 <div className="text-gray-500 italic text-center py-10 bg-gray-100 p-4 rounded-lg border border-gray-200 max-w-2xl mx-auto flex items-center justify-center gap-2">
                     <AlertTriangle className="w-5 h-5 text-orange-500"/>
                     <span>The Course Library and Skill Catalog appear to be empty or missing data. Please contact an administrator.</span>
                 </div>
            )}
        </div>
    );

    // --- Main Component Return ---
    // Renders either a detail view or the main grid
    return (
        <div className='min-h-screen' style={{ background: COLORS.BG }}>
            {selectedCourse ? (
                <CourseDetailView course={selectedCourse} setCourseDetail={setSelectedCourse} />
            ) : selectedSkill ? (
                 <SkillDetailView
                    skill={selectedSkill}
                    setSelectedSkill={setSelectedSkill}
                    resourceLibrary={RESOURCE_LIBRARY}
                    getTierName={getTierName}
                    handleOpenResource={handleOpenResource}
                 />
            ) : (
                renderLibraryHome()
            )}

            {/* Global Resource Modal (Used by SkillDetailView) */}
            <ResourceDetailModal
                isVisible={isModalVisible}
                onClose={handleCloseResource}
                resource={selectedResource}
                skill={selectedSkill || {}} // Pass skill context
            />
        </div>
    );
}