// src/components/screens/AppliedLeadership.jsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
// ... other imports ...
import { useAppServices } from '../../services/useAppServices.jsx';

// ... COLORS, Card, Button, mdToHtml, IconMap components ...
// ... AICoachingSimulator, ResourceDetailModal components ...

/* =========================================================
   MAIN SCREEN COMPONENT (UPDATED)
========================================================= */

export default function AppliedLeadershipScreen() {
    // --- UPDATED: Get data and main loading flag from useAppServices ---
    const {
        LEADERSHIP_DOMAINS: DOMAINS,
        RESOURCE_LIBRARY: RESOURCES,
        isLoading // Use the main combined loading flag
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

    // Detail View Renderer (Unchanged logic, but relies on RESOURCES from context)
    const renderDomainDetail = () => {
        if (!selectedDomain) return null;
        const domain = selectedDomain;
        // Resources are now directly from context
        const resources = RESOURCES?.[domain.id] || [];
        const Icon = IconMap[domain.id];
        // ... rest of renderDomainDetail remains the same ...
        return (
            <div className="p-8 bg-white rounded-3xl shadow-2xl sticky top-0 md:top-4 z-30">
                 <Button onClick={() => setSelectedDomain(null)} variant='nav-back' className='mb-6'>
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Domains
                </Button>
                 {/* ... rest of the detail view JSX ... */}
                 <AICoachingSimulator domain={domain} RESOURCES={RESOURCES} />
                 {/* ... rest of the detail view JSX ... */}
                 <Card title="Curated Deep Dive Resources" icon={BookOpen} accent='NAVY' className='mt-8 lg:col-span-3'>
                    {/* ... resource list mapping ... */}
                     {resources.length === 0 && <p className="text-gray-500 italic">No specific resources found for this domain yet.</p>}
                     {resources.map((resource, index) => (
                         <button
                             key={index}
                             onClick={() => handleOpenResource(resource)}
                             // ... rest of button ...
                         >
                            {/* ... button content ... */}
                         </button>
                     ))}
                 </Card>
                 <ResourceDetailModal
                    isVisible={isModalVisible}
                    onClose={() => setIsModalVisible(false)}
                    resource={selectedResource}
                    domain={selectedDomain}
                 />
            </div>
        );
    };

    // Main Domain Grid Renderer (UPDATED error message)
    const renderDomainGrid = () => (
        <div className="p-8">
            <h1 className="text-4xl font-extrabold text-[#002E47] mb-4">Applied Content Library (Pillar 1)</h1>
            <p className="text-xl text-gray-600 mb-10 max-w-4xl">
                Go beyond generic advice. Access micro-habits, resources, and AI coaching tailored to your specific industry, identity, or high-stakes operational context. **Practice over theory.**
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {safeDomains.map((domain) => {
                    const Icon = IconMap[domain.id];
                    // Defensive check for color mapping
                    const accentColor = domain.color && COLORS[domain.color.toUpperCase()] ? COLORS[domain.color.toUpperCase()] : COLORS.TEAL; // Fallback to TEAL

                    return (
                        <button
                            key={domain.id}
                            onClick={() => handleSelectDomain(domain)}
                            className="text-left block w-full"
                        >
                            <div className={`p-6 rounded-2xl border-2 shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-3xl`} style={{ borderColor: accentColor + '30', background: COLORS.LIGHT_GRAY }}>
                                <div className='flex items-center space-x-3 mb-4'>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg" style={{ background: accentColor + '1A' }}>
                                        {Icon && <Icon className="w-6 h-6" style={{ color: accentColor }} />}
                                    </div>
                                    <h2 className="text-lg font-extrabold" style={{ color: COLORS.NAVY }}>{domain.title}</h2>
                                </div>
                                <p className="text-sm text-gray-600">{domain.subtitle}</p>
                                <div className='mt-4 flex justify-between items-center border-t pt-3'>
                                    <span className='text-xs font-semibold uppercase' style={{ color: accentColor }}>{domain.focus.length} Key Focus Areas</span>
                                    <ChevronRight className='w-4 h-4' style={{ color: accentColor }}/>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Use the main isLoading flag */}
            {isLoading && (
                 <p className="text-gray-500 italic text-center py-10 flex items-center justify-center">
                    <div className="animate-spin h-4 w-4 border-b-2 border-[#47A88D] mr-2 rounded-full"></div>
                    Loading global configuration...
                </p>
            )}

            {/* --- UPDATED ERROR MESSAGE --- */}
            {/* Show error if loading is done AND domains array is still empty */}
            {!isLoading && safeDomains.length === 0 && (
                 <p className="text-red-500 italic text-center py-10">
                    Configuration Error: `leadership_domains` is missing or empty in the `metadata/config` document in Firestore. Please check the Firestore data.
                </p>
            )}
        </div>
    );

    return (
        <div className='min-h-screen bg-gray-50'>
            {selectedDomain ? renderDomainDetail() : renderDomainGrid()}
        </div>
    );
}