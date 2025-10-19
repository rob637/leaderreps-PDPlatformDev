/* eslint-disable no-console */
import React, { useState, useMemo, useRef } from 'react';
import { useAppServices } from '../../App.jsx';
import { 
    BookOpen, Target, CheckCircle, Clock, Feather, Aperture, Briefcase, Zap, Star, 
    AlertTriangle, CornerDownRight, MessageSquare, Filter, TrendingUp, Users, Minimize2, Send, Search 
} from 'lucide-react';
import { mdToHtml } from '../../utils/ApiHelpers.js';

// --- COLOR PALETTE ---
const COLORS = {
    NAVY: '#002E47', 
    TEAL: '#47A88D', 
    ORANGE: '#E04E1B', 
    LIGHT_GRAY: '#F8F8F5', 
    DARK_TEXT: '#1F2937', 
    OFF_WHITE: '#FFFFFF', 
};

// --- COMPLEXITY MAPPING ---
const COMPLEXITY_MAP = {
    'Low': { label: 'Novice', color: 'bg-green-500', icon: CheckCircle },
    'Medium': { label: 'Intermediate', color: 'bg-yellow-500', icon: AlertTriangle },
    'High': { label: 'Expert', color: 'bg-red-500', icon: Target },
};

// --- MOCK BOOK DATA ---
const MOCK_ALL_BOOKS = {
    'Strategy & Execution': [
        { id: 's_e_1', title: 'The E-Myth Revisited', author: 'Michael E. Gerber', theme: 'Why most small businesses fail and how to build a scalable system that works *for* you, not *because* of you.', complexity: 'Medium', duration: 180, focus: 'Delegation, Process Mapping, Systemization', cover: 'https://placehold.co/100x150/002E47/ffffff?text=E+Myth', image_url: 'https://placehold.co/600x400/002E47/ffffff?text=E-Myth+System' },
        { id: 's_e_2', title: 'Good to Great', author: 'Jim Collins', theme: 'Identifying the factors that allowed a select group of companies to make the leap from good results to truly great, enduring performance.', complexity: 'High', duration: 240, focus: 'Level 5 Leadership, Hedgehog Concept, Discipline', cover: 'https://placehold.co/100x150/47A88D/ffffff?text=Good+to+Great', image_url: 'https://placehold.co/600x400/47A88D/ffffff?text=Hedgehog+Concept' },
        { id: 's_e_3', title: 'Measure What Matters', author: 'John Doerr', theme: 'Setting and achieving ambitious goals using OKRs—a clear framework for focusing on what truly matters.', complexity: 'Medium', duration: 200, focus: 'Goal Setting, Quarterly Planning, Accountability', cover: 'https://placehold.co/100x150/E04E1B/ffffff?text=OKRs', image_url: 'https://placehold.co/600x400/E04E1B/ffffff?text=OKR+Framework' },
        { id: 's_e_4', title: 'Getting Things Done', author: 'David Allen', theme: 'The famous "stress-free productivity" method, offering actionable steps to organize your to-dos, projects, and commitments.', complexity: 'Low', duration: 150, focus: 'Task Management, Workflow Design, Capture', cover: 'https://placehold.co/100x150/002E47/ffffff?text=GTD', image_url: 'https://placehold.co/600x400/002E47/ffffff?text=Workflow+Flowchart' },
    ],
    'People & Culture': [
        { id: 'p_c_1', title: 'Dare to Lead', author: 'Brené Brown', theme: 'A research-backed guide on how to be a courageous leader by embracing vulnerability and building trust.', complexity: 'Medium', duration: 210, focus: 'Psychological Safety, Feedback, Vulnerability', cover: 'https://placehold.co/100x150/002E47/ffffff?text=Dare+to+Lead', image_url: 'https://placehold.co/600x400/002E47/ffffff?text=Vulnerability+Trust' },
        { id: 'p_c_2', title: 'The Five Dysfunctions of a Team', author: 'Patrick Lencioni', theme: 'A business fable that clearly lays out the five common pitfalls that prevent teams from functioning effectively.', complexity: 'Low', duration: 150, focus: 'Team Building, Conflict Management, Trust', cover: 'https://placehold.co/100x150/47A88D/ffffff?text=Five+Dysfunctions', image_url: 'https://placehold.co/600x400/47A88D/ffffff?text=Teamwork+Building' },
        { id: 'p_c_3', title: 'Radical Candor', author: 'Kim Scott', theme: 'A framework for giving and receiving feedback that ensures you are challenging directly while also caring personally.', complexity: 'Medium', duration: 190, focus: 'Feedback Delivery, Coaching, Guidance', cover: 'https://placehold.co/100x150/E04E1B/ffffff?text=Radical+Candor', image_url: 'https://placehold.co/600x400/E04E1B/ffffff?text=Candid+Feedback' },
    ],
    'Self-Awareness & Growth': [
        { id: 's_a_1', title: 'Atomic Habits', author: 'James Clear', theme: 'A comprehensive system for building good habits and breaking bad ones by focusing on tiny, incremental improvements.', complexity: 'Low', duration: 180, focus: 'Habit Formation, Self-Discipline, Identity', cover: 'https://placehold.co/100x150/E04E1B/ffffff?text=Atomic+Habits', image_url: 'https://placehold.co/600x400/E04E1B/ffffff?text=Habit+Loop' },
        { id: 's_a_2', title: 'Mindset', author: 'Carol Dweck', theme: 'The groundbreaking research on Fixed vs. Growth Mindsets and how adopting a growth mindset is the key to achieving success.', complexity: 'Medium', duration: 190, focus: 'Growth Mindset, Resilience, Learning', cover: 'https://placehold.co/100x150/47A88D/ffffff?text=Mindset', image_url: 'https://placehold.co/600x400/47A88D/ffffff?text=Growth+Vs+Fixed' },
        { id: 's_a_3', title: 'Essentialism', author: 'Greg McKeown', theme: 'The disciplined pursuit of less: a systematic approach to identifying what is absolutely essential and eliminating everything else.', complexity: 'Low', duration: 160, focus: 'Prioritization, Saying No, Focus', cover: 'https://placehold.co/100x150/E04E1B/ffffff?text=Essentialism', image_url: 'https://placehold.co/600x400/E04E1B/ffffff?text=Focus+Path' },
    ],
    'Innovation & Change': [
        { id: 'i_c_1', title: 'The Lean Startup', author: 'Eric Ries', theme: 'A revolutionary approach to creating successful products and businesses using continuous innovation and validated learning.', complexity: 'High', duration: 250, focus: 'MVP, Build-Measure-Learn, Iteration', cover: 'https://placehold.co/100x150/47A88D/ffffff?text=Lean+Startup', image_url: 'https://placehold.co/600x400/47A88D/ffffff?text=Startup+Iterate' },
        { id: 'i_c_2', title: 'Start With Why', author: 'Simon Sinek', theme: 'Explains the "Golden Circle" framework, showing that great, inspiring leaders communicate their purpose first.', complexity: 'Medium', duration: 180, focus: 'Golden Circle, Purpose-Driven, Inspiration', cover: 'https://placehold.co/100x150/E04E1B/ffffff?text=Start+With+Why', image_url: 'https://placehold.co/600x400/E04E1B/ffffff?text=Golden+Circle' },
    ],
};

