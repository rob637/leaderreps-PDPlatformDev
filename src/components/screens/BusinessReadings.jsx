/* eslint-disable no-console */
import React, { useState, useMemo } from 'react';
import { useAppServices } from '../../App.jsx';
import { BookOpen, Target, CheckCircle, Clock, Feather, Aperture, Briefcase, Zap, Star } from 'lucide-react';
import { mdToHtml } from '../../utils/ApiHelpers.js';

// --- COLOR PALETTE ---
const COLORS = {
    NAVY: '#002E47',
    TEAL: '#47A88D',
    ORANGE: '#E04E1B',
    LIGHT_GRAY: '#FCFCFA',
};

// --- ENRICHED MOCK BOOK DATA (5 Categories, 5+ Books Each) ---
const MOCK_ALL_BOOKS = {
    'Strategy & Execution': [
        { id: 's_e_1', title: 'The E-Myth Revisited', author: 'Michael E. Gerber', theme: 'Building systems, not just doing work.', complexity: 'Medium', duration: 180, focus: 'Delegation, Process Mapping', cover: 'https://placehold.co/100x150/002E47/ffffff?text=E+Myth', image_url: 'https://placehold.co/600x400/002E47/ffffff?text=E-Myth+System' },
        { id: 's_e_2', title: 'Good to Great', author: 'Jim Collins', theme: 'Disciplined people, disciplined thought, disciplined action.', complexity: 'High', duration: 240, focus: 'Level 5 Leadership, Hedgehog Concept', cover: 'https://placehold.co/100x150/47A88D/ffffff?text=Good+to+Great', image_url: 'https://placehold.co/600x400/47A88D/ffffff?text=Hedgehog+Concept' },
        { id: 's_e_3', title: 'Measure What Matters', author: 'John Doerr', theme: 'Setting and achieving ambitious goals using OKRs.', complexity: 'Medium', duration: 200, focus: 'Goal Setting, Quarterly Planning', cover: 'https://placehold.co/100x150/E04E1B/ffffff?text=OKRs', image_url: 'https://placehold.co/600x400/E04E1B/ffffff?text=OKR+Framework' },
        { id: 's_e_4', title: 'Getting Things Done', author: 'David Allen', theme: 'Stress-free productivity systems.', complexity: 'Low', duration: 150, focus: 'Task Management, Workflow Design', cover: 'https://placehold.co/100x150/002E47/ffffff?text=GTD', image_url: 'https://placehold.co/600x400/002E47/ffffff?text=Workflow+Flowchart' },
        { id: 's_e_5', title: 'High Output Management', author: 'Andy Grove', theme: 'Increasing managerial output and process optimization.', complexity: 'High', duration: 220, focus: 'Leverage, One-on-Ones', cover: 'https://placehold.co/100x150/47A88D/ffffff?text=High+Output', image_url: 'https://placehold.co/600x400/47A88D/ffffff?text=Manager+Leverage' },
    ],
    'People & Culture': [
        { id: 'p_c_1', title: 'Dare to Lead', author: 'Brené Brown', theme: 'Courage, vulnerability, and trust in leadership.', complexity: 'Medium', duration: 210, focus: 'Psychological Safety, Feedback', cover: 'https://placehold.co/100x150/002E47/ffffff?text=Dare+to+Lead', image_url: 'https://placehold.co/600x400/002E47/ffffff?text=Vulnerability+Trust' },
        { id: 'p_c_2', title: 'The Five Dysfunctions of a Team', author: 'Patrick Lencioni', theme: 'Overcoming common team pitfalls.', complexity: 'Low', duration: 150, focus: 'Team Building, Conflict Management', cover: 'https://placehold.co/100x150/47A88D/ffffff?text=Five+Dysfunctions', image_url: 'https://placehold.co/600x400/47A88D/ffffff?text=Teamwork+Building' },
        { id: 'p_c_3', title: 'Radical Candor', author: 'Kim Scott', theme: 'Caring personally while challenging directly.', complexity: 'Medium', duration: 190, focus: 'Feedback Delivery, Coaching', cover: 'https://placehold.co/100x150/E04E1B/ffffff?text=Radical+Candor', image_url: 'https://placehold.co/600x400/E04E1B/ffffff?text=Candid+Feedback' },
        { id: 'p_c_4', title: 'Drive', author: 'Daniel H. Pink', theme: 'The surprising truth about what motivates us.', complexity: 'Medium', duration: 170, focus: 'Motivation, Autonomy, Mastery, Purpose', cover: 'https://placehold.co/100x150/002E47/ffffff?text=Drive', image_url: 'https://placehold.co/600x400/002E47/ffffff?text=Autonomy+Mastery' },
        { id: 'p_c_5', title: 'Multipliers', author: 'Liz Wiseman', theme: 'How the best leaders make everyone smarter.', complexity: 'High', duration: 230, focus: 'Talent Maximization, Genius Makers', cover: 'https://placehold.co/100x150/47A88D/ffffff?text=Multipliers', image_url: 'https://placehold.co/600x400/47A88D/ffffff?text=Multiplier+Effect' },
    ],
    'Self-Awareness & Growth': [
        { id: 's_a_1', title: 'Atomic Habits', author: 'James Clear', theme: 'Small changes, remarkable results.', complexity: 'Low', duration: 180, focus: 'Habit Formation, Self-Discipline', cover: 'https://placehold.co/100x150/E04E1B/ffffff?text=Atomic+Habits', image_url: 'https://placehold.co/600x400/E04E1B/ffffff?text=Habit+Loop' },
        { id: 's_a_2', title: 'Crucial Conversations', author: 'Kerry Patterson', theme: 'How to handle high-stakes dialogue.', complexity: 'Medium', duration: 200, focus: 'Communication, Conflict Resolution', cover: 'https://placehold.co/100x150/002E47/ffffff?text=Crucial+Convo', image_url: 'https://placehold.co/600x400/002E47/ffffff?text=Conflict+Resolution' },
        { id: 's_a_3', title: 'Mindset', author: 'Carol Dweck', theme: 'The new psychology of success (fixed vs. growth).', complexity: 'Medium', duration: 190, focus: 'Growth Mindset, Resilience', cover: 'https://placehold.co/100x150/47A88D/ffffff?text=Mindset', image_url: 'https://placehold.co/600x400/47A88D/ffffff?text=Growth+Vs+Fixed' },
        { id: 's_a_4', title: 'Essentialism', author: 'Greg McKeown', theme: 'The disciplined pursuit of less.', complexity: 'Low', duration: 160, focus: 'Prioritization, Saying No', cover: 'https://placehold.co/100x150/E04E1B/ffffff?text=Essentialism', image_url: 'https://placehold.co/600x400/E04E1B/ffffff?text=Focus+Path' },
        { id: 's_a_5', title: 'First Things First', author: 'Stephen Covey', theme: 'Time management based on priorities, not clock/compass.', complexity: 'Medium', duration: 210, focus: 'Quadrant II, Priority Matrix', cover: 'https://placehold.co/100x150/002E47/ffffff?text=First+Things', image_url: 'https://placehold.co/600x400/002E47/ffffff?text=Priority+Matrix' },
    ],
    'Innovation & Change': [
        { id: 'i_c_1', title: 'The Lean Startup', author: 'Eric Ries', theme: 'Using validated learning to steer innovation.', complexity: 'High', duration: 250, focus: 'MVP, Build-Measure-Learn', cover: 'https://placehold.co/100x150/47A88D/ffffff?text=Lean+Startup', image_url: 'https://placehold.co/600x400/47A88D/ffffff?text=Startup+Iterate' },
        { id: 'i_c_2', title: 'Start With Why', author: 'Simon Sinek', theme: 'Inspiration and how great leaders motivate action.', complexity: 'Medium', duration: 180, focus: 'Golden Circle, Purpose-Driven', cover: 'https://placehold.co/100x150/E04E1B/ffffff?text=Start+With+Why', image_url: 'https://placehold.co/600x400/E04E1B/ffffff?text=Golden+Circle' },
        { id: 'i_c_3', title: 'Crossing the Chasm', author: 'Geoffrey A. Moore', theme: 'Marketing and selling disruptive products to mainstream customers.', complexity: 'High', duration: 280, focus: 'Technology Adoption Lifecycle, Niche Focus', cover: 'https://placehold.co/100x150/002E47/ffffff?text=Chasm', image_url: 'https://placehold.co/600x400/002E47/ffffff?text=Market+Chasm' },
        { id: 'i_c_4', title: 'Creativity, Inc.', author: 'Ed Catmull', theme: 'Overcoming the hidden forces that stand in the way of true inspiration.', complexity: 'Medium', duration: 230, focus: 'Candor, Psychological Safety, Trust', cover: 'https://placehold.co/100x150/47A88D/ffffff?text=Creativity', image_url: 'https://placehold.co/600x400/47A88D/ffffff?text=Brainstorm+Idea' },
    ],
    'Finance & Business Acumen': [
        { id: 'f_b_1', title: 'The Personal MBA', author: 'Josh Kaufman', theme: 'The 10-day summary of business essentials.', complexity: 'Low', duration: 200, focus: 'Value Creation, Systems Thinking', cover: 'https://placehold.co/100x150/E04E1B/ffffff?text=Personal+MBA', image_url: 'https://placehold.co/600x400/E04E1B/ffffff?text=Business+Icons' },
        { id: 'f_b_2', title: 'Profit First', author: 'Mike Michalowicz', theme: 'How to transform a business from cash-eating to money-making.', complexity: 'Medium', duration: 180, focus: 'Cash Flow Management, Core Accounts', cover: 'https://placehold.co/100x150/002E47/ffffff?text=Profit+First', image_url: 'https://placehold.co/600x400/002E47/ffffff?text=Money+Growth' },
        { id: 'f_b_3', title: 'Business Model Generation', author: 'Alexander Osterwalder', theme: 'A handbook for visionaries, game changers, and challengers.', complexity: 'High', duration: 260, focus: 'Value Proposition, Key Partnerships', cover: 'https://placehold.co/100x150/47A88D/ffffff?text=Business+Model', image_url: 'https://placehold.co/600x400/47A88D/ffffff?text=Model+Canvas' },
        { id: 'f_b_4', title: 'The Goal', author: 'Eliyahu Goldratt', theme: 'Process optimization and the Theory of Constraints.', complexity: 'Medium', duration: 210, focus: 'Bottlenecks, Throughput', cover: 'https://placehold.co/100x150/E04E1B/ffffff?text=The+Goal', image_url: 'https://placehold.co/600x400/E04E1B/ffffff?text=Process+Gears' },
    ],
};

// --- HELPER: GENERATE BOOK FLYER CONTENT (Richer HTML/Markdown) ---
const generateBookFlyerMarkdown = (book, tier) => {
    // Note: The flyer is generated as Markdown which is then converted to HTML via mdToHtml.
    // We use a combination of Markdown tables and HTML/Tailwind classes for multi-column layout.
    return `
<div class="md:grid md:grid-cols-3 gap-6">

    <!-- Column 1: Core Message & Image -->
    <div class="md:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-md mb-6 md:mb-0">
        <h3 class="text-xl font-bold text-gray-800 mb-2 border-b pb-2">Core Focus</h3>
        <p class="text-sm italic text-gray-600 mb-4">"${book.theme}"</p>
        
        <img class="w-full h-auto object-cover rounded-xl shadow-lg mt-3" 
             src="${book.image_url}" 
             alt="Related image for ${book.title}" 
             onerror="this.onerror=null;this.src='https://placehold.co/300x200/555555/ffffff?text=Placeholder+Image'"
        />

        <div class="mt-4 text-center">
             <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                ${book.complexity} Complexity
            </span>
        </div>
    </div>

    <!-- Column 2: Key Takeaways & Actions -->
    <div class="md:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-md">
        
        <h2 class="text-3xl font-extrabold text-[${COLORS.NAVY}]">${book.title}</h2>
        <p class="text-lg font-medium text-[${COLORS.TEAL}] mb-4">by ${book.author}</p>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-6 pt-4 border-t border-gray-200">
            <div class="space-y-2">
                <h3 class="text-lg font-semibold text-[${COLORS.NAVY}] flex items-center gap-2"><Feather class="w-5 h-5 text-[${COLORS.ORANGE}]"/> Key Takeaways</h3>
                <ul class="list-disc ml-5 text-gray-700 text-sm space-y-1">
                    <li>Master the concept of **${book.focus.split(',')[0].trim()}**.</li>
                    <li>Understand the importance of **${book.focus.split(',')[1]?.trim() || 'core philosophy'}**.</li>
                    <li>Apply the principles directly to the **${tier}** competency.</li>
                </ul>
            </div>

            <div class="space-y-2">
                <h3 class="text-lg font-semibold text-[${COLORS.NAVY}] flex items-center gap-2"><Zap class="w-5 h-5 text-[${COLORS.ORANGE}]"/> Action & Time</h3>
                <ul class="list-disc ml-5 text-gray-700 text-sm space-y-1">
                    <li>**Investment:** ${book.duration} min estimated total time.</li>
                    <li>**Strategy:** Break reading into 20-minute, high-focus sessions.</li>
                    <li>**Reflection:** Journal on one core idea per chapter.</li>
                </ul>
            </div>
        </div>
        
        <h3 class="text-xl font-bold text-[${COLORS.NAVY}] border-t pt-4 mt-4">Aligned Competencies</h3>
        <p class="text-gray-600 text-sm mt-1">This book is vital for closing the skill gap in the following area:</p>
        
        <div class="mt-3 p-4 bg-[${COLORS.TEAL}]/10 border-l-4 border-[${COLORS.TEAL}] rounded-lg">
            <p class="font-semibold text-[${COLORS.NAVY}]">${tier} Competency</p>
            <p class="text-sm text-gray-700">Focus on the themes of ${book.theme.toLowerCase()}.</p>
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

    // Safely use context books or fall back to mock data if context is empty
    const allBooks = Object.keys(contextBooks).length > 0 ? contextBooks : MOCK_ALL_BOOKS;

    // Trigger flyer generation when a book is selected
    useMemo(async () => {
        if (selectedBook) {
            // Ensure selectedTier is available when generating content
            const tierKey = selectedTier || Object.keys(allBooks).find(key => 
                (allBooks[key] || []).some(b => b.id === selectedBook.id)
            );
            
            if (tierKey) {
                 const markdown = generateBookFlyerMarkdown(selectedBook, tierKey);
                 setHtmlFlyer(await mdToHtml(markdown));
            }
        } else {
            setHtmlFlyer('');
        }
    // Dependency includes allBooks to ensure re-generation if contextBooks load late
    }, [selectedBook, selectedTier, allBooks]); 

    // Handler to create a new commitment from the selected book
    const handleCommitment = (book) => {
        const newCommitment = {
            id: book.id,
            title: `Read: ${book.title} (${book.author})`,
            category: 'Reading',
            tier: selectedTier,
            notes: `Flyer analysis theme: ${book.theme}. Est. ${book.duration} min.`,
            status: 'Active',
            createdAt: new Date().toISOString(),
        };

        // Note: updateCommitmentData is a function provided by the context that handles Firebase interaction
        const success = updateCommitmentData(newCommitment);

        // We use console.log as an internal alert/feedback mechanism
        if (success) {
            console.log(`Commitment for "${book.title}" added. Navigating to Daily Practice.`);
            navigate('daily-practice');
        } else {
            console.error('Failed to add commitment. updateCommitmentData did not return success.');
        }
    };

    /* ----------------------------------------------------
       Book List View (Improved UI)
    ---------------------------------------------------- */
    const BookList = () => (
        <div className="space-y-8">
            <h2 className="text-2xl font-extrabold text-[${COLORS.NAVY}] flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[${COLORS.TEAL}]" /> LeaderReps Curated Reading Library
            </h2>
            <div className="space-y-10">
                {Object.entries(allBooks).map(([tier, books]) => (
                    <div key={tier} className='bg-white rounded-2xl shadow-lg overflow-hidden'>
                        <div className='p-5 border-l-8 border-[${COLORS.TEAL}] bg-[${COLORS.NAVY}]/5'>
                            <h3 className="text-xl font-bold text-[${COLORS.NAVY}] flex items-center gap-2">
                                <Aperture className="w-5 h-5 text-[${COLORS.TEAL}]" /> {tier}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">Foundational books for mastering this core leadership competency.</p>
                        </div>

                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(books || []).map((book) => (
                                <button
                                    key={book.id}
                                    onClick={() => {
                                        setSelectedBook(book);
                                        setSelectedTier(tier);
                                    }}
                                    className={`p-4 border rounded-xl shadow-sm text-left transition-all w-full
                                        ${selectedBook?.id === book.id
                                            ? 'bg-[${COLORS.TEAL}]/20 border-[${COLORS.TEAL}] ring-2 ring-[${COLORS.TEAL}]'
                                            : 'bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    <p className="font-bold text-lg text-[${COLORS.NAVY}] truncate">{book.title}</p>
                                    <p className="text-sm text-gray-600 italic">by {book.author}</p>
                                    <div className="flex items-center text-xs text-gray-500 mt-3 gap-4">
                                        <div className='flex items-center'>
                                            <Clock className="w-3 h-3 mr-1" /> {book.duration} min
                                        </div>
                                        <div className='flex items-center'>
                                            <Target className="w-3 h-3 mr-1" /> {book.complexity}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ----------------------------------------------------
       Book Flyer View (Professional Ad Look)
    ---------------------------------------------------- */
    const BookFlyer = () => (
        <div className="space-y-6">
            <div className='flex justify-between items-center border-b pb-4 mb-4'>
                <h2 className="text-2xl font-bold text-[${COLORS.NAVY}] flex items-center gap-2">
                    <Star className="w-6 h-6 text-[${COLORS.ORANGE}]" /> Focus Flyer: {selectedBook.title}
                </h2>
                <button 
                    onClick={() => setSelectedBook(null)} 
                    className='text-sm font-semibold text-[${COLORS.NAVY}] hover:text-[${COLORS.TEAL}] transition-colors flex items-center gap-1'
                >
                    &larr; Back to Library
                </button>
            </div>

            <div className='bg-white rounded-2xl shadow-2xl p-6 border-4 border-[${COLORS.NAVY}]/10'>
                 <div 
                    className="prose max-w-none space-y-4" 
                    dangerouslySetInnerHTML={{ __html: htmlFlyer }} 
                />
                
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                    <button 
                        onClick={() => handleCommitment(selectedBook)}
                        className="flex items-center gap-2 px-6 py-3 bg-[${COLORS.ORANGE}] text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg"
                    >
                        <Target className="w-5 h-5" /> Add to Daily Practice Commitment
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 min-h-screen bg-gray-100">
            <h1 className="text-3xl font-extrabold text-[${COLORS.NAVY}] mb-8">Professional Reading Hub</h1>

            {!selectedBook && <BookList />}
            {selectedBook && <BookFlyer />}
        </div>
    );
}
