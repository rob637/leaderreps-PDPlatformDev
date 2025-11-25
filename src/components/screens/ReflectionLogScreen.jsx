// src/components/screens/ReflectionLogScreen.jsx (NEW FILE)

import React, { useState, useEffect } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Firestore Imports ---
import { collection, query, orderBy, getDocs } from 'firebase/firestore'; // cite: DailyPractice.jsx

// --- Icons ---
import { Archive, Loader, MessageSquare, ArrowLeft, User } from 'lucide-react';
import { Button, Card, LoadingSpinner } from '../ui';

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
        <div className="p-6 md:p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 lg:p-10 max-w-4xl mx-auto min-h-screen bg-slate-50">
            {/* Header */}
            {/* Back Button */}
            <Button onClick={() => navigate('dashboard')} variant="nav-back" size="sm" className="mb-6"> 
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-4 mb-6 border-slate-200">
                <h1 className="text-xl sm:text-2xl sm:text-3xl md:text-4xl font-extrabold flex items-center gap-3 text-corporate-navy">
                    <Archive className="w-8 h-8 text-corporate-teal" /> Reflection Log
                </h1>
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
                    <h2 className="text-xl font-semibold mb-2 text-corporate-navy">No Reflections Yet</h2>
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
                            <p className="text-sm font-bold mb-3 border-b pb-2 flex justify-between items-center text-corporate-navy border-slate-200">
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
                                        <User size={14} className="flex-shrink-0 mt-0.5 text-corporate-teal"/>
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