// --- HELPER: SIMULATE AI RESPONSE (Expanded and improved logic) ---
const mockAIResponse = (bookTitle, focusAreas, query) => {
    query = query.toLowerCase();
    
    // --- E-Myth Revisited ---
    if (bookTitle.includes('E-Myth')) {
        if (query.includes('delegate') || query.includes('system') || query.includes('hand off')) {
            return `The E-Myth teaches that you must **systemize your business** to make it scalable. To delegate a task like a recurring report, document the procedure in a 5-step checklist. This converts the work from a personal skill to a replicable system, making delegation safe and repeatable.`;
        }
        if (query.includes('growth') || query.includes('scaling')) {
            return `Scaling, according to Gerber, requires thinking like the Entrepreneur, Manager, and Technician simultaneously. Focus on the **Manager** role first: establish the three most critical, documented **Process Maps** for sales, operations, and finance before hiring new staff.`;
        }
        return `Regarding the E-Myth, the primary focus is separating your roles (Entrepreneur, Manager, Technician). Your query about '${query}' suggests a need for a system. Stop performing the task and start **designing the system** that performs the task.`;
    }
    
    // --- Good to Great ---
    if (bookTitle.includes('Good to Great')) {
        if (query.includes('hedgehog') || query.includes('core')) {
            return `The Hedgehog Concept is the intersection of 1) **Passion**, 2) **Best in the World**, and 3) **Economic Engine**. If your current strategy doesn't hit all three circles, you must stop it. The actionable step is a formal, honest assessment of whether you can truly be the best in the world at '${query}'.`;
        }
        if (query.includes('leader') || query.includes('culture') || query.includes('management')) {
            return `Jim Collins stresses **Level 5 Leadership**: competence and fierce resolve mixed with personal humility. For a toxic manager, the advice is 'First Who, Then What.' You must address the **people** issue (Level 5 qualities) before attempting to fix the strategy or culture.`;
        }
        return `In the context of 'Good to Great,' the principle for '${query}' revolves around **disciplined people, disciplined thought, and disciplined action**. Start by ensuring you have the right people ('who') with Level 5 qualities before applying complex solutions.`;
    }

    // --- Radical Candor ---
    if (bookTitle.includes('Radical Candor')) {
        if (query.includes('feedback') || query.includes('difficult conversation')) {
            return `When giving feedback on a sensitive issue like '${query}', ensure you are in the **Radical Candor** quadrant: **Caring Personally** and **Challenging Directly**. Be specific, immediate, and about the behavior, not the person. Avoid 'Ruinous Empathy' (being nice but unhelpful).`;
        }
        if (query.includes('criticism') || query.includes('praise')) {
            return `Candor must flow in both directions. To encourage candid feedback on your own performance, Kim Scott advises you to **Ask for Criticism First**. This demonstrates humility and opens the door for others to speak truthfully about topics like '${query}'.`;
        }
        return `The core framework for your question on '${query}' is ensuring you demonstrate personal care. When addressing a challenge, start by reinforcing your relationship before delivering the direct challenge.`;
    }

    // --- Atomic Habits ---
    if (bookTitle.includes('Atomic Habits')) {
        if (query.includes('start') || query.includes('new habit') || query.includes('consistency')) {
            return `To start a new habit like '${query}', apply the **Four Laws**: 1. Make it Obvious (Habit Stacking), 2. Make it Attractive (Pairing), 3. Make it Easy (2-Minute Rule), and 4. Make it Satisfying (Immediate Reward). Use the 2-Minute Rule to ensure you never miss a day.`;
        }
        if (query.includes('break') || query.includes('stop')) {
            return `To break a bad habit like '${query}', invert the Four Laws: Make it Invisible, Unattractive, Difficult, and Unsatisfying. For instance, make the bad habit difficult by adding 'Friction'—if you waste time on social media, delete the apps every night.`;
        }
        return `The key to your question about '${query}' is focusing on **Identity**: stop trying to achieve a result and focus on becoming the person who achieves that result. Ask yourself: 'What would a disciplined person do right now?'`;
    }

    // --- Default General Response ---
    return `That’s a very relevant question for ${bookTitle}. Based on its focus on **${focusAreas[0]}**, the book's core advice would be to first **define the ideal outcome** and then use the principles of ${focusAreas[0]} to design a small, repeatable action toward that goal.`;
};


