import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { useDevPlan } from '../../../hooks/useDevPlan';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { Loader, PlayCircle, Video, BookOpen, FileText, Zap, ArrowRight } from 'lucide-react';
import { Card, Button, Badge } from '../../screens/developmentplan/DevPlanComponents.jsx';

const SkillDetail = ({ navParams }) => {
  const { db, navigate } = useAppServices();
  const { masterPlan, currentWeek } = useDevPlan();
  const [skill, setSkill] = useState(null);
  const [relatedContent, setRelatedContent] = useState({
    programs: [],
    workouts: [],
    readReps: [],
    tools: []
  });
  const [loading, setLoading] = useState(true);
  const skillId = navParams?.id;

  // Calculate Unlocked Resources
  const unlockedResourceIds = useMemo(() => {
      if (!masterPlan || masterPlan.length === 0) return new Set();
      const ids = new Set();
      const currentWeekNum = currentWeek?.weekNumber || 1;

      masterPlan.forEach(week => {
          if (week.weekNumber <= currentWeekNum) {
              if (week.content && Array.isArray(week.content)) {
                  week.content.forEach(item => {
                      if (!item) return;
                      if (item.resourceId) ids.add(String(item.resourceId).toLowerCase());
                      if (item.contentItemId) ids.add(String(item.contentItemId).toLowerCase());
                      if (item.id) ids.add(String(item.id).toLowerCase());
                  });
              }
          }
      });
      return ids;
  }, [masterPlan, currentWeek]);

  useEffect(() => {
    const fetchSkillData = async () => {
      if (!skillId) return;

      try {
        setLoading(true);
        
        // 1. Fetch Skill Details
        // Note: Skills might be in 'skills' collection or 'system_lovs' depending on implementation
        // For now, assuming 'skills' collection as per migration plan
        const skillRef = doc(db, 'skills', skillId);
        const skillSnap = await getDoc(skillRef);
        
        if (skillSnap.exists()) {
          setSkill({ id: skillSnap.id, ...skillSnap.data() });
          
          // 2. Fetch Related Content
          // Query content where 'skills' array-contains skillId
          const contentRef = collection(db, UNIFIED_COLLECTION);
          const q = query(
            contentRef, 
            where('skills', 'array-contains', skillId),
            where('status', '==', 'PUBLISHED')
          );
          
          const contentSnap = await getDocs(q);
          const allContent = contentSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Filter by unlock status
          const unlockedContent = allContent.filter(c => {
              const isUnlocked = unlockedResourceIds.has(String(c.id).toLowerCase());
              if (isUnlocked) return true;

              // If not unlocked, hide unless explicitly marked as public (isHiddenUntilUnlocked === false)
              // This treats undefined as true (hidden) to enforce Vault & Key
              return c.isHiddenUntilUnlocked === false;
          });
          
          // Group by type
          setRelatedContent({
            programs: unlockedContent.filter(c => c.type === 'PROGRAM'),
            workouts: unlockedContent.filter(c => c.type === 'WORKOUT'),
            readReps: unlockedContent.filter(c => c.type === 'READ_REP'),
            tools: unlockedContent.filter(c => c.type === 'TOOL')
          });
        }
      } catch (error) {
        console.error("Error fetching skill details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillData();
  }, [db, skillId]);

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

  const ContentSection = ({ title, items, icon: Icon, typeLabel, route }) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold text-corporate-navy mb-4 flex items-center gap-2">
          <Icon className="w-5 h-5 text-corporate-teal" />
          {title}
          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs ml-2">
            {items.length}
          </span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <div 
              key={item.id}
              onClick={() => navigate(route, { id: item.id, title: item.title })}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:border-corporate-teal hover:shadow-md transition-all cursor-pointer flex items-start gap-3 group"
            >
              <div className="mt-1">
                <Icon className="w-5 h-5 text-slate-400 group-hover:text-corporate-teal transition-colors" />
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-slate-800 group-hover:text-corporate-teal transition-colors text-sm sm:text-base">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mt-1">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                    {item.metadata?.difficulty || 'General'}
                  </span>
                  {item.metadata?.durationMin && (
                    <span className="text-[10px] text-slate-400">
                      {item.metadata.durationMin} min
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-corporate-teal self-center" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <PageLayout 
      title={skill.name} 
      subtitle={skill.description}
      icon={Zap}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Library', path: 'library' },
        { label: 'Skills', path: 'skills-index' },
        { label: skill.name, path: null }
      ]}
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Skill Header Card */}
        <div className="bg-gradient-to-r from-indigo-50 to-white rounded-xl border border-indigo-100 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-900 mb-1">About this Skill</h2>
              <p className="text-indigo-800/80 text-sm leading-relaxed">
                {skill.longDescription || skill.description || "Mastering this skill is essential for effective leadership."}
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-2">
          <ContentSection 
            title="Programs" 
            items={relatedContent.programs} 
            icon={PlayCircle} 
            route="program-detail"
          />
          
          <ContentSection 
            title="Workouts" 
            items={relatedContent.workouts} 
            icon={Video} 
            route="workout-detail"
          />
          
          <ContentSection 
            title="Read & Reps" 
            items={relatedContent.readReps} 
            icon={BookOpen} 
            route="read-rep-detail" // Assuming this route exists or will exist
          />
          
          <ContentSection 
            title="Tools" 
            items={relatedContent.tools} 
            icon={FileText} 
            route="tool-detail" // Assuming this route exists or will exist
          />
          
          {/* Empty State */}
          {Object.values(relatedContent).every(arr => arr.length === 0) && (
            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">No Content Yet</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                We haven't tagged any content with this skill yet. Check back soon as we update our library.
              </p>
            </div>
          )}
        </div>

      </div>
    </PageLayout>
  );
};

export default SkillDetail;