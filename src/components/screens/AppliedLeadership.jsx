// src/components/screens/AppliedLeadership.jsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
// --- ADDED: Missing lucide-react imports ---
import { ArrowLeft, BookOpen, ChevronRight, Loader } from 'lucide-react'; // Added Loader
import { useAppServices } from '../../services/useAppServices.jsx';

/* =========================================================
   COLORS & UI COMPONENTS (Assuming these exist)
========================================================= */
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#002E47', MUTED: '#4B5355', PURPLE: '#7C3AED'};
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => { let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center"; if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; } else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-red-700 focus:ring-[${COLORS.ORANGE}]/50`; } else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; } else if (variant === 'nav-back') { baseStyle = `px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center`; } if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; } return ( <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button> ); };
const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => { const interactive = !!onClick; const Tag = interactive ? 'button' : 'div'; const accentColor = COLORS[accent] || COLORS.NAVY; const handleKeyDown = (e) => { if (!interactive) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }; return ( <Tag {...(interactive ? { type: 'button' } : {})} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} onKeyDown={handleKeyDown} className={`relative p-6 rounded-2xl border-2 shadow-2xl hover:shadow-xl transition-all duration-300 text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }} onClick={onClick}> <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} /> {Icon && ( <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} /> </div> )} {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>} {children} </Tag> ); };

// Placeholder components (replace with actual implementations if needed)
const AICoachingSimulator = ({ domain, RESOURCES }) => <div className="p-4 my-4 bg-purple-50 border border-purple-200 rounded-lg">AI Coaching Simulator Placeholder for {domain.title}</div>;
const ResourceDetailModal = ({ isVisible, onClose, resource, domain }) => {
    if (!isVisible || !resource) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg max-w-lg w-full relative">
                <button onClick={onClose} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-600">&times;</button>
                <h3 className="text-xl font-bold mb-2">{resource.title} ({domain.title})</h3>
                <p className="text-sm text-gray-600">{resource.description || 'Details unavailable.'}</p>
                {/* Add more resource details here */}
                <Button onClick={onClose} variant="outline" className="mt-4 w-full">Close</Button>
            </div>
        </div>
    );
};
/* =========================================================
   MAIN SCREEN COMPONENT (UPDATED)
========================================================= */

export default function AppliedLeadershipScreen() {
    // --- UPDATED: Get data including IconMap from useAppServices ---
    const {
        LEADERSHIP_DOMAINS: DOMAINS,
        RESOURCE_LIBRARY: RESOURCES,
        isLoading, // Use the main combined loading flag
        IconMap = {} // <-- FIX: Added IconMap and default to empty object
    } = useAppServices();

    // Use a safe, empty array fallback. Check *after* loading is complete.
    const safeDomains = !isLoading && Array.isArray(DOMAINS) ? DOMAINS : [];

    const [selectedDomain, setSelectedDomain] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedResource, setSelectedResource] = useState(null);

    const handleSelectDomain = useCallback((domain) => {
        setSelectedDomain(domain);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleOpenResource = useCallback((resource) => {
        setSelectedResource(resource);
        setIsModalVisible(true);
    }, []);

    // Detail View Renderer (Now safely uses IconMap)
    const renderDomainDetail = () => {
        if (!selectedDomain) return null;
        const domain = selectedDomain;
        const resources = RESOURCES?.[domain.id] || [];
        const Icon = IconMap[domain.icon] || BookOpen; // Use domain.icon key, fallback to BookOpen
        const accentColor = domain.color && COLORS[domain.color.toUpperCase()] ? COLORS[domain.color.toUpperCase()] : COLORS.TEAL;

        return (
            <div className="p-6 md:p-8 max-w-4xl mx-auto"> {/* Added max-width and centering */}
                {/* Back Button */}
                <Button onClick={() => setSelectedDomain(null)} variant='outline' className='mb-6 !px-4 !py-2 text-sm'>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Domains
                </Button>

                {/* Domain Header */}
                <Card accent={domain.color?.toUpperCase()} className="mb-8">
                     <div className='flex items-start space-x-4'>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg flex-shrink-0" style={{ background: accentColor + '1A' }}>
                            {Icon && <Icon className="w-8 h-8" style={{ color: accentColor }} />}
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold" style={{ color: COLORS.NAVY }}>{domain.title}</h1>
                            <p className="text-lg text-gray-600 mt-1">{domain.subtitle}</p>
                        </div>
                    </div>
                </Card>

                {/* AI Coaching Simulator Placeholder */}
                <AICoachingSimulator domain={domain} RESOURCES={RESOURCES} />

                {/* Resources Card */}
                <Card title="Curated Deep Dive Resources" icon={BookOpen} accent='NAVY' className='mt-8'>
                    {resources.length === 0 && <p className="text-gray-500 italic">No specific resources found for this domain yet.</p>}
                    <div className="space-y-3"> {/* Added spacing */}
                        {resources.map((resource, index) => (
                            <button
                                key={index}
                                onClick={() => handleOpenResource(resource)}
                                className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-200 transition flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold text-sm text-[#002E47]">{resource.title}</p>
                                    <p className="text-xs text-gray-500">{resource.type || 'Resource'} - {resource.duration || 'N/A'} min</p>
                                </div>
                                <ChevronRight className='w-5 h-5 text-gray-400'/>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Resource Detail Modal */}
                <ResourceDetailModal
                    isVisible={isModalVisible}
                    onClose={() => setIsModalVisible(false)}
                    resource={selectedResource}
                    domain={selectedDomain} // Pass domain for context
                />
            </div>
        );
    };

    // Main Domain Grid Renderer (Now safely uses IconMap)
    const renderDomainGrid = () => (
        <div className="p-6 md:p-8"> {/* Adjusted padding */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#002E47] mb-4">Applied Content Library</h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-4xl">
                Access micro-habits, resources, and AI coaching tailored to your leadership context. **Practice over theory.**
            </p>

            {/* Loading Indicator */}
            {isLoading && (
                 <div className="text-center py-10 flex items-center justify-center text-gray-500">
                    <Loader className="animate-spin h-5 w-5 mr-2 text-[#47A88D]" />
                    Loading leadership domains...
                </div>
            )}

            {/* Error Message */}
            {!isLoading && safeDomains.length === 0 && (
                 <p className="text-red-600 italic text-center py-10 bg-red-50 p-4 rounded-lg border border-red-200 max-w-2xl mx-auto">
                    Configuration Error: `leadership_domains` data is missing or empty. Please check the Firestore path: `metadata/config/catalog/leadership_domains`.
                </p>
            )}

            {/* Domain Grid */}
            {!isLoading && safeDomains.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {safeDomains.map((domain) => {
                        // Use domain.icon which should be the key (e.g., "Zap", "HeartPulse")
                        const Icon = IconMap[domain.icon] || BookOpen; // Fallback icon
                        const accentColor = domain.color && COLORS[domain.color.toUpperCase()] ? COLORS[domain.color.toUpperCase()] : COLORS.TEAL;

                        return (
                            <button
                                key={domain.id}
                                onClick={() => handleSelectDomain(domain)}
                                className="text-left block w-full group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#47A88D] rounded-2xl" // Added focus styles
                            >
                                <div className={`p-6 rounded-2xl border-2 shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl group-focus:scale-[1.03] group-focus:shadow-xl`} style={{ borderColor: accentColor + '30', background: COLORS.LIGHT_GRAY }}>
                                    <div className='flex items-center space-x-3 mb-4'>
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-300 group-hover:shadow-lg" style={{ background: accentColor + '1A' }}>
                                            {Icon && <Icon className="w-6 h-6 transition-colors duration-300" style={{ color: accentColor }} />}
                                        </div>
                                        <h2 className="text-lg font-extrabold transition-colors duration-300" style={{ color: COLORS.NAVY }}>{domain.title}</h2>
                                    </div>
                                    <p className="text-sm text-gray-600 h-10 overflow-hidden">{domain.subtitle}</p> {/* Set fixed height */}
                                    <div className='mt-4 flex justify-between items-center border-t border-gray-200 pt-3'>
                                        <span className='text-xs font-semibold uppercase transition-colors duration-300' style={{ color: accentColor }}>
                                            {Array.isArray(domain.focus) ? domain.focus.length : 0} Key Focus Areas {/* Safe check */}
                                        </span>
                                        <ChevronRight className='w-4 h-4 transition-colors duration-300' style={{ color: accentColor }}/>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // Main component return
    return (
        <div className='min-h-screen bg-gray-50'>
            {selectedDomain ? renderDomainDetail() : renderDomainGrid()}
        </div>
    );
}