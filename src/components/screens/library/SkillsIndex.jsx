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
    // Fetch from Unified Content Library (New System)
    const q = query(collection(db, UNIFIED_COLLECTION), where('type', '==', 'SKILL'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          name: data.title, 
          description: data.description,
          pillar: data.details?.domain || 'Uncategorized',
          ...data 
        };
      });
      
      // Sort by name
      items.sort((a, b) => a.name.localeCompare(b.name));

      setSkills(items);
      
      // Fetch content counts for each skill
      const counts = {};
      for (const skill of items) {
        try {
          const contentQ = query(
            collection(db, UNIFIED_COLLECTION),
            where('skillIds', 'array-contains', skill.id),
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
    const p = (pillar || '').toUpperCase();
    if (p.includes('SELF')) return { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' };
    if (p.includes('WORK')) return { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' };
    if (p.includes('PEOPLE')) return { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-teal-200' };
    return { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200' };
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
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {skills.map((skill) => {
                const counts = contentCounts[skill.id] || { programs: 0, workouts: 0, readReps: 0, tools: 0, total: 0 };
                const style = getPillarStyle(skill.pillar);
                
                return (
                  <div 
                    key={skill.id} 
                    onClick={() => navigate('skill-detail', { id: skill.id, title: skill.name })}
                    className="p-5 transition-colors hover:bg-slate-50 cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 ${style.bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                        <Zap className={`w-6 h-6 ${style.icon}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-bold text-slate-800 group-hover:text-corporate-teal transition-colors">
                            {skill.name}
                          </h3>
                          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-corporate-teal group-hover:translate-x-1 transition-all" />
                        </div>
                        
                        <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                          {skill.description}
                        </p>
                        
                        {/* Content Counts */}
                        {counts.total > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {counts.programs > 0 && (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
                                <Layers className="w-3 h-3" /> {counts.programs}
                              </span>
                            )}
                            {counts.workouts > 0 && (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                <Dumbbell className="w-3 h-3" /> {counts.workouts}
                              </span>
                            )}
                            {counts.readReps > 0 && (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded-full">
                                <BookOpen className="w-3 h-3" /> {counts.readReps}
                              </span>
                            )}
                            {counts.tools > 0 && (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-full">
                                <Wrench className="w-3 h-3" /> {counts.tools}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default SkillsIndex;
