import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { doc, getDoc } from '../../../services/firebaseUtils';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { Loader, Wrench, ExternalLink, Lock, FileText, Video, Link as LinkIcon } from 'lucide-react';
import { Button } from '../../screens/developmentplan/DevPlanComponents.jsx';
import { SkillTag, TierBadge } from '../../ui/ContentBadges.jsx';
import UniversalResourceViewer from '../../ui/UniversalResourceViewer.jsx';

const ToolDetail = (props) => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showViewer, setShowViewer] = useState(false);
  
  // Handle both direct props (from spread) and navParams prop (legacy/wrapper)
  const toolId = props.id || props.navParams?.id;
  const fromLibrary = props.fromLibrary || props.navParams?.fromLibrary;
  const fromSkill = props.fromSkill || props.navParams?.fromSkill;

  useEffect(() => {
    const fetchTool = async () => {
      if (!toolId) return;
      try {
        setLoading(true);
        const docRef = doc(db, UNIFIED_COLLECTION, toolId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setTool({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching tool:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTool();
  }, [db, toolId]);

  if (loading) {
    return (
      <PageLayout title="Loading..." showBack={true}>
        <div className="flex justify-center p-12">
          <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
        </div>
      </PageLayout>
    );
  }

  if (!tool) {
    return (
      <PageLayout title="Tool Not Found" showBack={true}>
        <div className="p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">The requested tool could not be found.</p>
          <Button onClick={() => navigate('tools-index')} className="mt-4">
            Back to Tools
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (!isContentUnlocked(tool)) {
    return (
      <PageLayout title="Content Locked" showBack={true}>
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">This Tool is Locked</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
            You haven't unlocked this content yet. Continue your Development Plan to gain access.
          </p>
          <Button onClick={() => navigate('tools-index')}>
            Back to Tools
          </Button>
        </div>
      </PageLayout>
    );
  }

  const getIcon = (toolType) => {
    if (toolType === 'VIDEO_RESOURCE') return <Video className="w-8 h-8" />;
    if (toolType === 'ARTICLE') return <LinkIcon className="w-8 h-8" />;
    return <FileText className="w-8 h-8" />;
  };

  const getColor = (toolType) => {
    if (toolType === 'VIDEO_RESOURCE') return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600' };
    if (toolType === 'ARTICLE') return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600' };
    return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600' };
  };

  const colors = getColor(tool.metadata?.toolType);

  return (
    <PageLayout 
      title={tool.title} 
      subtitle="Tool & Resource"
      breadcrumbs={[
        { label: 'Library', path: 'library' },
        ...(fromSkill
          ? [
              { label: 'Skills', path: 'skills-index' },
              { label: fromSkill.title, path: 'skill-detail', params: { id: fromSkill.id } }
            ]
          : fromLibrary 
            ? [{ label: fromLibrary.title, path: fromLibrary.path }]
            : [{ label: 'Tools', path: 'tools-index' }]
        ),
        { label: tool.title, path: null }
      ]}
    >
      {showViewer && (
        <UniversalResourceViewer 
          resource={{...tool, url: tool.details?.url || tool.metadata?.url || tool.url}} 
          onClose={() => setShowViewer(false)} 
        />
      )}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-8">
            <div className="flex items-start gap-6 mb-6">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.text}`}>
                {getIcon(tool.metadata?.toolType)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">{tool.title}</h1>
                <div className="flex flex-wrap gap-2">
                  {tool.tier && <TierBadge tier={tool.tier} />}
                  {tool.metadata?.toolType && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                      {tool.metadata.toolType.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="prose prose-slate max-w-none mb-8">
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                {tool.description}
              </p>
            </div>

            {tool.skills?.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Related Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {tool.skills.map(skill => (
                    <SkillTag key={skill} skill={skill.replace('skill_', '')} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center pt-6 border-t border-slate-100">
              <button 
                onClick={() => setShowViewer(true)}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                <ExternalLink className="w-5 h-5" />
                Open Resource
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ToolDetail;
