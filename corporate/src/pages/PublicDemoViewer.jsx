import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Play, CheckCircle, Lock, ArrowRight } from 'lucide-react';
import DemoShell from '../modules/sales/demos/engine/components/DemoShell'; // Import Interactive Demo Engine

const PublicDemoViewer = () => {
  const { demoId } = useParams();
  const [searchParams] = useSearchParams();
  const refId = searchParams.get('ref');

  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState(null);
  const [error, setError] = useState(null);
  const [demoContent, setDemoContent] = useState(null);
  const [email, setEmail] = useState('');
  const [captured, setCaptured] = useState(false);

  // Mock Content (simulating a fetch from 'corporate_demos' library)
  const DEMO_CONTENT = {
    'demo_tour_v1': {
        title: 'Interactive Product Tour',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1', // Placeholder
        description: 'See how the LeaderReps platform transforms daily management habits.'
    },
    'demo_manager_walkthrough': {
        title: 'Manager Dashboard Walkthrough',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1', // Placeholder
        description: 'A deep dive into the tools your managers will use every day.'
    }
  };

  useEffect(() => {
    const init = async () => {
      // 1. Fetch Link Data if present
      if (refId) {
        try {
          const docRef = doc(db, 'corporate_demo_links', refId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setLinkData({ id: docSnap.id, ...docSnap.data() });
            // Track View immediately
            await updateDoc(docRef, {
              views: increment(1),
              lastViewed: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error("Error loading demo link:", e);
        }
      }

      // 2. Load Content
      const content = DEMO_CONTENT[demoId];
      if (content) {
        setDemoContent(content);
      } else {
        setError('Demo not found.');
      }
      setLoading(false);
    };

    init();
  }, [demoId, refId]);

  // Removed separate trackView as it is now integrated into init for cleaner flow


  const handleCapture = (e) => {
    e.preventDefault();
    setCaptured(true);
    // Submit lead to 'corporate_prospects' or similar
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500">{error}</div>;

  // Render Interactive Demo Engine if this is the Interactive Tour
  if (demoId === 'demo_tour_v1') {
      return (
          <div className="min-h-screen bg-slate-900">
              <DemoShell onExit={() => {}} />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 text-white">
            <div>
                <h1 className="text-2xl font-bold">{demoContent.title}</h1>
                <p className="text-slate-400">{demoContent.description}</p>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm">
                <Lock size={14} className="text-green-400" />
                <span>Private Demo Access</span>
            </div>
        </div>

        {/* Player Container */}
        <div className="bg-black rounded-xl overflow-hidden shadow-2xl aspect-video relative group">
            <iframe 
                width="100%" 
                height="100%" 
                src={demoContent.videoUrl} 
                title={demoContent.title} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
            ></iframe>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-white rounded-xl p-6 flex items-center justify-between">
            <div className="max-w-lg">
                <h3 className="text-xl font-bold text-corporate-navy mb-2">Ready to see the full platform?</h3>
                <p className="text-slate-500">Get a custom walkthrough for your organization's specific needs.</p>
            </div>
            
            {!captured ? (
                <form onSubmit={handleCapture} className="flex gap-2">
                    <input 
                        type="email" 
                        required
                        placeholder="Enter your work email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="border border-slate-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:border-corporate-teal"
                    />
                    <button className="bg-corporate-teal text-white px-6 py-2 rounded-lg font-bold hover:bg-corporate-teal/90 flex items-center gap-2">
                        Book Demo <ArrowRight size={18} />
                    </button>
                </form>
            ) : (
                <div className="bg-green-50 text-green-700 px-6 py-3 rounded-lg flex items-center gap-2 font-medium">
                    <CheckCircle size={20} /> Request received! We'll be in touch.
                </div>
            )}
        </div>

        <div className="mt-8 text-center text-slate-500 text-sm">
            Powered by <strong className="text-white">LeaderReps</strong>
        </div>
      </div>
    </div>
  );
};

export default PublicDemoViewer;
