import React, { useState, useEffect } from 'react';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { collection, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { Loader, Zap, ArrowRight, Layers, Dumbbell, BookOpen, Wrench } from 'lucide-react';

const SkillsIndex = () => {
  const { db, navigate } = useAppServices();
  const [skills, setSkills] = useState([]);
  const [contentCounts, setContentCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'skills'), orderBy('name'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSkills(items);
      
      // Fetch content counts for each skill
      const counts = {};
      for (const skill of items) {
        try {
          const contentQ = query(
            collection(db, UNIFIED_COLLECTION),
            where('skills', 'array-contains', skill.id),
            where('status', '==', 'PUBLISHED')
          );
          const contentSnap = await getDocs(contentQ);
          const allContent = contentSnap.docs.map(d => d.data());
          
          counts[skill.id] = {
            programs: allContent.filter(c => c.type === 'PROGRAM').length,
            workouts: allContent.filter(c => c.type === 'WORKOUT').length,
            readReps: allContent.filter(c => c.type === 'READ_REP').length,
            tools: allContent.filter(c => c.type === 'TOOL').length,
            total: allContent.length
          };
        } catch (err) {
          counts[skill.id] = { programs: 0, workouts: 0, readReps: 0, tools: 0, total: 0 };
        }
      }
      setContentCounts(counts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  // Get pillar color based on skill pillar
  const getPillarStyle = (pillar) => {
    switch (pillar) {
      case 'LEAD_SELF':
        return { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' };
      case 'LEAD_WORK':
        return { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' };
      case 'LEAD_PEOPLE':
        return { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-teal-200' };
      default:
        return { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200' };
    }
  };

  return (
    <PageLayout 
      title="Skills Library" 
      subtitle="Browse content by leadership capability — your discovery engine for targeted development"
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Library', path: 'library' },
        { label: 'Skills', path: null }
      ]}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Find Content by Skill</h2>
              <p className="text-indigo-100 text-sm sm:text-base max-w-lg">
                Each skill connects you to relevant Programs, Workouts, Read & Reps, and Tools. 
                Click any skill to explore all related content.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1.5 rounded-full">
                <Layers className="w-3 h-3" /> Programs
              </div>
              <div className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1.5 rounded-full">
                <Dumbbell className="w-3 h-3" /> Workouts
              </div>
              <div className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1.5 rounded-full">
                <BookOpen className="w-3 h-3" /> Read & Reps
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Skills Found</h3>
            <p className="text-slate-500 mb-4">The skills taxonomy hasn't been initialized yet.</p>
            <p className="text-xs text-slate-400">Admin: Run the 'Seed Skills' migration.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => {
              const counts = contentCounts[skill.id] || { programs: 0, workouts: 0, readReps: 0, tools: 0, total: 0 };
              const style = getPillarStyle(skill.pillar);
              
              return (
                <div 
                  key={skill.id} 
                  onClick={() => navigate('skill-detail', { id: skill.id, title: skill.name })}
                  className={`bg-white rounded-xl border ${style.border} p-6 hover:border-corporate-teal hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${style.bg} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Zap className={`w-6 h-6 ${style.icon}`} />
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-corporate-teal group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-corporate-teal transition-colors">
                    {skill.name}
                  </h3>
                  
                  <p className="text-sm text-slate-500 line-clamp-2 flex-grow mb-4">
                    {skill.description}
                  </p>
                  
                  {/* Content Counts */}
                  <div className="pt-4 border-t border-slate-100">
                    {counts.total > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {counts.programs > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
                            <Layers className="w-3 h-3" /> {counts.programs} Program{counts.programs !== 1 ? 's' : ''}
                          </span>
                        )}
                        {counts.workouts > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                            <Dumbbell className="w-3 h-3" /> {counts.workouts} Workout{counts.workouts !== 1 ? 's' : ''}
                          </span>
                        )}
                        {counts.readReps > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded-full">
                            <BookOpen className="w-3 h-3" /> {counts.readReps} Book{counts.readReps !== 1 ? 's' : ''}
                          </span>
                        )}
                        {counts.tools > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-full">
                            <Wrench className="w-3 h-3" /> {counts.tools} Tool{counts.tools !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Content coming soon</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default SkillsIndex;
