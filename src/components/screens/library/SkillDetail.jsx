import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useContentAccess } from '../../../hooks/useContentAccess';
import { collection, query, where, getDocs, orderBy } from '../../../services/firebaseUtils';
import { UNIFIED_COLLECTION, CONTENT_TYPES } from '../../../services/unifiedContentService';
import { getContentGroupById, GROUP_TYPES } from '../../../services/contentGroupsService';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { Loader, Zap, CheckCircle, Lock, BookOpen, Wrench, Film, FileText } from 'lucide-react';
import { Button, Badge } from '../../screens/developmentplan/DevPlanComponents.jsx';

const SkillDetail = (props) => {
  const { db, navigate } = useAppServices();
  const { isContentUnlocked } = useContentAccess();
  const [skill, setSkill] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Handle both direct props (from spread) and navParams prop (legacy/wrapper)
  const skillId = props.id || props.navParams?.id;

  useEffect(() => {
    const fetchSkillData = async () => {
      if (!skillId) return;

      try {
        setLoading(true);
        
        // 1. Fetch Skill Details from LOV
        const skillData = await getContentGroupById(db, GROUP_TYPES.SKILLS, skillId);
        
        if (skillData) {
          setSkill(skillData);
          
          // 2. Query content where skills array contains this skillId
          const contentRef = collection(db, UNIFIED_COLLECTION);
          const q = query(
            contentRef,
            where('skills', 'array-contains', skillId),
            where('status', '==', 'PUBLISHED'),
            orderBy('updatedAt', 'desc')
          );
          
          const contentSnap = await getDocs(q);
          const contentItems = contentSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setContent(contentItems);
        }
      } catch (error) {
        console.error("Error fetching skill details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillData();
  }, [db, skillId]);

  const handleContentClick = (item) => {
    // Navigate based on content type
    const navState = { 
      fromSkill: { 
        id: skillId, 
        title: skill?.label 
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

  // Group content by type for display
  const groupedContent = {
    videos: content.filter(c => c.type === CONTENT_TYPES.VIDEO),
    documents: content.filter(c => c.type === CONTENT_TYPES.DOCUMENT),
    readReps: content.filter(c => c.type === CONTENT_TYPES.READ_REP),
    tools: content.filter(c => c.type === CONTENT_TYPES.TOOL)
  };

  if (loading) {
    return (
      <PageLayout title="Loading Skill..." showBack={true}>
        <div className="flex justify-center p-12">
          <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
        </div>
      </PageLayout>
    );
  }

  if (!skill) {
    return (
      <PageLayout title="Skill Not Found" showBack={true}>
        <div className="p-6 text-center">
          <p className="text-gray-600">The requested skill could not be found.</p>
          <Button onClick={() => navigate('skills-index')} className="mt-4">
            Back to Skills
          </Button>
        </div>
      </PageLayout>
    );
  }

  const renderContentSection = (items, title, icon, bgColor, textColor) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold text-corporate-navy mb-4 flex items-center gap-2">
          <span className={`${bgColor} ${textColor} w-6 h-6 rounded-full flex items-center justify-center text-xs`}>
            {items.length}
          </span>
          {title}
        </h3>
        
        <div className="space-y-3">
          {items.map((item) => {
            const isLocked = item.isHiddenUntilUnlocked && !isContentUnlocked(item);
            
            return (
              <div 
                key={item.id}
                onClick={() => !isLocked && handleContentClick(item)}
                className={`
                  group bg-white border rounded-lg p-4 flex items-center gap-4 transition-all
                  ${isLocked 
                    ? 'border-slate-200 opacity-60 cursor-not-allowed' 
                    : 'border-slate-200 hover:border-teal-500 hover:shadow-md cursor-pointer'
                  }
                `}
              >
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                  ${isLocked 
                    ? 'bg-slate-100 text-slate-400' 
                    : 'bg-slate-100 text-slate-500 group-hover:bg-teal-500 group-hover:text-white'
                  }
                `}>
                  {isLocked ? <Lock className="w-5 h-5" /> : getIconForType(item.type)}
                </div>
                
                <div className="flex-grow min-w-0">
                  <h4 className={`font-bold transition-colors ${isLocked ? 'text-slate-400' : 'text-slate-800 group-hover:text-teal-600'}`}>
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
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <PageLayout 
      title={skill.label} 
      subtitle={skill.description}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Library', path: 'library' },
        { label: 'Skills', path: 'skills-index' },
        { label: skill.label, path: null }
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Skill Overview Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-teal-600" />
                </div>
                <h2 className="text-xl font-bold text-corporate-navy">{skill.label}</h2>
              </div>
              {skill.description && (
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {skill.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-4">
                <Badge variant="teal" icon={CheckCircle}>
                  {content.length} Related Content Items
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content by Type */}
        <div>
          {renderContentSection(groupedContent.videos, 'Videos', Film, 'bg-pink-500', 'text-white')}
          {renderContentSection(groupedContent.documents, 'Documents', FileText, 'bg-blue-500', 'text-white')}
          {renderContentSection(groupedContent.readReps, 'Read & Reps', BookOpen, 'bg-green-500', 'text-white')}
          {renderContentSection(groupedContent.tools, 'Tools', Wrench, 'bg-orange-500', 'text-white')}
          
          {content.length === 0 && (
            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
              No content has been tagged with this skill yet.
            </div>
          )}
        </div>

      </div>
    </PageLayout>
  );
};

export default SkillDetail;