// --- HELPER: GENERATE BOOK FLYER CONTENT (Includes Adaptive Path Placeholder and better rendering) ---
const generateBookFlyerMarkdown = (book, tier, isExecutiveBrief) => {
    const focusAreas = book.focus.split(',').map(f => f.trim());
    const complexityData = COMPLEXITY_MAP[book.complexity] || COMPLEXITY_MAP['Medium'];
    const ComplexityIcon = complexityData.icon;

    // SIMULATED EXTERNAL/AI RICH SUMMARY
    const richSummary = `
**${book.title}** is the definitive text on **${focusAreas[0]}**. The core argument is that the key to success is building **self-managing systems**, not just hiring talented people. It provides a clear, step-by-step roadmap for business owners and managers to transition from working *in* their business to working *on* it. By focusing on **${focusAreas[1] || 'core philosophy'}**, you can productize your knowledge and ensure consistent, high-quality output, regardless of who is performing the task. This is a foundational reading for anyone serious about **scaling without chaos**.
`;

    // EXECUTIVE BRIEF CONTENT
    const executiveSummary = `
<div class="p-5 bg-[${COLORS.NAVY}]/10 rounded-lg border-l-4 border-[${COLORS.ORANGE}]">
    <h4 class="text-xl font-bold text-[${COLORS.NAVY}] flex items-center gap-2 mb-3"><Minimize2 class="w-5 h-5 text-[${COLORS.ORANGE}]"/> Executive Brief: 3 Core Shifts</h4>
    <ul class="list-disc ml-6 text-gray-800 text-base space-y-2">
        <li>1. **Systemization is Key:** Build processes that work independently of specific individuals.</li>
        <li>2. **Separate Roles:** Learn to distinguish between the Entrepreneur (Visionary), Manager (Process), and Technician (Doer).</li>
        <li>3. **Primary Action:** Create and document your first **Process Map** this week, delegating tasks you currently perform.</li>
    </ul>
</div>
`;
    // ADAPTIVE PATH CONTENT
    const adaptivePathContent = book.complexity === 'High' 
        ? `<div class="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-sm">
            <p class="font-semibold text-red-800">Adaptive Path: Expert Level</p>
            <p class="text-gray-700">Focus on the most complex chapters (5, 7, 9). Use the AI Coach primarily for cross-domain application questions.</p>
        </div>`
        : `<div class="p-3 bg-green-50 border-l-4 border-green-500 rounded-lg text-sm">
            <p class="font-semibold text-green-800">Adaptive Path: Novice/Intermediate</p>
            <p class="text-gray-700">Follow chapters sequentially. Complete all suggested Action Plan items before moving to the next section.</p>
        </div>`;


    // DYNAMIC CONTENT SECTION
    const mainContent = isExecutiveBrief ? executiveSummary : `
        <section class="p-4 bg-[${COLORS.NAVY}]/5 rounded-lg border border-gray-200">
            <h3 class="text-xl font-bold text-[${COLORS.NAVY}] mb-2 flex items-center gap-2"><Feather class="w-5 h-5 text-[${COLORS.ORANGE}]"/> Rich Synopsis</h3>
            <p class="text-sm text-gray-800">${richSummary}</p>
        </section>

        ${adaptivePathContent}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div class="space-y-3 p-4 border border-[${COLORS.TEAL}] rounded-lg bg-[${COLORS.TEAL}]/5">
                <h3 class="text-lg font-semibold text-[${COLORS.DARK_TEXT}] flex items-center gap-2"><Briefcase class="w-5 h-5 text-[${COLORS.TEAL}]"/> Core Skills to Master</h3>
                <ul class="list-none ml-0 text-gray-700 text-sm space-y-2">
                    ${focusAreas.map(f => `
                        <li class="flex items-start gap-2">
                            <CornerDownRight class="w-4 h-4 flex-shrink-0 mt-1 text-[${COLORS.ORANGE}]"/>
                            <span class="font-medium">**${f}**: Deep dive into this core competency.</span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            <div class="space-y-3 p-4 border border-[${COLORS.ORANGE}] rounded-lg bg-[${COLORS.ORANGE}]/5">
                <h3 class="text-lg font-semibold text-[${COLORS.DARK_TEXT}] flex items-center gap-2"><Zap class="w-5 h-5 text-[${COLORS.ORANGE}]"/> Suggested Action Plan</h3>
                <ul class="list-none ml-0 text-gray-700 text-sm space-y-2">
                    <li class="flex items-start gap-2">
                        <CornerDownRight class="w-4 h-4 flex-shrink-0 mt-1 text-[${COLORS.TEAL}]"/>
                        <span class="font-medium">**Pace:** Break reading into (9) 20-minute, high-focus sessions.</span>
                    </li>
                    <li class="flex items-start gap-2">
                         <CornerDownRight class="w-4 h-4 flex-shrink-0 mt-1 text-[${COLORS.TEAL}]"/>
                        <span class="font-medium">**Reflect:** Journal on one core idea per chapter and discuss with a colleague.</span>
                    </li>
                </ul>
            </div>
        </div>
    `;


    return `
<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4">

    <div class="lg:col-span-1 bg-white p-6 rounded-xl border-l-4 border-[${COLORS.TEAL}] shadow-lg">
        <h3 class="text-xl font-bold text-[${COLORS.NAVY}] mb-3 flex items-center gap-2">
            <Aperture class="w-5 h-5 text-[${COLORS.ORANGE}]"/> Essential Context
        </h3>
        
        <img class="w-full h-auto object-cover rounded-xl shadow-xl border border-gray-100 mb-4" 
             src="${book.image_url}" 
             alt="Related image for ${book.title}" 
             onerror="this.onerror=null;this.src='https://placehold.co/300x200/${COLORS.NAVY.slice(1)}/ffffff?text=Visual+Concept'"
        />

        <div class="flex flex-col space-y-2 text-sm">
            <div class="flex justify-between items-center text-gray-700">
                <span class="font-semibold flex items-center"><Clock class="w-4 h-4 mr-2 text-[${COLORS.ORANGE}]"/> Est. Learning Minutes</span>
                <span class="font-bold text-[${COLORS.NAVY}]">${book.duration} min</span>
            </div>
            <div class="flex justify-between items-center text-gray-700 border-t pt-2">
                <span class="font-semibold flex items-center"><ComplexityIcon class="w-4 h-4 mr-2 ${complexityData.color.replace('bg-', 'text-')}" /> Complexity Level</span>
                <span class="font-bold flex items-center gap-1 ${complexityData.color.replace('bg-', 'text-')}">${complexityData.label}</span>
            </div>
        </div>
    </div>

    <div class="lg:col-span-2 space-y-6">
        
        <header class="pb-3 border-b border-gray-200">
            <p class="text-xs font-semibold uppercase text-[${COLORS.TEAL}] mb-1">${tier} Competency</p>
            <h2 class="text-4xl font-extrabold text-[${COLORS.NAVY}] leading-tight">${book.title}</h2>
            <p class="text-lg font-medium text-[${COLORS.ORANGE}] mt-1">by ${book.author}</p>
        </header>

        ${mainContent}
        
        <div class="mt-8 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div class="flex items-start p-3 bg-teal-50 rounded-lg border border-teal-300">
                <Users className="w-5 h-5 text-[${COLORS.TEAL}] flex-shrink-0 mt-1"/>
                <div class="ml-3">
                    <p class="text-sm text-[${COLORS.NAVY}] font-semibold">Peer Accountability Group</p>
                    <p class="text-xs text-gray-700">Join a "Huddle" to discuss application and track shared progress.</p>
                </div>
            </div>
        </div>

    </div>
</div>
`;
};


// --- MAIN COMPONENT ---
export default function BusinessReadingsScreen() {
    const { allBooks: contextBooks = {}, updateCommitmentData, navigate } = useAppServices();
    const [selectedBook, setSelectedBook] = useState(null);
    const [htmlFlyer, setHtmlFlyer] = useState('');
    const [selectedTier, setSelectedTier] = useState('');
    const [savedBooks, setSavedBooks] = useState({});
    const [isExecutiveBrief, setIsExecutiveBrief] = useState(false);
    const [filters, setFilters] = useState({ complexity: 'All', maxDuration: 300, search: '' });

    // --- AI COACH STATES & REFS ---
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const aiInputRef = useRef(null); // Ref for maintaining input focus

    // Safely use context books or fall back to mock data
    const allBooks = Object.keys(contextBooks).length > 0 ? contextBooks : MOCK_ALL_BOOKS;

    // --- Filtered and Sorted Book List Memo ---
    const filteredBooks = useMemo(() => {
        const flatBooks = Object.entries(allBooks).flatMap(([tier, books]) => 
            (books || []).map(book => ({ ...book, tier }))
        );

        const searchTerm = filters.search.toLowerCase();

        return flatBooks.filter(book => {
            const complexityMatch = filters.complexity === 'All' || book.complexity === filters.complexity;
            const durationMatch = book.duration <= filters.maxDuration;
            
            // Search filter: matches title, author, or focus areas
            const searchMatch = !searchTerm || 
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                book.focus.toLowerCase().includes(searchTerm);

            return complexityMatch && durationMatch && searchMatch;
        }).reduce((acc, book) => {
            acc[book.tier] = acc[book.tier] || [];
            acc[book.tier].push(book);
            return acc;
        }, {});
    }, [allBooks, filters]);

    // Trigger flyer generation when a book or the toggle is changed
    useMemo(async () => {
        if (selectedBook) {
            const tierKey = selectedTier || Object.keys(allBooks).find(key => 
                (allBooks[key] || []).some(b => b.id === selectedBook.id)
            );
            
            if (tierKey) {
                 const markdown = generateBookFlyerMarkdown(selectedBook, tierKey, isExecutiveBrief);
                 setHtmlFlyer(await mdToHtml(markdown));
            }
        } else {
            setHtmlFlyer('');
        }
    }, [selectedBook, selectedTier, allBooks, isExecutiveBrief]); 
    
    // Reset states when selecting a new book
    React.useEffect(() => {
        if (selectedBook) {
            setIsExecutiveBrief(false);
            setAiQuery('');
            setAiResponse('');
        }
    }, [selectedBook]);

    // --- AI Coach Handler (Fixed for focus and enhanced response) ---
    const handleAiQuery = (e) => {
        e.preventDefault();
        const query = aiQuery.trim();
        if (!selectedBook || query === '') return;

        // Immediately clear input and set loading state
        setAiQuery('');
        setAiResponse('Thinking... (Simulating real-time AI response)...');
        
        // Wait a short time to simulate API latency
        setTimeout(() => {
            const response = mockAIResponse(selectedBook.title, selectedBook.focus.split(',').map(f => f.trim()), query);
            setAiResponse(response);
            
            // Maintain focus on the input field after response (CRITICAL FIX)
            if (aiInputRef.current) {
                aiInputRef.current.focus();
            }
        }, 800); 
    };

    // Handler to create a new commitment from the selected book
    const handleCommitment = (book) => {
        const newCommitment = {
            id: book.id,
            title: `Read: ${book.title} (${book.author})`,
            category: 'Reading',
            tier: selectedTier,
            notes: `Flyer analysis theme: ${book.theme}. Est. ${book.duration} min.`,
            status: 'Active',
            // --- GAMIFICATION FIELD ---
            progressMinutes: 0, 
            totalDuration: book.duration,
            createdAt: new Date().toISOString(),
        };

        const success = updateCommitmentData(newCommitment);

        if (success) {
            console.log(`Commitment for "${book.title}" added. Navigating to Daily Practice.`);
            navigate('daily-practice');
        } else {
            console.error('Failed to add commitment. updateCommitmentData did not return success.');
        }
    };

    // Handler for 'Save for Later' feature
    const handleSaveForLater = (bookId) => {
        setSavedBooks(prev => ({
            ...prev,
            [bookId]: !prev[bookId] // Toggle saved state
        }));
    };

    /* ----------------------------------------------------
       Book List View 
    ---------------------------------------------------- */
    const BookList = () => (
        <div className="space-y-10">
            <h2 className="text-3xl font-extrabold text-[${COLORS.NAVY}] flex items-center gap-3 border-b-4 border-[${COLORS.ORANGE}] pb-2">
                <BookOpen className="w-7 h-7 text-[${COLORS.TEAL}]" /> LeaderReps Curated Reading Library
            </h2>
            
            {/* --- PERSONALIZATION: FILTER & SEARCH BAR --- */}
            <div className='bg-[${COLORS.OFF_WHITE}] p-5 rounded-xl shadow-xl border border-gray-100'>
                <h3 className="text-xl font-bold text-[${COLORS.NAVY}] flex items-center gap-2 mb-4">
                    <Filter className='w-5 h-5 text-[${COLORS.ORANGE}]'/> Personalize Your Search
                </h3>
                
                {/* Search Input */}
                <div className="mb-6">
                    <label className='block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1'><Search className='w-4 h-4 text-[${COLORS.TEAL}]'/> Search by Title, Author, or Key Focus (e.g., "Delegation")</label>
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                        placeholder="Start typing to find a book..."
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-[${COLORS.ORANGE}] focus:border-[${COLORS.ORANGE}]"
                    />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Complexity Level</label>
                        <select
                            value={filters.complexity}
                            onChange={(e) => setFilters({...filters, complexity: e.target.value})}
                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]"
                        >
                            <option value="All">All Levels</option>
                            {Object.keys(COMPLEXITY_MAP).map(key => (
                                <option key={key} value={key}>{COMPLEXITY_MAP[key].label}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className='md:col-span-2'>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Max Est. Learning Minutes ({filters.maxDuration} minutes)</label>
                        <input
                            type="range"
                            min="150"
                            max="300"
                            step="10"
                            value={filters.maxDuration}
                            onChange={(e) => setFilters({...filters, maxDuration: parseInt(e.target.value)})}
                            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-[${COLORS.TEAL}]`}
                        />
                         <div className='flex justify-between text-xs text-gray-500 mt-1'>
                             <span>150 min (Quick Reads)</span>
                             <span>300 min (Deep Dive)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOOK LIST --- */}
            <div className="space-y-12">
                {Object.entries(filteredBooks).map(([tier, books]) => (
                    <div key={tier} className='bg-white rounded-2xl shadow-xl border-2 border-[${COLORS.NAVY}]/10 overflow-hidden'>
                        
                        {/* Category Header (High Contrast) */}
                        <div className='p-6 border-l-8 border-[${COLORS.ORANGE}] bg-[${COLORS.NAVY}]'>
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Aperture className="w-6 h-6 text-[${COLORS.TEAL}]" /> {tier}
                            </h3>
                            <p className="text-base text-gray-200 mt-1">Foundational books for mastering this core leadership competency. ({books.length} available)</p>
                        </div>

                        {/* Book Cards Grid */}
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {(books || []).map((book) => {
                                const complexityData = COMPLEXITY_MAP[book.complexity] || COMPLEXITY_MAP['Medium'];
                                const ComplexityIcon = complexityData.icon;
                                const isSaved = savedBooks[book.id];

                                return (
                                    <div key={book.id} className="relative group">
                                        <button
                                            onClick={() => {
                                                setSelectedBook(book);
                                                setSelectedTier(tier);
                                            }}
                                            className={`p-5 border-2 rounded-xl shadow-lg text-left transition-all w-full h-full block
                                                ${selectedBook?.id === book.id
                                                    ? 'bg-[${COLORS.TEAL}]/10 border-[${COLORS.TEAL}] ring-4 ring-[${COLORS.TEAL}]/50'
                                                    : 'bg-white border-gray-200 hover:shadow-xl hover:border-[${COLORS.ORANGE}]'
                                                }`}
                                        >
                                            <p className="font-extrabold text-xl text-[${COLORS.NAVY}] leading-snug mb-1">{book.title}</p>
                                            <p className="text-sm text-gray-600 italic mb-3">by {book.author}</p>
                                            
                                            <div className='h-px bg-gray-200 mb-3'></div>

                                            {/* Metrics: Time and Complexity */}
                                            <div className="flex flex-col text-sm text-gray-500 mt-2 space-y-2">
                                                <div className='flex items-center text-[${COLORS.DARK_TEXT}]'>
                                                    <Clock className="w-4 h-4 mr-2 text-[${COLORS.ORANGE}]" /> 
                                                    <span className='font-semibold'>Learning Mins:</span> 
                                                    <span className='ml-auto font-bold'>{book.duration} min</span>
                                                </div>
                                                <div className='flex items-center text-[${COLORS.DARK_TEXT}]'>
                                                    <ComplexityIcon className={`w-4 h-4 mr-2 ${complexityData.color.replace('bg-', 'text-')}`} /> 
                                                    <span className='font-semibold'>Complexity:</span> 
                                                    <span className={`ml-auto font-bold ${complexityData.color.replace('bg-', 'text-')}`}>{complexityData.label}</span>
                                                </div>
                                            </div>

                                            {/* Focus Badges */}
                                            <div className='mt-4 pt-3 border-t border-gray-100'>
                                                <p className='text-xs font-semibold text-[${COLORS.TEAL}] mb-1'>Key Focus:</p>
                                                <div className='flex flex-wrap gap-1'>
                                                    {book.focus.split(',').slice(0, 2).map((focus, index) => (
                                                        <span key={index} className='px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600'>
                                                            {focus.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </button>

                                        {/* Save for Later Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card selection
                                                handleSaveForLater(book.id);
                                            }}
                                            aria-label={isSaved ? "Remove from Saved" : "Save for Later"}
                                            className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200
                                                ${isSaved 
                                                    ? 'bg-yellow-500 text-white shadow-lg' 
                                                    : 'bg-white/80 text-gray-400 hover:text-yellow-500 hover:bg-white'
                                                }`}
                                        >
                                            <Star className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'}/>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        {books.length === 0 && (
                            <div className='p-6 text-center text-gray-500'>No books match the current filters in this category.</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    /* ----------------------------------------------------
       Book Flyer View (Corrected Readability & AI Coach)
    ---------------------------------------------------- */
    const BookFlyer = () => {
        // Mock current progress data (should come from context/Firebase in a real app)
        const mockProgress = {
            progressMinutes: 45, // Example progress
            totalDuration: selectedBook.duration,
            progressPercent: Math.round((45 / selectedBook.duration) * 100) || 0,
        };

        return (
            <div className="space-y-8">
                <div className='flex justify-between items-center pb-4 border-b border-gray-200'>
                    <h2 className="text-3xl font-bold text-[${COLORS.NAVY}] flex items-center gap-3">
                        <Star className="w-7 h-7 text-[${COLORS.ORANGE}]" /> Focus Flyer: {selectedBook.title}
                    </h2>
                    <button 
                        onClick={() => setSelectedBook(null)} 
                        className='text-base font-semibold text-[${COLORS.NAVY}] hover:text-[${COLORS.ORANGE}] transition-colors flex items-center gap-1 p-2 rounded-lg border border-transparent hover:border-gray-200'
                    >
                        &larr; Back to Library
                    </button>
                </div>

                <div className='bg-white rounded-2xl shadow-2xl p-8 border-4 border-[${COLORS.NAVY}]/10'>
                    
                    {/* --- EXECUTIVE BRIEF TOGGLE & PROGRESS INDICATOR --- */}
                    <div className='flex justify-between mb-4'>
                        {/* Progress Indicator */}
                        <div className='flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200'>
                            <TrendingUp className='w-5 h-5 text-[${COLORS.TEAL}]'/>
                            <div>
                                <p className='text-xs font-medium text-gray-600'>YOUR COMMITMENT STATUS</p>
                                <div className='flex items-center gap-2'>
                                    <div className='w-40 h-2 bg-gray-200 rounded-full'>
                                        <div 
                                            className='h-full bg-[${COLORS.TEAL}] rounded-full transition-all duration-500' 
                                            style={{ width: `${mockProgress.progressPercent > 100 ? 100 : mockProgress.progressPercent}%` }}
                                        ></div>
                                    </div>
                                    <span className='text-sm font-bold text-[${COLORS.NAVY}]'>{mockProgress.progressPercent}% Complete</span>
                                </div>
                            </div>
                        </div>

                        {/* Executive Brief Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                value="" 
                                className="sr-only peer" 
                                checked={isExecutiveBrief} 
                                onChange={() => setIsExecutiveBrief(!isExecutiveBrief)}
                            />
                            <div className={`w-11 h-6 ${isExecutiveBrief ? 'bg-[${COLORS.ORANGE}]' : 'bg-gray-400'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[${COLORS.ORANGE}]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                            <span className="ml-3 text-sm font-medium text-[${COLORS.NAVY}] flex items-center gap-1">
                                <Minimize2 className='w-4 h-4'/> Executive Brief
                            </span>
                        </label>
                    </div>

                    <div 
                        className="prose max-w-none space-y-4"
                        dangerouslySetInnerHTML={{ __html: htmlFlyer }} 
                    />
                    
                    {/* --- AI COACH IMPLEMENTATION (FIXED) --- */}
                    <div className='mt-8 pt-4 border-t border-gray-200'>
                        <h3 className="text-2xl font-bold text-[${COLORS.NAVY}] flex items-center gap-3 mb-4">
                            <MessageSquare className='w-6 h-6 text-blue-600'/> AI Coach: Instant Application
                        </h3>

                        {/* AI Response Display */}
                        {aiResponse && (
                            <div className='p-4 mb-4 bg-blue-50 border-l-4 border-blue-600 rounded-lg shadow-sm'>
                                <p className='text-sm text-blue-800 font-semibold'>AI Coach:</p>
                                <p className='text-sm text-gray-800 mt-1 italic'>{aiResponse}</p>
                            </div>
                        )}

                        {/* User Input Form */}
                        <form onSubmit={handleAiQuery} className='flex gap-2'>
                            <input
                                type='text'
                                ref={aiInputRef} // Ref for stable focus
                                value={aiQuery}
                                onChange={(e) => setAiQuery(e.target.value)}
                                placeholder={`Ask how to apply ${selectedBook.title} concepts to your job... (e.g., "How do I delegate?")`}
                                className='flex-grow p-3 border border-gray-300 rounded-lg focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]'
                                required
                            />
                            <button
                                type='submit'
                                className={`p-3 rounded-lg flex items-center justify-center gap-1 font-semibold transition-colors 
                                    ${aiQuery.trim() === '' ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`
                                }
                                disabled={aiQuery.trim() === ''}
                            >
                                <Send className='w-5 h-5'/>
                                Ask
                            </button>
                        </form>
                    </div>
                    {/* --- END AI COACH IMPLEMENTATION --- */}

                    <div className="mt-10 pt-6 border-t border-gray-200 flex justify-end gap-4">
                        <button 
                            onClick={() => handleSaveForLater(selectedBook.id)}
                            className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-colors border-2
                                ${savedBooks[selectedBook.id]
                                    ? 'bg-white text-yellow-600 border-yellow-600 hover:bg-yellow-50'
                                    : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-100'
                                }`}
                        >
                            <Star className="w-5 h-5" fill={savedBooks[selectedBook.id] ? 'currentColor' : 'none'}/> 
                            {savedBooks[selectedBook.id] ? 'Saved to Library' : 'Save for Later'}
                        </button>
                        <button 
                            onClick={() => handleCommitment(selectedBook)}
                            className="flex items-center gap-2 px-6 py-3 bg-[${COLORS.ORANGE}] text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-[${COLORS.ORANGE}]/40"
                        >
                            <TrendingUp className="w-5 h-5" /> Add to Daily Practice Commitment
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 md:p-10 min-h-screen" style={{ backgroundColor: COLORS.LIGHT_GRAY }}>
            <h1 className="text-4xl font-extrabold text-[${COLORS.NAVY}] mb-10">Professional Reading Hub</h1>

            {!selectedBook && <BookList />}
            {selectedBook && <BookFlyer />}
        </div>
    );
}