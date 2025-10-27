// src/components/screens/ReflectionLogScreen.jsx (NEW FILE)

import React, { useState, useEffect, useMemo } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Firestore Imports ---
import { collection, query, orderBy, getDocs } from 'firebase/firestore'; // cite: DailyPractice.jsx

// --- Icons ---
import { Archive, Loader, MessageSquare, ArrowLeft, User } from 'lucide-react';

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', PURPLE: '#7C3AED', BG: '#F9FAFB' }; // cite: App.jsx

// --- Standardized UI Components (Assume imported or globally available) ---
// Using placeholder comments, assuming Button and Card are correctly defined elsewhere or globally
// const Button = ({...}) => { /* ... Standard Button ... */ };
// const Card = ({...}) => { /* ... Standard Card ... */ };
// --- Standardized Button Component (Local Definition for standalone use) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use definition ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C312] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};
// --- Standardized Card Component (Local Definition for standalone use) ---
const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY' }) => { /* ... Re-use definition ... */
    const accentColor = COLORS[accent] || COLORS.NAVY;
    return ( <div className={`relative p-6 rounded-2xl border-2 shadow-xl ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.NAVY }}> <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} /> {Icon && title && ( <div className="flex items-center gap-3 mb-4"> <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: accentColor }} /> </div> <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2> </div> )} {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>} <div>{children}</div> </div> );
};
// --- Standardized Loading Spinner ---
const LoadingSpinner = ({ message = "Loading..." }) => ( /* ... Re-use definition ... */
    <div className="min-h-[300px] flex items-center justify-center" style={{ background: COLORS.BG }}> <div className="flex flex-col items-center"> <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} /> <p className="font-semibold" style={{ color: COLORS.NAVY }}>{message}</p> </div> </div>
);

/* =========================================================
   ReflectionLogScreen Component
========================================================= */

/**
 * ReflectionLogScreen Component
 * Displays a chronological list of the user's saved daily reflections.
 * Fetches data from the `daily_practice/{userId}/reflection_history` subcollection.
 */
const ReflectionLogScreen = () => {
    // --- Consume Services ---
    const {
        db, userId, // Firestore instance and user ID
        isLoading: isAppLoading, // Global app loading state
        error: appError, // Global app error state
        navigate // Navigation function
    } = useAppServices(); // cite: useAppServices.jsx

    // --- Local State ---
    const [reflectionHistory, setReflectionHistory] = useState([]); // Stores fetched reflection entries
    const [isHistoryLoading, setIsHistoryLoading] = useState(true); // Loading state specific to this screen's fetch
    const [fetchError, setFetchError] = useState(null); // Error state specific to this screen's fetch

    // --- Effect to Fetch Reflection History ---
    useEffect(() => {
        // Only fetch if db and userId are available
        if (db && userId) {
            const fetchHistory = async () => {
                console.log("[ReflectionLogScreen] Fetching reflection history...");
                setIsHistoryLoading(true); // Start loading
                setFetchError(null); // Clear previous errors
                try {
                    // Define the Firestore query
                    const historyCollectionRef = collection(db, `daily_practice/${userId}/reflection_history`); // cite: useAppServices.jsx (collection path)
                    const q = query(historyCollectionRef, orderBy("timestamp", "desc")); // Order by timestamp descending // cite: DailyPractice.jsx
                    const querySnapshot = await getDocs(q); // Execute query

                    // Map Firestore documents to state array
                    const historyData = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        // Convert Firestore Timestamp to JS Date object if needed, otherwise keep as is for formatting
                        timestamp: doc.data().timestamp // Keep timestamp object
                    }));

                    setReflectionHistory(historyData);
                    console.log(`[ReflectionLogScreen] Fetched ${historyData.length} reflection entries.`);
                } catch (e) {
                    console.error("[ReflectionLogScreen] Failed to fetch reflection history:", e);
                    setFetchError(e.message || 'Failed to load history.'); // Set fetch error state
                    setReflectionHistory([]); // Clear history on error
                } finally {
                    setIsHistoryLoading(false); // Stop loading
                }
            };
            fetchHistory();
        } else {
            // Handle case where db or userId is not yet available (should be handled by global loading, but as safety)
            console.warn("[ReflectionLogScreen] DB or UserID not available for fetching history.");
            setIsHistoryLoading(false);
            if (!isAppLoading) { // Only set error if global loading is done
                 setFetchError("Database connection or user information not available.");
            }
        }
    }, [db, userId, isAppLoading]); // Dependencies: Re-fetch if db or userId changes

    // --- Helper Function for Formatting Date ---
    const formatDate = (timestamp) => {
        if (!timestamp) return 'No Date';
        try {
            // Check if it's a Firestore Timestamp object
            if (timestamp.toDate) {
                return timestamp.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            }
            // Otherwise, assume it might be an ISO string or Date object
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            console.error("Error formatting date:", timestamp, e);
            return 'Error Date';
        }
    };

    // --- Render Logic ---
    // Handle global loading state first
    if (isAppLoading) {
        return <LoadingSpinner message="Initializing..." />;
    }

    return (
        // Consistent page structure and padding
        <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto min-h-screen" style={{ background: COLORS.BG }}>
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4 mb-6" style={{ borderColor: COLORS.SUBTLE }}>
                <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3" style={{ color: COLORS.NAVY }}>
                    <Archive className="w-8 h-8" style={{ color: COLORS.TEAL }} /> Reflection Log
                </h1>
                {/* Back Button */}
                <Button onClick={() => navigate('dashboard')} variant="nav-back" size="sm"> {/* Use Button */}
                    <ArrowLeft size={16} className="mr-1" /> Back to The Arena
                </Button>
            </header>

            {/* Loading State for History Fetch */}
            {isHistoryLoading && <LoadingSpinner message="Loading reflection history..." />}

            {/* Error State for History Fetch */}
            {!isHistoryLoading && fetchError && (
                <Card accent="RED" className="text-center">
                    <p className="font-semibold text-red-700">Error Loading History</p>
                    <p className="text-sm text-red-600 mt-1">{fetchError}</p>
                </Card>
            )}

            {/* Empty State */}
            {!isHistoryLoading && !fetchError && reflectionHistory.length === 0 && (
                <Card accent="TEAL" className="text-center border-dashed">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400"/>
                    <h2 className="text-xl font-semibold mb-2" style={{ color: COLORS.NAVY }}>No Reflections Yet</h2>
                    <p className="text-gray-600 text-sm">Your daily reflection entries will appear here once you save them.</p>
                    <Button onClick={() => navigate('daily-practice')} size="sm" className="mt-4">
                        Go to Daily Reflection
                    </Button>
                </Card>
            )}

            {/* History List */}
            {!isHistoryLoading && !fetchError && reflectionHistory.length > 0 && (
                <div className="space-y-4">
                    {reflectionHistory.map((entry) => (
                        // Use Card for each entry for consistent styling
                        <Card key={entry.id} accent="NAVY" className="shadow-md hover:shadow-lg transition-shadow">
                            {/* Date Header */}
                            <p className="text-sm font-bold mb-3 border-b pb-2 flex justify-between items-center" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>
                               <span>{formatDate(entry.timestamp || entry.date)}</span>
                               {/* Optional: Show short ID */}
                               {/* <span className="text-xs font-normal text-gray-400">ID: {entry.id.slice(0, 6)}</span> */}
                            </p>
                            {/* Reflection Content */}
                            <div className="space-y-2 text-sm text-gray-700">
                                {entry.did && <p><strong>Did:</strong> {entry.did}</p>}
                                {entry.noticed && <p><strong>Noticed:</strong> {entry.noticed}</p>}
                                {entry.tryDiff && <p><strong>Try:</strong> {entry.tryDiff}</p>}
                                {entry.identity && (
                                    <p className="italic font-medium text-gray-800 pt-2 border-t border-gray-200 mt-3 flex items-start gap-2">
                                        <User size={14} className="flex-shrink-0 mt-0.5" style={{ color: COLORS.TEAL }}/>
                                        <span>"I'm the kind of leader who {entry.identity}"</span>
                                    </p>
                                )}
                                {/* Display simple date if timestamp is missing/invalid */}
                                {!entry.timestamp && entry.date && <p className="text-xs text-gray-400 mt-2">Logged on: {entry.date}</p>}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReflectionLogScreen;