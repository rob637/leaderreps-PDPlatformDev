import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../App.jsx';
import { Card, Button } from '../shared/UI';
import { BookOpen, User, CornerRightUp, PlusCircle, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Zap, Briefcase, Target, HeartPulse, ArrowLeft } from 'lucide-react';

// --- Components for the Business Readings Router ---

// Action Flyer View (AI Summary Generator)
const ActionFlyerView = ({ book, setReadingView }) => {
    const { navigate, callSecureGeminiAPI, hasGeminiKey, updateCommitmentData } = useAppServices();
    
    const [summaryData, setSummaryData] = useState({ text: '', sources: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [html, setHtml] = useState('');

    useEffect(() => {
        if (!summaryData.text) { setHtml(''); return; }
        (async () => require('../../utils/ApiHelpers').mdToHtml(summaryData.text).then(setHtml))();
    }, [summaryData.text]);

    const generateSummary = async () => {
        if (!book) return;

        setIsLoading(true);
        setError(null);
        setSummaryData({ text: '', sources: [] });

        if (!hasGeminiKey()) {
            setError("AI Generation Unavailable. The Gemini API Key is missing. Please set your key to enable this feature.");
            setIsLoading(false);
            return;
        }

        const tools = [{ "google_search": {} }]; 

        const systemPrompt = `You are a professional business copywriter and leadership marketing expert. Your task is to generate compelling, visually parsable flyer content based on the core lessons of the book "${book.title}" by ${book.author}". Structure the output strictly in Markdown with the following sections:
A single H1 tag (#) for the Catchy Headline/Promise (This must be the very first line).
A single bolded paragraph summarizing the PROBLEM the book solves (e.g., **PROBLEM SOLVED:** [Content]).
A single H3 tag (###) titled "KEY ACTIONS: IMPLEMENT NOW".
Three to four highly actionable takeaways using bolded bullet points.
A final, powerful Call to Action paragraph.
The tone must be energetic, persuasive, and focused purely on immediate leadership application.`;

        const userQuery = `Provide the leadership action flyer content for the book: "${book.title}"`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                tools: tools,
            };

            const result = await callSecureGeminiAPI(payload);
            const candidate = result?.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                const text = candidate.content.parts[0].text;
                let sources = [];
                const groundingMetadata = candidate.groundingMetadata;

                 if (groundingMetadata && groundingMetadata.groundingAttributions) {
                   sources = groundingMetadata.groundingAttributions
                     .map(attribution => ({
                       uri: attribution.web?.uri,
                       title: attribution.web?.title,
                     }))
                     .filter(source => source.uri && source.title);
                 }
                 setSummaryData({ text, sources });

            } else {
                setError("Could not generate flyer content. The model may have blocked the request or the response was empty.");
            }
        } catch (e) {
          console.error("API Fetch Error:", e);
          setError("A network or API error occurred. Please try again.");
        } finally {
          setIsLoading(false);
        }
    };

    useEffect(() => {
        if (book) {
            generateSummary();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [book?.id]);

    const handleCommitmentCreation = async (actionText) => {
        if (!actionText || !updateCommitmentData) return;
        
        const commitmentText = `(Reading: ${book.title}) Implement key action: ${actionText}`;
        
        // Defaulting linked goal to the book's category and a default Tier T5
        const newCommitment = { 
            id: Date.now(), 
            text: commitmentText, 
            status: 'Pending', 
            isCustom: true, 
            linkedGoal: book.tier || book.category || 'Strategic Growth',
            linkedTier: 'T5', 
            targetColleague: null,
            expectedReps: 1,
            currentReps: 0,
        };

        const success = await updateCommitmentData(data => {
            const existingCommitments = data?.active_commitments || [];
            return { active_commitments: [...existingCommitments, newCommitment], reps: data.reps || [], history: data.history || [] };
        });

        if (success) {
            alert("Commitment created! Review it in your Daily Practice Scorecard.");
            navigate('daily-practice', { 
                initialGoal: newCommitment.linkedGoal, 
                initialTier: newCommitment.linkedTier 
            }); 
        } else {
            alert("Failed to save new commitment.");
        }
    };

    const renderContent = () => {
        if (!book) return <p className="p-4 text-gray-600">No book selected.</p>;

        if (isLoading) {
          return (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
              <p className="text-[#47A88D] font-medium">Generating **Visual Action Flyer** content...</p>
            </div>
          );
        }
        if (error) {
          return (
            <div className="bg-[#E04E1B]/10 p-6 rounded-xl border-2 border-[#E04E1B] text-[#002E47]">
                <h3 className="font-bold text-lg mb-2 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-[#E04E1B]"/> Generation Error</h3>
                <p className='text-sm'>{error}</p>
                {error.includes("API Key is missing") && (
                    <p className='text-xs mt-2 font-medium'>Please set your `window.__GEMINI_API_KEY` to enable summaries. See **App Settings** for details.</p>
                )}
            </div>
          );
        }
        if (html) {
          return (
            <div className="bg-gray-100 p-4 md:p-12 rounded-3xl shadow-2xl">
              <div className="bg-[#FCFCFA] p-8 rounded-3xl shadow-2xl border-t-8 border-[#002E47]">
                <div className="lg:grid lg:grid-cols-3 lg:gap-10">
                  
                  <div className="lg:col-span-1 border-r border-indigo-100 lg:pr-8 mb-8 lg:mb-0">
                    <div className="prose max-w-none 
                      prose-h1:text-4xl prose-h1:text-[#47A88D] prose-h1:font-extrabold prose-h1:mt-0 prose-h1:mb-4
                      prose-p:text-gray-700 prose-p:font-medium prose-p:text-lg prose-p:mt-6
                      prose-h3:hidden prose-ul:hidden prose-blockquote:hidden
                    " dangerouslySetInnerHTML={{ __html: html }} />
                    
                    <h4 className="text-[#002E47] font-bold mt-8 mb-4 border-t pt-4">Your Next Step:</h4>
                    <Button onClick={() => handleCommitmentCreation(book.title)} className="w-full">
                        <PlusCircle className='w-5 h-5 mr-2' /> Turn into Commitment
                    </Button>
                    
                    <p className="text-xs text-gray-500 mt-4 italic">
                        The core lesson will be added to your Daily Commitment Scorecard for tracking.
                    </p>
                  </div>

                  <div className="lg:col-span-2">
                    
                    <h2 className="text-2xl font-bold text-[#002E47] mb-6 flex items-center">
                        <Zap className="w-6 h-6 mr-3 text-[#47A88D]"/>
                        High-Impact Leadership Blueprint
                    </h2>

                    <div className="prose max-w-none 
                      prose-h1:hidden prose-h2:hidden 
                      prose-h3:text-[#002E47] prose-h3:font-extrabold prose-h3:mt-8 prose-h3:border-b prose-h3:pb-2
                      prose-ul:list-none prose-ul:pl-0 prose-ul:space-y-4 prose-ul:mt-4
                      prose-li:text-lg prose-li:text-gray-800
                      prose-li:before:content-['✓'] prose-li:before:mr-3 prose-li:before:text-[#47A88D] prose-li:before:font-extrabold
                      prose-p:text-xl prose-p:text-gray-700 prose-p:mt-0 prose-p:mb-6
                    " dangerouslySetInnerHTML={{ __html: html }} />
                    
                  </div>

                </div>
              </div>

              {summaryData.sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-300">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Sources:</h4>
                  <ul className="list-disc pl-5 text-xs text-gray-500 space-y-1">
                    {summaryData.sources.map((source, index) => (
                      <li key={index}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:text-[#47A88D] transition-colors">{source.title}</a></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        }
        return <p className="p-4 text-gray-600">Preparing content...</p>;
    };

    return (
        <div className="p-8">
            <h1 className="text-4xl font-extrabold text-[#002E47] mb-3">"{book?.title || 'Book Title'}" - Leadership Action Flyer</h1>
            <h2 className="text-xl font-medium text-[#47A88D] mb-6">{book ? `By ${book.author} (Focus on Immediate Action)` : 'Select a book'}</h2>
            <Button onClick={() => setReadingView('categories')} variant="outline" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Books
            </Button>
            {renderContent()}
        </div>
    );
};

// Books List View
const BooksListView = ({ category, setReadingView, setSelectedBook }) => {
    // FIX: Safely access allBooks
    const { allBooks = {} } = useAppServices();
    const books = allBooks[category] || [];
    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">{category} Reading List</h1>
            <p className="text-lg text-gray-600 mb-6">Select a book below to generate a concise, one-page leadership flyer.</p>
            <Button onClick={() => setReadingView('categories')} variant="outline" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Categories
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map(book => (
                    <Card key={book.id} title={book.title} className="border-l-4 border-[#47A88D] rounded-3xl" onClick={() => {
                        setSelectedBook({ ...book, tier: category }); // Pass category as tier context
                        setReadingView('summary');
                    }}>
                        <p className="text-sm text-gray-700">Author: {book.author}</p>
                        <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                            Generate Action Flyer &rarr;
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// Categories View
const CategoriesView = ({ setReadingView, setSelectedCategory }) => {
    // FIX: Safely access allBooks
    const { allBooks = {} } = useAppServices();
    
    const categories = [
        { name: 'Strategy', icon: TrendingUp, description: 'Defining direction, setting priorities, and competitive analysis.' },
        { name: 'Culture', icon: Users, description: 'Building high-performing teams, psychological safety, and radical candor.' },
        { name: 'Productivity', icon: Zap, description: 'Time management, effective habits, and deep work principles.' },
        { name: 'Innovation', icon: Briefcase, description: 'Fostering creativity, navigating disruption, and executing new ideas.' },
        { name: 'Personal Willpower', icon: Target, description: 'Discipline, habit formation, and focused execution on goals.' },
        { name: 'Mental Fitness & Resilience', icon: HeartPulse, description: 'Emotional regulation, stress management, and growth mindset.' },
    ];

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Leadership Business Readings</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Browse curated action flyers of top business books, categorized by core leadership domain.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(cat => (
                    <Card key={cat.name} title={cat.name} icon={cat.icon} onClick={() => {
                        setSelectedCategory(cat.name);
                        setReadingView('books-list');
                    }}>
                        <p className="text-sm text-gray-700">{cat.description}</p>
                        <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                            View Books ({allBooks[cat.name] ? allBooks[cat.name].length : 0}) &rarr;
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// Main Router (default export)
export default function BusinessReadingsScreen() {
    const [view, setReadingView] = useState('categories');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBook, setSelectedBook] = useState(null);

    const renderView = () => {
        switch (view) {
            case 'books-list':
                return <BooksListView category={selectedCategory} setReadingView={setReadingView} setSelectedBook={setSelectedBook} />;
            case 'summary':
                return <ActionFlyerView book={selectedBook} setReadingView={setReadingView} />;
            case 'categories':
            default:
                return <CategoriesView setReadingView={setReadingView} setSelectedCategory={setSelectedCategory} />;
        }
    };

    return renderView();
}
