// src/components/screens/BusinessReadings.jsx (FIXED: submitAiHandler ReferenceError)

import React, { useState, useMemo, useEffect, useCallback } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

import ConfigError from '../../components/system/ConfigError.jsx';

// --- Icons ---
import {
  BookOpen, Target, CheckCircle, Clock, AlertTriangle, MessageSquare, Filter, TrendingUp,
  Star, Search as SearchIcon, Cpu, Zap, Info, Check, Loader, Save, ArrowLeft
} from 'lucide-react';
import { CORPORATE_COLORS } from '../../styles/corporate-colors.js';
import { DIMENSION_TO_TIER_MAP } from '../../data/LeadershipTiers.js';

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = CORPORATE_COLORS;

// --- Standardized UI Components (Matches Dashboard/Dev Plan) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use exact Button definition from Dashboard.jsx ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[${COLORS.SUBTLE_TEAL}] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:opacity-90 focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.LIGHT_GRAY}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-[${COLORS.LIGHT_GRAY}] text-[${COLORS.NAVY}] border border-[${COLORS.SUBTLE_TEAL}] shadow-sm hover:opacity-90 focus:ring-[${COLORS.TEAL}]/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-[${COLORS.MUTED_TEXT}] hover:bg-[${COLORS.LIGHT_GRAY}] focus:ring-[${COLORS.TEAL}]/50 px-3 py-1.5 text-sm`;
    if (disabled) baseStyle += ` bg-[${COLORS.LIGHT_GRAY}] text-[${COLORS.MUTED_TEXT}] shadow-inner border-transparent opacity-50 hover:bg-[${COLORS.LIGHT_GRAY}]`;
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};
const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => { /* ... Re-use exact Card definition from Dashboard.jsx ... */
    const interactive = !!onClick; const Tag = interactive ? 'button' : 'div'; const accentColor = COLORS[accent] || COLORS.NAVY; const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };
    return (
        <Tag {...(interactive ? { type: 'button' } : {})} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} onKeyDown={handleKeyDown} className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`} style={{ background: `linear-gradient(180deg,${COLORS.CARD_BG}, ${COLORS.LIGHT_GRAY})`, borderColor: COLORS.SUBTLE_BORDER, color: COLORS.PRIMARY_TEXT }} onClick={onClick}>
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
            {Icon && title && ( <div className="flex items-center gap-3 mb-4"> <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: accentColor }} /> </div> <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2> </div> )}
            {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>}
            <div className={Icon || title ? '' : ''}>{children}</div>
        </Tag>
    );
};
const LoadingSpinner = ({ message = "Loading..." }) => ( /* ... Re-use definition from DevelopmentPlan.jsx ... */
    <div className="min-h-[300px] flex items-center justify-center" style={{ background: COLORS.BG }}> <div className="flex flex-col items-center"> <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} /> <p className="font-semibold" style={{ color: COLORS.NAVY }}>{message}</p> </div> </div>
);

// --- Complexity Mapping (Could be loaded from global metadata) ---
const COMPLEXITY_MAP = {
  Low:    { label: 'Foundational', hex: COLORS.GREEN, icon: CheckCircle },
  Medium: { label: 'Intermediate', hex: COLORS.AMBER, icon: AlertTriangle },
  High:   { label: 'Advanced',     hex: COLORS.RED,   icon: Target },
};


/* =========================================================
   DATA & UTILITIES
========================================================= */

// --- Fallback Book Data (Used only if READING_CATALOG fails to load) ---
const MOCK_ALL_BOOKS_FALLBACK = { // cite: Original File
    'Strategy & Execution': [ { id: 's_e_1_fb', title: 'The E-Myth Revisited (Fallback)', author: 'Michael E. Gerber', theme: 'Why most small businesses fail.', complexity: 'Medium', duration: 180, focus: 'Delegation, Process Mapping, Systemization', executiveBriefHTML: '<p>Mock Brief: Focus on systems.</p>', fullFlyerHTML: '<h2>Mock Flyer: The E-Myth</h2><p>Build systems like a franchise...</p>' } ],
    'People & Culture': [ { id: 'p_c_1_fb', title: 'Dare to Lead (Fallback)', author: 'Brené Brown', theme: 'Courageous leadership via vulnerability.', complexity: 'Medium', duration: 210, focus: 'Psychological Safety, Feedback, Vulnerability', executiveBriefHTML: '<p>Mock Brief: Embrace vulnerability.</p>', fullFlyerHTML: '<h2>Mock Flyer: Dare to Lead</h2><p>Vulnerability is strength...</p>' } ],
    // Add more fallback categories/books if needed
};

// --- Utility Functions (Local or potentially from a shared utils file) ---

/**
 * Derives estimated reading duration in minutes from page count if duration isn't provided.
 * Assumes ~1.5 pages per minute reading speed.
 * @param {object} book - The book object.
 * @returns {number|null} Estimated duration in minutes or null.
 */
function getDerivedDuration(book) {
  if (typeof book?.duration === 'number') return book.duration;
  if (typeof book?.pages === 'number') return Math.round(book.pages / 1.5);
  return null; // Return null if neither is available
}

/**
 * Generates a deep signature string based on the structure and count of books.
 * Used as a dependency for memoization to detect changes in the book data.
 * @param {object} booksObject - The object containing book categories and arrays.
 * @returns {string} A signature string.
 */
function getDeepDataSignature(booksObject) {
    if (!booksObject || typeof booksObject !== 'object') return 'empty';
    try {
        // Sort keys for consistency, count total items
        const keys = Object.keys(booksObject).sort().join(',');
        const count = Object.values(booksObject).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        return `${keys}-${count}`;
    } catch {
        return 'error-signature'; // Fallback signature on error
    }
}

// --- Action Steps & Frameworks (Local Fallbacks - Ideally load with book data) ---
// These provide placeholder content if the book data doesn't include structured actions/frameworks.
function getActionSteps() { /* ... same as original ... */ return ['Define the outcome, then design the smallest repeatable action.']; }
function getFrameworks() { /* ... same as original ... */ return [{ name: 'Core Principles', desc: 'Prioritize outcomes, feedback loops, and small, testable steps.' }]; }

// --- Error HTML Generator (Used when pre-generated flyer HTML is missing) ---
const API_ERROR_HTML = (executive, book) => { /* ... same as original ... */
    const errorTitle = executive ? "EXECUTIVE BRIEFING UNAVAILABLE" : "FULL FLYER UNAVAILABLE";
    // Simplified error message focusing on missing pre-generated content
    const baseContent = `
       <p style="color:${COLORS.RED}; font-size: 16px; margin-top: 15px; line-height: 1.6;">
         <strong>Content Error:</strong> The pre-generated ${executive ? 'Executive Brief' : 'Full Flyer'} content for this book ('${book.title}') is missing from the catalog data.
       </p>
       <h3 style="color:${COLORS.NAVY}; font-weight:800; font-size: 18px; margin-top:20px;">Static Summary (for Reference)</h3>
       <p style="color:#374151; font-size: 14px; margin-top: 5px;">
         Theme: ${book.theme || 'N/A'}. Key Focus Areas: ${book.focus || 'N/A'}.
       </p>
       <p style="color:#374151; font-size: 14px; margin-top: 5px;">
         Est. Duration: ${book.duration || getDerivedDuration(book) || 'N/A'} min. Complexity: ${book.complexity || 'N/A'}.
       </p>
       <h3 style="color:${COLORS.NAVY}; font-weight:800; font-size: 18px; margin-top:20px;">Next Steps</h3>
       <ul style="list-style:disc;margin-left:20px;color:#374151;font-size:14px;">
          <li>Notify the administrator that content is missing for book ID: ${book.id || 'Unknown'}.</li>
          <li>You can still add this reading as a Daily Practice Rep.</li>
       </ul>`;
    return `<div style="padding: 16px;"><h2 style="color:${COLORS.NAVY}; font-weight:900; font-size: 22px; border-bottom: 2px solid ${COLORS.RED}; padding-bottom: 8px;">${errorTitle}</h2>${baseContent}</div>`;
};


/* =========================================================
   AI COACHING LOGIC (Using Context Services)
========================================================= */

/**
 * Calculates a simple quality score for the user's AI query.
 * @param {string} query - The user's input question.
 * @param {string} bookTitle - The title of the selected book.
 * @returns {object} - { score: 0-3, tip: string }.
 */
const getQuestionScore = (query, bookTitle) => { /* ... same logic as original ... */
    const q = (query || '').toLowerCase().trim(); // Add safety check for query
    if (q.length < 15) return { score: 0, tip: 'Question is too short. Be specific about your challenge.' };
    let score = 1; // Default score if length > 15
    let feedback = 'Try relating this book to a specific work challenge or asking "How do I apply...?"';
    const applicationKeywords = ['how do i', 'apply', 'implement', 'first step', 'next step', 'my team', 'colleague', 'delegate', 'situation'];
    const hasApplication = applicationKeywords.some(keyword => q.includes(keyword));
    const hasContext = q.length > 50;
    if (hasApplication && hasContext) { score = 3; feedback = `Excellent query! Applying ${bookTitle} insights.`; }
    else if (hasApplication || hasContext) { score = 2; feedback = hasApplication ? 'Good start. Add more context about your situation.' : 'Great context. Now phrase it as an actionable "how-to" question.'; }
    return { score, tip: feedback };
};

/**
 * Handles submitting the user's query to the AI Rep Coach via useAppServices.
 * @param {Event} e - Form submit event.
 * @param {object} services - The app services context object.
 * @param {object} selectedBook - The currently selected book.
 * @param {string} aiQuery - The user's input query.
 * @param {function} setIsSubmitting - State setter for loading state.
 * @param {function} setAiResponse - State setter for AI response text.
 */
async function handleAiSubmit(e, services, selectedBook, aiQuery, setIsSubmitting, setAiResponse) {
  e.preventDefault();
  const q = (aiQuery || '').trim();
  if (!selectedBook || !q || !services || typeof services.callSecureGeminiAPI !== 'function') return;

  console.log("[handleAiSubmit] Submitting query for book:", selectedBook.title);
  setIsSubmitting(true);
  setAiResponse('The AI Rep Coach is analyzing the book and your question...'); // Updated name

  // Check if API call is possible
  const hasKeyOk = typeof services.hasGeminiKey === 'function' ? services.hasGeminiKey() : false; // cite: useAppServices.jsx
  if (!hasKeyOk) {
    console.warn("[handleAiSubmit] Gemini API key/config missing.");
    setAiResponse('**AI Rep Coach Offline:** API configuration is missing. Please contact support.');
    setIsSubmitting(false);
    return;
  }

  try {
    // --- Prepare context for the AI ---
    // Extract frameworks and action steps (use fallbacks if needed)
    const frameworks = getFrameworks(selectedBook).map(f => f.name).join(', ') || 'Core principles';
    const actions = getActionSteps(selectedBook).slice(0, 3).join(' | ') || 'Define outcome, take small steps'; // Take first 3 actions

    // Construct the prompt with clear instructions and context
    const systemPrompt = `You are the LeaderReps AI Rep Coach. Your goal is to help the user apply principles from a specific book to their leadership challenges.
      Use ONLY the provided book context. Do not use external knowledge.
      Keep responses concise (3-5 sentences), actionable, and directly answer the user's question.
      Reference the book's frameworks or themes when relevant. Suggest ONE concrete next step.
      Do not use markdown formatting other than **bold** for emphasis.

      **Book Context:**
      Title: ${selectedBook.title} by ${selectedBook.author}
      Theme: ${selectedBook.theme || 'N/A'}
      Key Focus Areas: ${selectedBook.focus || 'N/A'}
      Key Frameworks: ${frameworks}
      Example Actions: ${actions}

      **User's Question:** ${q}`;

    // --- Make the API Call ---
    const payload = {
        // Use user role for the direct question
        contents: [{ role: 'user', parts: [{ text: `Regarding "${selectedBook.title}": ${q}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        // Use the model defined in services, potentially defaulting to flash
        model: services.GEMINI_MODEL || 'gemini-1.5-flash', // cite: useAppServices.jsx
        generationConfig: { temperature: 0.6, maxOutputTokens: 150 } // Adjust config as needed
    };

    const result = await services.callSecureGeminiAPI(payload); // cite: useAppServices.jsx
    console.log("[handleAiSubmit] API Response:", result);

    // --- Process the Response ---
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text
      || 'No response received from the AI Rep Coach. Please try rephrasing your question or check the connection.';

    setAiResponse(text.trim()); // Set the cleaned response

  } catch (err) {
    console.error('[handleAiSubmit] AI coach call failed:', err);
    setAiResponse(`**Error:** The AI Rep Coach encountered a problem. Please try again. (${err.message})`);
  } finally {
    setIsSubmitting(false); // Reset loading state
  }
}

/* =========================================================
   CHILD COMPONENTS (Refactored for Consistency)
========================================================= */

// --- Search Input Component (Memoized) ---
const SearchInput = React.memo(({ value, onChange }) => { // cite: Original File (Structure)
    return (
        <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1.5" style={{ color: COLORS.MUTED }}>
                <SearchIcon className="w-4 h-4" style={{ color: COLORS.TEAL }}/> Search Library
            </label>
            <input
                type="search" // Use type="search" for better semantics
                value={value}
                onChange={onChange}
                placeholder="Find by title, author, or focus..."
                className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[${COLORS.TEAL}] text-sm" // Consistent input style
                style={{ borderColor: COLORS.SUBTLE }}
            />
        </div>
    );
});
SearchInput.displayName = 'SearchInput'; // For React DevTools

// --- AI Coach Input Component (Memoized) ---
const AICoachInput = React.memo(({ aiQuery, handleAiQueryChange, submitHandler, isSubmitting, questionFeedback, selectedBookTitle }) => { // cite: Original File (Structure)

    // Determine feedback style based on score
    const score = questionFeedback?.score ?? 0;
    const { bgColor, borderColor, textColor, Icon } = useMemo(() => {
        if (score === 3) return { bgColor: '#D1FAE5', borderColor: '#34D399', textColor: '#065F46', Icon: Zap }; // Green
        if (score === 2) return { bgColor: '#FEF3C7', borderColor: '#FBBF24', textColor: '#B45309', Icon: AlertTriangle }; // Yellow
        return { bgColor: '#FEE2E2', borderColor: '#F87171', textColor: '#991B1B', Icon: Info }; // Red/Default
    }, [score]);

    return (
        <form onSubmit={submitHandler} className="flex flex-col gap-3"> {/* Use gap */}
            {/* Live Query Quality Feedback Bar */}
            {aiQuery.trim().length > 5 && ( // Show only if query has some content
                <div className="p-2 rounded-lg text-xs flex items-center gap-2 transition-all duration-300 shadow-inner" // Smaller text
                        style={{ background: bgColor, border: `1px solid ${borderColor}`, color: textColor }}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold">Query Quality ({score}/3):</span>
                    <span className="flex-1">{questionFeedback?.tip || ''}</span>
                </div>
            )}

            {/* Input and Submit Button */}
            <div className="flex gap-2">
                <input
                    type="text" value={aiQuery} onChange={handleAiQueryChange}
                    // Contextual placeholder using selected book title
                    placeholder={`Ask AI Rep Coach how to apply "${selectedBookTitle}"...`} // cite: User Request
                    className="flex-grow p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[${COLORS.PURPLE}]" // Use Purple focus
                    style={{ borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
                    required disabled={isSubmitting} // Disable input while submitting
                />
                <Button
                    type="submit" variant="primary" size="md" // Use standard Button
                    style={{ background: COLORS.PURPLE, focusRingColor: `${COLORS.PURPLE}/50` }} // Custom purple
                    disabled={!aiQuery.trim() || isSubmitting}
                    aria-busy={isSubmitting} // Accessibility attribute
                >
                    <MessageSquare className="w-5 h-5" />
                    {isSubmitting ? 'Thinking…' : 'Ask Coach'}
                </Button>
            </div>
        </form>
    );
});
AICoachInput.displayName = 'AICoachInput'; // For React DevTools


/**
 * BookListStable Component
 * Displays the filter controls and the categorized list of books.
 * Uses standardized Card component for filter section.
 */
function BookListStable({
  filters, filteredBooks, savedBooks, selectedBook,
  onSelectBook, onToggleSave, handleSearchChange, handleFilterChange,
}) {
    // --- Determine Loading/Empty States ---
    const totalBookCount = useMemo(() => {
        // Safely count books, handling null/undefined filteredBooks
        return Object.values(filteredBooks || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    }, [filteredBooks]);

    // Check if filters are active and resulted in no books
    const hasActiveFilters = filters.search || filters.complexity !== 'All' || filters.maxDuration !== 300;
    const isFilteredEmpty = totalBookCount === 0 && hasActiveFilters;
    // Check if the source data itself is empty (no filters applied, still zero books)
    const isSourceDataEmpty = totalBookCount === 0 && !hasActiveFilters;

  return (
    <div className="space-y-8"> {/* Increased spacing */}
      {/* --- Filter Section --- */}
      {/* Encapsulate filters within a Card for consistent styling */}
      <Card title="Personalize Your Library" icon={Filter} accent="TEAL">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Search Input */}
          <SearchInput value={filters.search} onChange={handleSearchChange} />
          {/* Complexity Filter */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.MUTED }}>Complexity Level</label>
            <select
              value={filters.complexity}
              onChange={(e) => handleFilterChange('complexity', e.target.value)}
              className="w-full p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[${COLORS.TEAL}] text-sm" // Consistent select style
              style={{ borderColor: COLORS.SUBTLE }}
            >
              <option value="All">All Levels</option>
              {Object.keys(COMPLEXITY_MAP).map(k => (<option key={k} value={k}>{COMPLEXITY_MAP[k].label}</option>))}
            </select>
          </div>
          {/* Duration Filter */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.MUTED }}>Max Est. Time ({filters.maxDuration} min)</label>
            <input
              type="range" min="60" max="300" step="10" // Adjusted min duration
              value={filters.maxDuration}
              onChange={(e) => handleFilterChange('maxDuration', parseInt(e.target.value, 10))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-[#E04E1B]" // Use ORANGE accent for slider
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: COLORS.MUTED }}><span>60 min</span><span>300 min</span></div>
          </div>
        </div>
      </Card>

      {/* --- Loading / Empty State Messages --- */}
      {/* Case 1: Source data is completely empty */}
      {isSourceDataEmpty && (
           <div className="p-10 rounded-2xl border-2 shadow-xl bg-white text-center" style={{ borderColor: COLORS.SUBTLE }}>
                <AlertTriangle className='w-10 h-10 mx-auto mb-4' style={{ color: COLORS.ORANGE }}/>
                <h3 className="text-xl font-bold" style={{ color: COLORS.NAVY }}>Reading Library Empty</h3>
                <p className="text-gray-600 mt-2 text-sm">The reading catalog hasn't been loaded yet. Please contact an administrator or check the data source (<code>metadata/reading_catalog</code>).</p>
           </div>
      )}
      {/* Case 2: Filters applied, but no results found */}
      {isFilteredEmpty && (
           <div className="p-8 rounded-2xl border-2 shadow-xl bg-white text-center" style={{ borderColor: COLORS.SUBTLE }}>
                <SearchIcon className='w-8 h-8 mx-auto mb-3' style={{ color: COLORS.TEAL }}/>
                <h3 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>No Results Found</h3>
                <p className="text-gray-600 mt-1 text-sm">Try adjusting your search query or filter settings.</p>
           </div>
      )}

      {/* --- Book List Rendering --- */}
      {/* Render categories and books only if data exists and is not filtered empty */}
      {totalBookCount > 0 && !isFilteredEmpty && (
        <div className="space-y-12">
          {/* Iterate over filtered book categories */}
          {Object.entries(filteredBooks)
                // Optional: Sort categories if needed
                // .sort(([tierA], [tierB]) => tierA.localeCompare(tierB))
                .map(([tier, booksInCategory]) => (
                    // Ensure booksInCategory is an array before mapping
                    Array.isArray(booksInCategory) && booksInCategory.length > 0 && (
                        <div key={tier}
                             className="rounded-2xl shadow-xl overflow-hidden border-2"
                             style={{ background: COLORS.OFF_WHITE, borderColor: COLORS.SUBTLE }}>
                          {/* Category Header - MODIFIED FOR CONSISTENCY */}
                          <div className="p-4 border-b" style={{ background: COLORS.LIGHT_GRAY, borderColor: COLORS.SUBTLE }}>
                            <h3 className="text-lg font-extrabold flex items-center gap-2" style={{ color: COLORS.NAVY }}>
                                <Target className="w-5 h-5" style={{ color: COLORS.ORANGE }} />
                                {tier}
                            </h3>
                            <p className="text-sm mt-1" style={{ color: COLORS.MUTED }}>{booksInCategory.length} item{booksInCategory.length !== 1 ? 's' : ''} available</p>
                          </div>

                          {/* Book Grid within Category */}
                          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {booksInCategory.map((book) => {
                              // Get complexity details
                              const complexityMeta = COMPLEXITY_MAP[book.complexity] || COMPLEXITY_MAP.Medium; // Fallback
                              const ComplexityIcon = complexityMeta.icon;
                              const isSaved = !!savedBooks[book.id];
                              const isSelected = selectedBook?.id === book.id;
                              const estimatedDuration = book.duration || getDerivedDuration(book); // Get duration

                              return (
                                // --- Book Card ---
                                <div key={book.id} className="relative h-full"> {/* Ensure relative positioning for Save button, full height */}
                                  <button
                                    onClick={() => onSelectBook(book, tier)} // Pass book and tier
                                    className="p-5 text-left w-full h-full block rounded-2xl border-2 transition-all duration-300 flex flex-col focus:outline-none focus:ring-2 focus:ring-offset-1" // Added flex-col
                                    style={{
                                      background: 'linear-gradient(180deg,#FFFFFF,#F9FAFB)',
                                      borderColor: isSelected ? COLORS.TEAL : COLORS.SUBTLE,
                                      boxShadow: isSelected ? '0 8px 20px rgba(71,168,141,.2)' : '0 2px 8px rgba(0,0,0,.06)', // Refined shadow
                                      color: COLORS.TEXT,
                                      position: 'relative', // Needed for accent bar
                                      focusRingColor: COLORS.TEAL,
                                    }}
                                  >
                                    {/* Accent Bar */}
                                    <span style={{ position:'absolute',top:0,left:0,right:0,height:6, background: isSelected ? COLORS.TEAL : COLORS.ORANGE, borderTopLeftRadius:14, borderTopRightRadius:14 }} />

                                    {/* Book Info */}
                                    <div className="flex-grow pt-2"> {/* Added flex-grow */}
                                        <div className="flex gap-3 items-start mb-3">
                                            {/* Icon */}
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}>
                                                <BookOpen className="w-5 h-5" style={{ color: COLORS.TEAL }} />
                                            </div>
                                            {/* Title & Author */}
                                            <div className="min-w-0">
                                                <p className="font-extrabold text-md leading-tight" style={{ color: COLORS.NAVY }}>{book.title}</p> {/* Slightly smaller */}
                                                <p className="text-xs italic mt-0.5" style={{ color: COLORS.MUTED }}>by {book.author}</p>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="my-3" style={{ height: 1, background: COLORS.SUBTLE }} />

                                        {/* Stats: Duration & Complexity */}
                                        <div className="space-y-1.5 text-xs"> {/* Smaller text */}
                                            <div className="flex items-center gap-2" style={{ color: COLORS.TEXT }}>
                                                <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: COLORS.ORANGE }}/>
                                                <span className="font-semibold">Est. Time:</span>
                                                <span className="ml-auto font-bold">{estimatedDuration ? `${estimatedDuration} min` : 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2" style={{ color: COLORS.TEXT }}>
                                                <ComplexityIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: complexityMeta.hex }}/>
                                                <span className="font-semibold">Level:</span>
                                                <span className="ml-auto font-bold" style={{ color: complexityMeta.hex }}>{complexityMeta.label}</span>
                                            </div>
                                        </div>

                                        {/* Key Focus Tags */}
                                        <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                                            <p className="text-[10px] font-semibold uppercase mb-1.5" style={{ color: COLORS.TEAL }}>Key Focus</p>
                                            <div className="flex flex-wrap gap-1">
                                                {(String(book.focus || '').split(',').slice(0, 3)).map((f, i) => ( // Safe split and slice
                                                    f.trim() && <span key={i} className="px-2 py-0.5 text-[10px] font-medium rounded-full" style={{ background: COLORS.SUBTLE, color: COLORS.MUTED }}>{f.trim()}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                  </button>

                                  {/* Save Button (Overlay) */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onToggleSave(book.id); }}
                                    aria-label={isSaved ? 'Remove from Saved' : 'Save for Later'}
                                    className="absolute top-2 right-2 p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500" // Adjusted focus ring
                                    style={{ background: isSaved ? COLORS.AMBER : 'rgba(255,255,255,0.8)', color: isSaved ? COLORS.OFF_WHITE : COLORS.MUTED, boxShadow: '0 1px 3px rgba(0,0,0,.1)' }}
                                  >
                                    <Star className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                    )
                )
            )}
        </div>
      )}
    </div>
  );
}


/**
 * BookFlyerStable Component
 * Displays the detailed flyer content (HTML) for the selected book,
 * including the AI Coach interaction section and action buttons.
 */
function BookFlyerStable({
  selectedBook, htmlFlyer, isFlyerLoading, isExecutiveBrief, setIsExecutiveBrief,
  questionFeedback, aiResponse, aiQuery, handleAiQueryChange, submitHandler,
  savedBooks, onToggleSave, onCommit, isCommitted, isSubmitting,
}) {
  // --- Calculate Mock Progress (Replace with real data if available) ---
  const progressMinutes = 45; // Placeholder
  const totalDuration = selectedBook.duration || getDerivedDuration(selectedBook) || 180; // Estimate if missing
  const progressPercent = Math.min(100, Math.round((progressMinutes / totalDuration) * 100));

  // --- Executive Brief Toggle Switch ---
  // Using a button-based switch for simpler styling alignment
  const ExecSwitch = ({ checked, onChange }) => (
    <div className="flex items-center gap-2">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[${COLORS.ORANGE}]`}
        style={{ background: checked ? COLORS.ORANGE : COLORS.MUTED }}
      >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
      <span className="text-sm font-semibold" style={{ color: COLORS.NAVY }}>Executive Brief</span>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* --- Flyer Header --- */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b" style={{ borderColor: COLORS.SUBTLE }}>
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3" style={{ color: COLORS.NAVY }}>
          <BookOpen className="w-7 h-7 flex-shrink-0" style={{ color: COLORS.TEAL }} />
          Focus Flyer: {selectedBook.title}
        </h2>
        {/* Back Button */}
        <Button
          onClick={() => window.dispatchEvent(new CustomEvent('lr-close-flyer'))} // Use custom event to signal close
          variant="nav-back" size="sm" // Use nav-back style
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
        </Button>
      </div>

      {/* --- Main Flyer Content Card --- */}
      <Card accent="TEAL" className="shadow-2xl"> {/* Use standard Card */}
        {/* Top Controls: Progress & Exec Brief Toggle */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          {/* Mock Progress Indicator */}
          <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: COLORS.LIGHT_GRAY, borderColor: COLORS.SUBTLE }}>
            <TrendingUp className="w-5 h-5 flex-shrink-0" style={{ color: COLORS.TEAL }}/>
            <div>
              <p className="text-xs font-medium uppercase" style={{ color: COLORS.MUTED }}>Your Progress (Mock)</p>
              <div className="flex items-center gap-2 mt-1">
                {/* Progress Bar */}
                <div className="w-32 h-2 rounded-full" style={{ background: COLORS.SUBTLE }}>
                  <div className="h-2 rounded-full" style={{ width: `${progressPercent}%`, background: COLORS.TEAL }} />
                </div>
                <span className="text-sm font-bold" style={{ color: COLORS.NAVY }}>{progressPercent}%</span>
              </div>
            </div>
          </div>
          {/* Executive Brief Toggle */}
          <div className="flex items-center">
            <ExecSwitch checked={isExecutiveBrief} onChange={setIsExecutiveBrief} />
          </div>
        </div>

        {/* --- HTML Flyer Content Area --- */}
        <div className="p-4 rounded-xl border min-h-[200px]" style={{ background: COLORS.OFF_WHITE, borderColor: COLORS.SUBTLE }}>
            {/* Loading State */}
            {isFlyerLoading && (
                <div className="h-full flex items-center justify-center gap-2" style={{ color: COLORS.PURPLE }}>
                    <Loader className='w-5 h-5 animate-spin'/>
                    <span className="font-semibold text-sm">Loading Flyer Content...</span>
                </div>
            )}
            {/* Error State (Content Missing) */}
            {!isFlyerLoading && htmlFlyer.includes('Content Error:') && (
                <div className="h-full flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
                    <AlertTriangle className='w-6 h-6 text-red-500 mb-2'/>
                    <div className="text-sm text-center max-w-none space-y-2" style={{ color: COLORS.TEXT }} dangerouslySetInnerHTML={{ __html: htmlFlyer }} />
                </div>
            )}
            {/* Success State: Render HTML */}
            {!isFlyerLoading && !htmlFlyer.includes('Content Error:') && (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: htmlFlyer }} />
            )}
        </div>

        {/* --- AI Coach Section --- */}
        <div className="mt-8 pt-6 border-t" style={{ borderColor: COLORS.SUBTLE }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-3" style={{ color: COLORS.NAVY }}>
            <MessageSquare className="w-6 h-6" style={{ color: COLORS.PURPLE }}/> AI Rep Coach: Apply It Now
          </h3>
          {/* AI Response Area */}
          {aiResponse && (
            <div className="p-4 mb-4 rounded-xl shadow-lg border-l-4" style={{ background: '#F0F5FF', borderLeftColor: COLORS.PURPLE, color: COLORS.TEXT }}>
              <p className="text-sm font-semibold flex items-center gap-2 mb-1" style={{ color: COLORS.NAVY }}>
                <Cpu className="w-4 h-4"/> AI Rep Coach Response:
              </p>
              {/* Use pre-wrap to preserve line breaks from AI */}
              <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
            </div>
          )}
          {/* AI Input Form */}
          <AICoachInput
            aiQuery={aiQuery}
            handleAiQueryChange={handleAiQueryChange}
            submitHandler={submitHandler} // FIX: Now correctly passed as a prop
            isSubmitting={isSubmitting} // FIX: Now correctly passed as a prop
            questionFeedback={questionFeedback}
            selectedBookTitle={selectedBook.title} // Pass title for placeholder
          />
        </div>

        {/* --- Action Buttons Footer --- */}
        <div className="mt-10 pt-6 flex flex-col sm:flex-row justify-end items-center gap-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
          {/* Save for Later Button */}
          <Button
            onClick={() => onToggleSave(selectedBook.id)}
            variant="outline" size="sm" // Use outline, small size
            className="w-full sm:w-auto"
            style={{ borderColor: savedBooks[selectedBook.id] ? COLORS.AMBER : COLORS.SUBTLE, color: savedBooks[selectedBook.id] ? COLORS.AMBER : COLORS.MUTED }} // Dynamic style
          >
            <Star className="w-4 h-4" fill={savedBooks[selectedBook.id] ? 'currentColor' : 'none'}/>
            {savedBooks[selectedBook.id] ? 'Saved' : 'Save for Later'}
          </Button>
          {/* Add to Daily Practice Button */}
          <Button
            onClick={onCommit}
            variant={isCommitted ? 'primary' : 'secondary'} // Use secondary (Orange) if not committed
            size="md" // Use medium size
            className="w-full sm:w-auto" // Full width on small screens
            disabled={isCommitted} // Disable after committing
            style={{ background: isCommitted ? COLORS.GREEN : COLORS.ORANGE, // Dynamic background
                     boxShadow: `0 6px 18px ${isCommitted ? COLORS.GREEN : COLORS.ORANGE}40` }} // Dynamic shadow
          >
            {isCommitted ? <Check className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            {isCommitted ? 'Added to Practice!' : 'Add to Daily Practice'}
          </Button>
        </div>
      </Card>
    </div>
  );
}


/* =========================================================
   MAIN SCREEN COMPONENT: BusinessReadingsScreen
========================================================= */

export default function BusinessReadingsScreen() {
  // --- Consume Core Services ---
  const {
    // Data & State
    isLoading: isAppLoading, error: appError, // Combined loading/error state
    READING_CATALOG, // Catalog data { items: { Category: [books...] } } // cite: useAppServices.jsx
    dailyPracticeData, // For adding commitments // cite: useAppServices.jsx
    // Functions
    updateDailyPracticeData, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, // cite: useAppServices.jsx
  } = useAppServices();

  // --- Local State ---
  const [selectedBook, setSelectedBook] = useState(null); // The book object currently viewed in the flyer
  const [selectedTier, setSelectedTier] = useState(''); // The category/tier of the selected book
  const [htmlFlyer, setHtmlFlyer] = useState(''); // Pre-generated HTML content for the flyer
  const [isFlyerLoading, setIsFlyerLoading] = useState(false); // Brief loading state for flyer transition
  const [savedBooks, setSavedBooks] = useState({}); // Local state for 'saved for later' status { bookId: true/false }
  const [isExecutiveBrief, setIsExecutiveBrief] = useState(false); // Flyer view mode (full vs. brief)
  const [isCommitted, setIsCommitted] = useState(false); // Has the current book been added to daily practice?
  // Filters
  const [filters, setFilters] = useState({ complexity: 'All', maxDuration: 300, search: '' });
  // AI Coach State
  const [aiQuery, setAiQuery, ] = useState(''); // User's input question
  const [aiResponse, setAiResponse] = useState(''); // AI's response text
  const [isSubmittingAi, setIsSubmittingAi] = useState(false); // Loading state for AI query

  // --- Determine Book Data Source ---
  // Use READING_CATALOG from services if valid, otherwise use local fallback
  const allBooks = useMemo(() => {
    const catalogItems = READING_CATALOG?.items;
    // Validate structure: must be an object with at least one key/value pair where value is array
    if (catalogItems && typeof catalogItems === 'object' && Object.keys(catalogItems).length > 0 && Object.values(catalogItems).some(Array.isArray)) {
        console.log("[BusinessReadings] Using READING_CATALOG from services.");
        return catalogItems;
    } else {
        console.warn("[BusinessReadings] READING_CATALOG invalid or empty. Using fallback data.", READING_CATALOG);
        return MOCK_ALL_BOOKS_FALLBACK;
    }
  }, [READING_CATALOG]); // cite: useAppServices.jsx

  // --- Deep Dependency Signature ---
  // Used to ensure filtering memoization updates correctly when book data changes fundamentally
  const deepDataSignature = useMemo(() => getDeepDataSignature(allBooks), [allBooks]);

  /* ---------- Filtering Logic (Memoized) ---------- */
  const filteredBooks = useMemo(() => {
    console.log("[BusinessReadings] Re-calculating filtered books. Signature:", deepDataSignature);
    // Safety check for allBooks structure
    if (!allBooks || typeof allBooks !== 'object') return {};

    const searchTerm = (filters.search || '').toLowerCase();
    const maxDuration = filters.maxDuration;
    const complexityFilter = filters.complexity;

    // Filter and group books
    const result = {};
    for (const tier in allBooks) {
        if (Array.isArray(allBooks[tier])) { // Ensure the category contains an array
            const booksInCategory = allBooks[tier].filter(book => {
                // Duration Check (handles missing duration)
                const duration = book.duration || getDerivedDuration(book);
                const durationOK = duration === null || duration <= maxDuration;
                // Complexity Check
                const complexityOK = complexityFilter === 'All' || book.complexity === complexityFilter;
                // Search Term Check (check title, author, focus)
                const searchOK = !searchTerm ||
                    (book.title || '').toLowerCase().includes(searchTerm) ||
                    (book.author || '').toLowerCase().includes(searchTerm) ||
                    (String(book.focus || '')).toLowerCase().includes(searchTerm); // Safe focus check
                // Combine checks
                return durationOK && complexityOK && searchOK;
            });
            // Only add tier to result if it has books after filtering
            if (booksInCategory.length > 0) {
                result[tier] = booksInCategory;
            }
        }
    }
    console.log("[BusinessReadings] Filtering complete. Result keys:", Object.keys(result));
    return result;
  }, [allBooks, filters, deepDataSignature]); // Dependencies: Trigger re-filter on data, filters, or signature change


  /* ---------- Flyer Content Loading ---------- */
  // Loads the appropriate pre-generated HTML when a book is selected or brief mode changes
  useEffect(() => {
    if (!selectedBook) {
      setHtmlFlyer(''); // Clear flyer if no book selected
      return;
    }
    console.log(`[BusinessReadings] Loading flyer for: ${selectedBook.title}, Brief Mode: ${isExecutiveBrief}`);
    // Determine which HTML content key to use
    const contentKey = isExecutiveBrief ? 'executiveBriefHTML' : 'fullFlyerHTML';
    // Retrieve HTML from the selected book object, use error fallback if missing
    const newHtml = selectedBook[contentKey] || API_ERROR_HTML(isExecutiveBrief, selectedBook); // cite: Original File (Logic)

    // Apply a brief loading state for smooth visual transition
    setIsFlyerLoading(true);
    const timer = setTimeout(() => {
        setHtmlFlyer(newHtml);
        setIsFlyerLoading(false);
        console.log(`[BusinessReadings] Flyer content set.`);
    }, 50); // Minimal delay

    // Cleanup timer on unmount or if dependencies change
    return () => clearTimeout(timer);
  }, [selectedBook, isExecutiveBrief]); // Re-run when book or brief mode changes


  /* ---------- State Resets on Book Change ---------- */
  useEffect(() => {
    // Reset secondary states when the selected book changes
    if (selectedBook) {
      console.log(`[BusinessReadings] Resetting state for new book: ${selectedBook.title}`);
      setIsExecutiveBrief(false); // Default to full flyer view
      setAiQuery('');             // Clear AI query
      setAiResponse('');          // Clear AI response
      setIsSubmittingAi(false);    // Reset AI loading state
      // Check if this book is already an active commitment today
      const isCurrentlyCommitted = (dailyPracticeData?.activeCommitments || []).some(
          c => c.source === 'BusinessReadings' && c.id.includes(`read_${selectedBook.id}`) && c.status === 'Pending' // Check for the base ID and status
      );
      setIsCommitted(isCurrentlyCommitted);
    }
  }, [selectedBook, dailyPracticeData]); // Run only when selectedBook or dailyPracticeData changes


  /* ---------- Event Listener for Closing Flyer ---------- */
  useEffect(() => {
    // Custom event listener to allow BookFlyerStable to signal closing itself
    const handler = () => {
        console.log("[BusinessReadings] Close flyer event received.");
        setSelectedBook(null);
    };
    window.addEventListener('lr-close-flyer', handler);
    // Cleanup listener on unmount
    return () => window.removeEventListener('lr-close-flyer', handler);
  }, []); // Run only once on mount


  /* ---------- Memoized Handlers for Inputs/Actions ---------- */
  // Updates the filter state
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Updates the search filter state
  const handleSearchChange = useCallback((e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  }, []);

  // Updates the AI query input state
  const handleAiQueryChange = useCallback((e) => {
    setAiQuery(e.target.value);
  }, []);

  // Handler for selecting a book from the list
  const handleSelectBook = useCallback((book, tier) => {
      console.log(`[BusinessReadings] Book selected: ${book.title} from tier ${tier}`);
      setSelectedBook(book);
      setSelectedTier(tier || ''); // Store the tier/category name
  }, []);

  // Toggles the 'saved for later' status of a book
  const handleToggleSave = useCallback((bookId) => {
    setSavedBooks(prev => {
        const isCurrentlySaved = !!prev[bookId];
        console.log(`[BusinessReadings] Toggling save for book ${bookId}. New status: ${!isCurrentlySaved}`);
        return { ...prev, [bookId]: !isCurrentlySaved };
        // TODO: Persist savedBooks state (e.g., to localStorage or user profile in Firestore)
    });
  }, []);

  // --- Adds the selected book reading task as a Daily Practice Rep ---
  const handleCommitment = useCallback(async (book) => {
    if (!book || isCommitted) return; // Prevent adding if already committed or no book
    console.log(`[BusinessReadings] Adding commitment for book: ${book.title}`);

    // --- Create the new Rep (Commitment) object ---
    const estimatedDuration = book.duration || getDerivedDuration(book) || 0; // Get duration
    const newCommitment = {
      id: `read_${book.id}_${Date.now()}`, // Unique ID for the rep
      text: `Read: ${book.title} (${book.author}) - Est. ${estimatedDuration} min`, // Descriptive text
      status: 'Pending', // Start as pending
      isCustom: false, // Indicate it's from a standard source
      linkedGoal: selectedTier || 'Personal Development', // Link to the book category/tier
      linkedTier: book.complexity ? (DIMENSION_TO_TIER_MAP[book.complexity] || 'T1') : 'T1', // Map complexity to Tier (heuristic)
      source: 'BusinessReadings', // Identify the source
      // Add optional fields if needed: targetColleague, progressMinutes, totalDuration
    };

    // --- Update dailyPracticeData using the context function ---
    try {
        const success = await updateDailyPracticeData(currentData => {
            const existingCommitments = currentData?.activeCommitments || []; // cite: useAppServices.jsx
            // Add the new commitment to the list
            return {
                ...currentData, // Preserve existing data
                activeCommitments: [...existingCommitments, newCommitment]
            };
        }); // cite: useAppServices.jsx

        if (success) {
            console.log("[BusinessReadings] Commitment added successfully.");
            setIsCommitted(true); // Update local state to reflect commitment
            // Optional: Navigate to daily practice after a brief delay
            // setTimeout(() => navigate('daily-practice'), 1000);
        } else {
             throw new Error("updateDailyPracticeData returned false");
        }
    } catch (error) {
        console.error('[BusinessReadings] Failed to add commitment:', error);
        alert('Failed to add reading commitment to your daily practice. Please try again.');
        setIsCommitted(false); // Ensure state reflects failure
    }
  }, [isCommitted, selectedTier, updateDailyPracticeData]); // Dependencies


  // --- Memoized Question Feedback ---
  // Calculates the quality score of the AI query as the user types
  const questionFeedback = useMemo(() => {
    if (!selectedBook) return { score: 0, tip: '' }; // No score if no book selected
    return getQuestionScore(aiQuery, selectedBook.title);
  }, [aiQuery, selectedBook]);


  // --- Memoized AI Submit Handler ---
  // Wraps the handleAiSubmit logic with necessary state and context
  const submitAiHandler = useCallback((e) => {
      // Pass all required arguments to the standalone handler function
      handleAiSubmit(e, { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL }, selectedBook, aiQuery, setIsSubmittingAi, setAiResponse);
  }, [aiQuery, selectedBook, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL]); // Include all dependencies


  // --- RENDER LOGIC ---

  // Show loading spinner if the app's core data is still loading
  if (isAppLoading) {
    return <LoadingSpinner message="Loading Reading Hub..." />;
  }
  // Show error message if app loading failed
  if (appError) {
      return <ConfigError message={`Failed to load Reading Hub data: ${appError.message}`} />;
  }

  return (
    // Main screen container with consistent padding and background
    <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG }}>
      {/* Header */}
      <header className='flex items-center gap-4 border-b-2 pb-3 mb-8' style={{borderColor: COLORS.PURPLE+'30'}}> {/* Use PURPLE accent */}
          <BookOpen className='w-10 h-10 flex-shrink-0' style={{color: COLORS.PURPLE}}/>
          <div>
              <h1 className="text-3xl md:text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Professional Reading Hub</h1>
              <p className="text-md text-gray-600 mt-1">(Content Pillar 1)</p>
          </div>
      </header>

      {/* Conditional Rendering: Show Book List or Book Flyer */}
      {!selectedBook ? (
          // --- Render Book List View ---
          <BookListStable
              filters={filters}
              filteredBooks={filteredBooks}
              savedBooks={savedBooks}
              selectedBook={selectedBook} // Pass null when list is visible
              onSelectBook={handleSelectBook}
              onToggleSave={handleToggleSave}
              handleSearchChange={handleSearchChange}
              handleFilterChange={handleFilterChange}
          />
      ) : (
          // --- Render Book Flyer View ---
          <BookFlyerStable
              selectedBook={selectedBook}
              htmlFlyer={htmlFlyer}
              isFlyerLoading={isFlyerLoading}
              isExecutiveBrief={isExecutiveBrief}
              setIsExecutiveBrief={setIsExecutiveBrief}
              questionFeedback={questionFeedback}
              aiResponse={aiResponse}
              aiQuery={aiQuery}
              handleAiQueryChange={handleAiQueryChange}
              submitHandler={submitAiHandler} // FIX: Pass the memoized handler
              savedBooks={savedBooks}
              onToggleSave={handleToggleSave}
              onCommit={() => handleCommitment(selectedBook)} // Pass the selected book to handler
              isCommitted={isCommitted}
              isSubmitting={isSubmittingAi} // Pass AI loading state
          />
      )}
    </div>
  );
}