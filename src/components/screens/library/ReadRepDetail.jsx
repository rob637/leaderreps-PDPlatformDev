import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { doc, getDoc } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { Loader, BookOpen, Clock, Target, CheckCircle, AlertTriangle, FileText, Layers, Zap } from 'lucide-react';
import { Button } from '../../screens/developmentplan/DevPlanComponents.jsx';

const COMPLEXITY_MAP = {
  Low:    { label: 'Foundational', color: 'text-green-600', icon: CheckCircle, bg: 'bg-green-50' },
  Medium: { label: 'Intermediate', color: 'text-amber-600', icon: AlertTriangle, bg: 'bg-amber-50' },
  High:   { label: 'Advanced',     color: 'text-red-600',   icon: Target, bg: 'bg-red-50' },
};

const ReadRepDetail = ({ navParams }) => {
  const { db, navigate } = useAppServices();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('brief'); // brief, flyer, action

  const bookId = navParams?.id;

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) return;
      try {
        setLoading(true);
        const docRef = doc(db, UNIFIED_COLLECTION, bookId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setBook({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching book:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [db, bookId]);

  if (loading) {
    return (
      <PageLayout title="Loading..." showBack={true}>
        <div className="flex justify-center p-12">
          <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
        </div>
      </PageLayout>
    );
  }

  if (!book) {
    return (
      <PageLayout title="Book Not Found" showBack={true}>
        <div className="p-6 text-center">
          <p className="text-gray-600">The requested book could not be found.</p>
          <Button onClick={() => navigate('read-reps-index')} className="mt-4">
            Back to Library
          </Button>
        </div>
      </PageLayout>
    );
  }

  const complexity = COMPLEXITY_MAP[book.metadata?.complexity] || COMPLEXITY_MAP['Medium'];
  const ComplexityIcon = complexity.icon;

  return (
    <PageLayout 
      title={book.title} 
      subtitle={book.metadata?.author}
      breadcrumbs={[
        { label: 'Library', path: 'library' },
        { label: 'Read & Reps', path: 'read-reps-index' },
        { label: book.title, path: null }
      ]}
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 flex flex-col md:flex-row gap-6">
          {/* Cover Placeholder */}
          <div className="w-32 h-48 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-300 shadow-inner">
            <BookOpen className="w-12 h-12" />
          </div>

          <div className="flex-grow">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${complexity.bg} ${complexity.color}`}>
                <ComplexityIcon className="w-3 h-3" />
                {complexity.label}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                <Clock className="w-3 h-3" />
                {book.metadata?.durationMin || 200} pages
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600">
                <Layers className="w-3 h-3" />
                {book.metadata?.category || 'General'}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">{book.title}</h1>
            <p className="text-slate-600 mb-4">{book.description}</p>

            {book.metadata?.focusAreas && (
              <div className="flex flex-wrap gap-2 mt-4">
                {book.metadata.focusAreas.map((area, i) => (
                  <span key={i} className="text-xs bg-slate-50 text-slate-500 border border-slate-200 px-2 py-1 rounded">
                    {area}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('brief')}
              className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === 'brief' 
                  ? 'border-corporate-teal text-corporate-teal bg-teal-50/30' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Executive Brief
              </div>
            </button>
            <button
              onClick={() => setActiveTab('flyer')}
              className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === 'flyer' 
                  ? 'border-corporate-teal text-corporate-teal bg-teal-50/30' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4" />
                Full Flyer
              </div>
            </button>
            <button
              onClick={() => setActiveTab('action')}
              className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === 'action' 
                  ? 'border-corporate-teal text-corporate-teal bg-teal-50/30' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                AI Rep Coach
              </div>
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'brief' && (
              <div className="prose max-w-none text-slate-700">
                {book.metadata?.executiveBriefHTML ? (
                  <div dangerouslySetInnerHTML={{ __html: book.metadata.executiveBriefHTML }} />
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No executive brief available.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'flyer' && (
              <div className="prose max-w-none text-slate-700">
                {book.metadata?.fullFlyerHTML ? (
                  <div dangerouslySetInnerHTML={{ __html: book.metadata.fullFlyerHTML }} />
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No full flyer available.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'action' && (
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">AI Rep Coach</h3>
                <p className="text-slate-600 mb-8">
                  Ask the AI coach how to apply the principles from <strong>{book.title}</strong> to your specific leadership challenges.
                </p>
                
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-left">
                  <label className="block text-sm font-medium text-slate-700 mb-2">What's your challenge?</label>
                  <textarea 
                    className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    placeholder="e.g., How can I apply the 'Build-Measure-Learn' loop to my team's weekly meetings?"
                  ></textarea>
                  <div className="mt-4 flex justify-end">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      Ask Coach
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  AI features are currently in preview mode.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </PageLayout>
  );
};

export default ReadRepDetail;