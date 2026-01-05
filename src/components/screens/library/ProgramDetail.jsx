import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { collection, query, where, getDocs, orderBy } from '../../../services/firebaseUtils';
import { UNIFIED_COLLECTION, CONTENT_TYPES } from '../../../services/unifiedContentService';
import { getContentGroupById, GROUP_TYPES } from '../../../services/contentGroupsService';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { Loader, PlayCircle, CheckCircle, Lock, BookOpen, Wrench, Film, FileText, Layers } from 'lucide-react';
import { Button, Badge } from '../../screens/developmentplan/DevPlanComponents.jsx';

const ProgramDetail = (props) => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [program, setProgram] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Handle both direct props (from spread) and navParams prop (legacy/wrapper)
  const programId = props.id || props.navParams?.id;

  useEffect(() => {
    const fetchProgramData = async () => {
      if (!programId) return;

      try {
        setLoading(true);
        
        // 1. Fetch Program Details from LOV
        const programData = await getContentGroupById(db, GROUP_TYPES.PROGRAMS, programId);
        
        if (programData) {
          setProgram(programData);
          
          // 2. Query content where programs array contains this programId
          const contentRef = collection(db, UNIFIED_COLLECTION);
          const q = query(
            contentRef,
            where('programs', 'array-contains', programId),
            where('status', '==', 'PUBLISHED'),
            orderBy('updatedAt', 'desc')
          );
          
          const contentSnap = await getDocs(q);
          let contentItems = contentSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // 3. If program has contentOrder, sort by it
          if (programData.contentOrder && programData.contentOrder.length > 0) {
            const orderMap = {};
            programData.contentOrder.forEach((id, index) => {
              orderMap[id] = index;
            });
            contentItems.sort((a, b) => {
              const orderA = orderMap[a.id] ?? 999;
              const orderB = orderMap[b.id] ?? 999;
              return orderA - orderB;
            });
          }
          
          setContent(contentItems);
        }
      } catch (error) {
        console.error("Error fetching program details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgramData();
  }, [db, programId]);

  const handleContentClick = (item) => {
    // Navigate based on content type
    const navState = { 
      fromProgram: { 
        id: programId, 
        title: program?.label 
      } 
    };

    switch (item.type) {
      case CONTENT_TYPES.VIDEO:
        navigate('video-detail', { id: item.id, ...navState });
        break;
      case CONTENT_TYPES.READ_REP:
        navigate('read-rep-detail', { id: item.id, ...navState });
        break;
      case CONTENT_TYPES.TOOL:
        navigate('tool-detail', { id: item.id, ...navState });
        break;
      case CONTENT_TYPES.DOCUMENT:
        navigate('document-detail', { id: item.id, ...navState });
        break;
      default:
        console.warn("Unknown content type:", item.type);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case CONTENT_TYPES.VIDEO: return <Film className="w-5 h-5" />;
      case CONTENT_TYPES.TOOL: return <Wrench className="w-5 h-5" />;
      case CONTENT_TYPES.READ_REP: return <BookOpen className="w-5 h-5" />;
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

  if (program.isHiddenUntilUnlocked && !isContentUnlocked(program)) {
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
          {program.unlockDay && (
            <p className="text-sm text-slate-400 mb-4">Unlocks on Day {program.unlockDay}</p>
          )}
          <Button onClick={() => navigate('programs-index')}>
            Back to Programs
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title={program.label} 
      subtitle={program.description}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Library', path: 'library' },
        { label: 'Programs', path: 'programs-index' },
        { label: program.label, path: null }
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Program Overview Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Layers className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-corporate-navy">Program Overview</h2>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed">
                {program.description}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Badge variant="teal" icon={CheckCircle}>
                  {content.length} Content Items
                </Badge>
              </div>
            </div>
            
            {/* CTA Section */}
            <div className="w-full md:w-72 bg-slate-50 rounded-lg p-6 border border-slate-100 flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 bg-corporate-teal/10 rounded-full flex items-center justify-center mb-4 text-corporate-teal">
                <PlayCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 mb-2">Explore This Program</h3>
              <p className="text-xs text-slate-500 mb-4">
                Browse all content in this program to develop your skills.
              </p>
            </div>
          </div>
        </div>

        {/* Content List */}
        <div>
          <h3 className="text-lg font-bold text-corporate-navy mb-4 flex items-center gap-2">
            <span className="bg-corporate-navy text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
              {content.length}
            </span>
            Program Content
          </h3>
          
          <div className="space-y-4">
            {content.map((item) => {
              const isLocked = item.isHiddenUntilUnlocked && !isContentUnlocked(item);
              
              return (
                <div 
                  key={item.id}
                  onClick={() => !isLocked && handleContentClick(item)}
                  className={`
                    group bg-white border rounded-lg p-5 flex items-center gap-4 transition-all
                    ${isLocked 
                      ? 'border-slate-200 opacity-60 cursor-not-allowed' 
                      : 'border-slate-200 hover:border-corporate-teal hover:shadow-md cursor-pointer'
                    }
                  `}
                >
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${isLocked 
                      ? 'bg-slate-100 text-slate-400' 
                      : 'bg-slate-100 text-slate-500 group-hover:bg-corporate-teal group-hover:text-white'
                    }
                  `}>
                    {isLocked ? <Lock className="w-5 h-5" /> : getIconForType(item.type)}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {item.type?.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className={`font-bold transition-colors ${isLocked ? 'text-slate-400' : 'text-slate-800 group-hover:text-corporate-teal'}`}>
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    {isLocked && item.unlockDay && (
                      <p className="text-xs text-slate-400 mt-1">Unlocks on Day {item.unlockDay}</p>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center gap-3">
                    {item.estimatedTime && (
                      <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                        {item.estimatedTime} min
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {content.length === 0 && (
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
