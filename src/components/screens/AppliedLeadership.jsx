// src/components/screens/AppliedLeadership.jsx (Refactored as Course Library Hub)

import React, { useState, useMemo, useCallback, useEffect } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Icons ---
import { ArrowLeft, BookOpen, ChevronRight, Loader, AlertTriangle, ShieldCheck } from 'lucide-react'; // Added ShieldCheck

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', PURPLE: '#7C3AED', BG: '#F9FAFB' }; // cite: App.jsx

// --- Standardized Button Component (Matches Dashboard) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use exact Button definition from Dashboard.jsx ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
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
const AICoachingSimulator = ({ skill }) => ( // Renamed prop to 'skill'
  <Card title={`AI Rep Coach for ${skill.name}`} icon={ShieldCheck} accent="PURPLE" className="my-8">
    <p className="text-sm text-gray-600 mb-4">Practice applying '{skill.name}' principles in simulated scenarios.</p>
    {/* Placeholder content */}
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center text-purple-700 font-medium italic">
      AI Coaching Simulator coming soon...
    </div>
  </Card>
);

/**
 * Modal to display details of a selected resource.
 */
const ResourceDetailModal = ({ isVisible, onClose, resource, skill }) => { // Renamed prop to 'skill'
    if (!isVisible || !resource || !skill) return null;

    return (
        // Standard modal structure with backdrop and content
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 overflow-hidden">
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

/* =========================================================
   MAIN SCREEN COMPONENT: AppliedLeadershipScreen (Course Library)
========================================================= */

export default function AppliedLeadershipScreen() {
    // --- Consume services ---
    const {
        // Renamed Catalog Data
        SKILL_CATALOG, // Contains { items: [{ id, name, summary, icon, tier_id,... }] } // cite: useAppServices.jsx
        RESOURCE_LIBRARY, // Contains { skill_id_1: [resources...], skill_id_2: [...] } // cite: useAppServices.jsx
        LEADERSHIP_TIERS, // Contains { T1: { name, icon, color, ... }, ... } // cite: useAppServices.jsx
        IconMap, // Maps icon names (string) to Lucide components // cite: useAppServices.jsx
        isLoading: isAppLoading, // Combined loading state // cite: useAppServices.jsx
        error: appError,         // Combined error state // cite: useAppServices.jsx
        navigate,               // Navigation function
    } = useAppServices();

    // --- Local State ---
    const [selectedSkill, setSelectedSkill] = useState(null); // Holds the currently viewed skill object
    const [isModalVisible, setIsModalVisible] = useState(false); // Resource detail modal state
    const [selectedResource, setSelectedResource] = useState(null); // Resource object for the modal

    // --- Effect to scroll to top on mount or when selectedSkill changes ---
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [selectedSkill]);

    // --- Derived Data ---
    // Safely extract the array of skills from the catalog, handling loading/missing data
    const safeSkills = useMemo(() => {
        if (isAppLoading) return []; // Return empty while loading
        // Check structure and fallback
        if (SKILL_CATALOG && typeof SKILL_CATALOG === 'object' && Array.isArray(SKILL_CATALOG.items)) {
            return SKILL_CATALOG.items;
        }
        console.warn("[AppliedLeadership] SKILL_CATALOG data is missing or invalid. Using empty array.");
        return []; // Fallback
    }, [SKILL_CATALOG, isAppLoading]); // cite: useAppServices.jsx

    // --- Callbacks ---
    // Sets the selected skill to display the detail view
    const handleSelectSkill = useCallback((skill) => {
        console.log("[AppliedLeadership] Selecting skill:", skill.name);
        setSelectedSkill(skill);
        // Scroll handled by useEffect
    }, []);

    // Opens the resource detail modal
    const handleOpenResource = useCallback((resource) => {
        console.log("[AppliedLeadership] Opening resource:", resource.title);
        setSelectedResource(resource);
        setIsModalVisible(true);
    }, []);

    // Closes the resource detail modal
    const handleCloseResource = useCallback(() => {
        setIsModalVisible(false);
        // Delay clearing selectedResource to allow modal fade-out animation
        setTimeout(() => setSelectedResource(null), 300);
    }, []);

    // Retrieves the Tier name from LEADERSHIP_TIERS using the tier_id
    const getTierName = useCallback((tierId) => {
        return LEADERSHIP_TIERS?.[tierId]?.name || `Tier ${tierId}`; // cite: useAppServices.jsx
    }, [LEADERSHIP_TIERS]);

    // --- RENDER: Skill Detail View ---
    const renderSkillDetail = () => {
        // Should not happen if selectedSkill is required, but safety check
        if (!selectedSkill) return null;

        const skill = selectedSkill;
        // Get resources associated with this skill's ID from the pre-transformed library
        const resources = RESOURCE_LIBRARY?.[skill.skill_id] || []; // cite: useAppServices.jsx
        // Get the icon component from IconMap, fallback to BookOpen
        const IconComponent = IconMap?.[skill.icon] || BookOpen; // cite: useAppServices.jsx
        // Determine accent color based on the skill's tier
        const tierMeta = LEADERSHIP_TIERS?.[skill.tier_id]; // cite: useAppServices.jsx
        const accentColorKey = tierMeta?.color?.split('-')[0].toUpperCase(); // e.g., "INDIGO" -> INDIGO
        const accentColor = COLORS[accentColorKey] || COLORS.TEAL; // Get hex from palette, fallback TEAL

        return (
            // Consistent padding and max-width for detail view
            <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto">
                {/* Back Button */}
                <Button onClick={() => setSelectedSkill(null)} variant='nav-back' className='mb-6'>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Course Library
                </Button>

                {/* Skill Header Card */}
                <Card accent={accentColorKey} className="mb-8"> {/* Use color key for accent */}
                     <div className='flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4'>
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg flex-shrink-0" style={{ background: `${accentColor}1A` }}> {/* Lighter background */}
                            {IconComponent && <IconComponent className="w-8 h-8" style={{ color: accentColor }} />}
                        </div>
                        {/* Title, Summary, Tier Badge */}
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-extrabold" style={{ color: COLORS.NAVY }}>{skill.name}</h1>
                            <p className="text-md md:text-lg text-gray-600 mt-1">{skill.summary}</p>
                            <p className="text-xs font-semibold mt-3 px-3 py-1 rounded-full inline-block" style={{ background: `${accentColor}20`, color: accentColor }}>
                               {getTierName(skill.tier_id)} {/* Display tier name */}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* AI Coaching Simulator (Placeholder) */}
                <AICoachingSimulator skill={skill} />

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
                                onClick={() => handleOpenResource(resource)}
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

                {/* Resource Detail Modal */}
                <ResourceDetailModal
                    isVisible={isModalVisible}
                    onClose={handleCloseResource}
                    resource={selectedResource}
                    skill={selectedSkill} // Pass skill for context
                />
            </div>
        );
    };

    // --- RENDER: Skill Grid View (Course Library Home) ---
    const renderSkillGrid = () => (
        // Consistent padding
        <div className="p-6 md:p-8 lg:p-10">
            {/* Header */}
            <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.NAVY+'30'}}>
                <ShieldCheck className='w-10 h-10' style={{color: COLORS.NAVY}}/> {/* Use consistent header style */}
                <h1 className="text-3xl md:text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Course Library</h1>
            </div>
            <p className="text-lg text-gray-600 mb-10 max-w-3xl">
                Explore leadership skills, access curated resources, practice with AI coaching, and build mastery through focused reps. **Practice over theory.**
            </p>

            {/* Loading State */}
            {isAppLoading && <LoadingSpinner message="Loading course library..." />}

            {/* Error State (Post-Loading) */}
            {!isAppLoading && appError && (
                 <div className="text-red-600 italic text-center py-10 bg-red-50 p-4 rounded-lg border border-red-200 max-w-2xl mx-auto flex items-center justify-center gap-2">
                     <AlertTriangle className="w-5 h-5 text-red-500"/>
                     <span>Error loading library: {appError.message}. Please try again later.</span>
                 </div>
            )}

            {/* Empty State (Post-Loading, No Error) */}
            {!isAppLoading && !appError && safeSkills.length === 0 && (
                 <div className="text-gray-500 italic text-center py-10 bg-gray-100 p-4 rounded-lg border border-gray-200 max-w-2xl mx-auto flex items-center justify-center gap-2">
                     <AlertTriangle className="w-5 h-5 text-orange-500"/>
                     <span>The Skill Catalog (<code>metadata/config/catalog/SKILL_CATALOG</code>) appears to be empty or missing. Please contact an administrator.</span>
                 </div>
            )}

            {/* Skill Grid */}
            {!isAppLoading && !appError && safeSkills.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {safeSkills.map((skill) => {
                        // Determine Icon and Color
                        const IconComponent = IconMap?.[skill.icon] || BookOpen; // Fallback icon // cite: useAppServices.jsx
                        const tierMeta = LEADERSHIP_TIERS?.[skill.tier_id]; // cite: useAppServices.jsx
                        const accentColorKey = tierMeta?.color?.split('-')[0].toUpperCase();
                        const accentColor = COLORS[accentColorKey] || COLORS.TEAL;
                        const resourceCount = RESOURCE_LIBRARY?.[skill.skill_id]?.length || 0; // cite: useAppServices.jsx

                        return (
                            // Use Button styling for accessibility and interaction consistency
                            <button
                                key={skill.skill_id} // Use skill_id as the unique key
                                onClick={() => handleSelectSkill(skill)}
                                className="text-left block w-full group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${COLORS.TEAL}] rounded-2xl"
                            >
                                {/* Apply Card styling directly for hover effects */}
                                <div className={`p-6 rounded-2xl border-2 shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl group-focus:scale-[1.03] group-focus:shadow-xl h-full flex flex-col`} // Added h-full and flex
                                     style={{ borderColor: `${accentColor}30`, background: COLORS.LIGHT_GRAY }}>
                                    {/* Icon and Title */}
                                    <div className='flex items-center space-x-3 mb-3'>
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 group-hover:shadow-lg flex-shrink-0" style={{ background: `${accentColor}1A` }}>
                                            {IconComponent && <IconComponent className="w-6 h-6 transition-colors duration-300" style={{ color: accentColor }} />}
                                        </div>
                                        <h2 className="text-lg font-extrabold transition-colors duration-300 flex-1" style={{ color: COLORS.NAVY }}>{skill.name}</h2>
                                    </div>
                                    {/* Summary (fixed height for alignment) */}
                                    <p className="text-sm text-gray-600 mb-4 flex-grow" style={{ minHeight: '3rem' }}>{skill.summary}</p>
                                    {/* Footer: Resource Count & Arrow */}
                                    <div className='mt-auto pt-3 border-t' style={{ borderColor: COLORS.SUBTLE }}>
                                        <div className='flex justify-between items-center'>
                                            <span className='text-xs font-semibold uppercase transition-colors duration-300' style={{ color: accentColor }}>
                                                {resourceCount} Resource{resourceCount !== 1 ? 's' : ''}
                                            </span>
                                            <ChevronRight className='w-4 h-4 transition-colors duration-300' style={{ color: accentColor }}/>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // --- Main Component Return ---
    // Renders either the grid or the detail view based on selectedSkill state
    return (
        <div className='min-h-screen' style={{ background: COLORS.BG }}> {/* Use consistent BG */}
            {selectedSkill ? renderSkillDetail() : renderSkillGrid()}
        </div>
    );
}