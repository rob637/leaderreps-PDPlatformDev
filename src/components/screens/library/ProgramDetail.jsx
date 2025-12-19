import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { UNIFIED_COLLECTION, CONTENT_TYPES } from '../../../services/unifiedContentService';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { Loader, PlayCircle, CheckCircle, Clock, BarChart, ArrowRight, Lock, BookOpen, Wrench, Film, Dumbbell, FileText } from 'lucide-react';
import { Card, Button, Badge } from '../../screens/developmentplan/DevPlanComponents.jsx';
import UniversalResourceViewer from '../../ui/UniversalResourceViewer.jsx';

const ProgramDetail = (props) => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [program, setProgram] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState(null);
  
  // Handle both direct props (from spread) and navParams prop (legacy/wrapper)
  const programId = props.id || props.navParams?.id;

  useEffect(() => {
    const fetchProgramData = async () => {
      if (!programId) return;

      try {
        setLoading(true);
        
        // 1. Fetch Program Details
        const programRef = doc(db, UNIFIED_COLLECTION, programId);
        const programSnap = await getDoc(programRef);
        
        if (programSnap.exists()) {
          const programData = { id: programSnap.id, ...programSnap.data() };
          setProgram(programData);
          
          // 2. Determine Modules Source
          // Priority 1: 'details.modules' (New Mixed Content Model)
          // Priority 2: 'details.workouts' (Legacy Embedded Model)
          // Priority 3: Child Query (Legacy Parent-Child Model)
          
          if (programData.details?.modules && programData.details.modules.length > 0) {
            setModules(programData.details.modules);
          } else if (programData.details?.workouts && programData.details.workouts.length > 0) {
            // Map legacy workouts to module format
            setModules(programData.details.workouts.map(w => ({ ...w, type: CONTENT_TYPES.WORKOUT })));
          } else {
            // Fallback: Query children
            const workoutsRef = collection(db, UNIFIED_COLLECTION);
            const q = query(
              workoutsRef, 
              where('type', '==', 'WORKOUT'),
              where('parentId', '==', programId),
              orderBy('sequenceOrder', 'asc')
            );
            
            const workoutsSnap = await getDocs(q);
            const workoutsData = workoutsSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              type: CONTENT_TYPES.WORKOUT
            }));
            
            setModules(workoutsData);
          }
        }
      } catch (error) {
        console.error("Error fetching program details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgramData();
  }, [db, programId]);

  const handleModuleClick = (module) => {
    // Navigate based on type
    switch (module.type) {
      case CONTENT_TYPES.WORKOUT:
        navigate('workout-detail', { id: module.id, title: module.title });
        break;
      case CONTENT_TYPES.READ_REP:
        navigate('read-rep-detail', { id: module.id });
        break;
      case CONTENT_TYPES.TOOL:
        // Open tool in viewer if possible, otherwise navigate
        if (module.url || module.metadata?.url) {
             setSelectedResource({
                 ...module,
                 url: module.url || module.metadata?.url
             });
        } else {
            navigate('tool-detail', { id: module.id });
        }
        break;
      case CONTENT_TYPES.VIDEO:
        if (module.url) {
            setSelectedResource(module);
        } else {
            console.log("Navigate to video:", module.id);
        }
        break;
      case CONTENT_TYPES.DOCUMENT:
        if (module.url || module.metadata?.url || module.fileUrl) {
             setSelectedResource({
                 ...module,
                 url: module.url || module.metadata?.url || module.fileUrl
             });
        }
        break;
      default:
        console.warn("Unknown module type:", module.type);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case CONTENT_TYPES.VIDEO: return <Film className="w-5 h-5" />;
      case CONTENT_TYPES.TOOL: return <Wrench className="w-5 h-5" />;
      case CONTENT_TYPES.READ_REP: return <BookOpen className="w-5 h-5" />;
      case CONTENT_TYPES.WORKOUT: return <Dumbbell className="w-5 h-5" />;
      case CONTENT_TYPES.DOCUMENT: return <FileText className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <PageLayout title="Loading Program..." showBack={true}>
        <div className="flex justify-center p-12">
          <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
        </div>
      </PageLayout>
    );
  }

  if (!program) {
    return (
      <PageLayout title="Program Not Found" showBack={true}>
        <div className="p-6 text-center">
          <p className="text-gray-600">The requested program could not be found.</p>
          <Button onClick={() => navigate('programs-index')} className="mt-4">
            Back to Programs
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (!isContentUnlocked(program)) {
    return (
      <PageLayout title="Content Locked" showBack={true}>
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">This Program is Locked</h2>
          <p className="text-slate-500 max-w-md mb-8">
            You haven't unlocked this content yet. Continue your Development Plan to gain access.
          </p>
          <Button onClick={() => navigate('programs-index')}>
            Back to Programs
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={program.title} 
      subtitle={program.description}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Library', path: 'library' },
        { label: 'Programs', path: 'programs-index' },
        { label: program.title, path: null }
      ]}
    >
      {selectedResource && (
        <UniversalResourceViewer 
          resource={selectedResource} 
          onClose={() => setSelectedResource(null)} 
        />
      )}
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Program Overview Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-corporate-navy mb-4">Program Overview</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                {program.metadata?.outcomeSummary || program.description}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Badge variant="blue" icon={Clock}>
                  {program.metadata?.durationWeeks || 4} Weeks
                </Badge>
                <Badge variant="purple" icon={BarChart}>
                  {program.metadata?.difficulty || 'Foundation'} Level
                </Badge>
                <Badge variant="teal" icon={CheckCircle}>
                  {modules.length} Modules
                </Badge>
              </div>
            </div>
            
            {/* Progress / CTA Section (Placeholder for now) */}
            <div className="w-full md:w-72 bg-slate-50 rounded-lg p-6 border border-slate-100 flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 bg-corporate-teal/10 rounded-full flex items-center justify-center mb-4 text-corporate-teal">
                <PlayCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Start This Program</h3>
              <p className="text-xs text-slate-500 mb-4">Add to your development plan to begin tracking progress.</p>
              <Button variant="primary" className="w-full">
                Add to Plan
              </Button>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div>
          <h3 className="text-lg font-bold text-corporate-navy mb-4 flex items-center gap-2">
            <span className="bg-corporate-navy text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {modules.length}
            </span>
            Program Content
          </h3>
          
          <div className="space-y-4">
            {modules.map((module, index) => (
              <div 
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className="group bg-white border border-slate-200 rounded-lg p-5 hover:border-corporate-teal hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center group-hover:bg-corporate-teal group-hover:text-white transition-colors">
                  {getIconForType(module.type)}
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Content {index + 1} • {module.type?.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 group-hover:text-corporate-teal transition-colors">
                    {module.title}
                  </h4>
                  <p className="text-sm text-slate-500 line-clamp-1">
                    {module.description}
                  </p>
                </div>
                
                <div className="flex-shrink-0 flex items-center gap-3">
                  {module.metadata?.durationMin && (
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                      {module.metadata.durationMin} min
                    </span>
                  )}
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-corporate-teal/10 transition-colors text-slate-400 group-hover:text-corporate-teal">
                    {getIconForType(module.type)}
                  </div>
                </div>
              </div>
            ))}
            
            {modules.length === 0 && (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                No content has been added to this program yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </PageLayout>
  );
};

export default ProgramDetail;
