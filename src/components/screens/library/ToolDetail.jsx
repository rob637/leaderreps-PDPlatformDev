import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { doc, getDoc } from '../../../services/firebaseUtils';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { Loader, Lock } from 'lucide-react';
import { Button } from '../../screens/developmentplan/DevPlanComponents.jsx';
import UniversalResourceViewer from '../../ui/UniversalResourceViewer.jsx';

const ToolDetail = (props) => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  
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

  // Extract URL from details for UniversalResourceViewer
  const toolWithUrl = {
    ...tool,
    url: tool.details?.url || tool.metadata?.url || tool.url
  };

  return (
    <PageLayout 
      title={tool.title} 
      subtitle="Tool & Resource"
      breadcrumbs={[
        { label: 'Content', path: 'library' },
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6">
            <UniversalResourceViewer resource={toolWithUrl} inline={true} />
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-2">{tool.title}</h2>
              <p className="text-slate-600 dark:text-slate-300">{tool.description}</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ToolDetail;
