import React, { useState, useEffect } from 'react';
import { PageLayout } from '../../ui/PageLayout.jsx';
import { useAppServices } from '../../../services/useAppServices.jsx';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../../services/unifiedContentService';
import { getContentGroups, GROUP_TYPES } from '../../../services/contentGroupsService';
import { Loader, Zap, ArrowRight, Film, Dumbbell, BookOpen, Wrench, FileText, Search } from 'lucide-react';

const SkillsIndex = () => {
  const { db, navigate } = useAppServices();
  const [skills, setSkills] = useState([]);
  const [contentCounts, setContentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        // Fetch skills from LOV
        const skillsData = await getContentGroups(db, GROUP_TYPES.SKILLS);
        setSkills(skillsData);
        
        // Fetch content counts for each skill
        const counts = {};
        for (const skill of skillsData) {
          try {
            const contentQ = query(
              collection(db, UNIFIED_COLLECTION),
              where('skills', 'array-contains', skill.id),
              where('status', '==', 'PUBLISHED')
            );
            const contentSnap = await getDocs(contentQ);
            const allContent = contentSnap.docs.map(d => d.data());
            
            counts[skill.id] = {
              videos: allContent.filter(c => c.type === 'VIDEO').length,
              documents: allContent.filter(c => c.type === 'DOCUMENT').length,
              readReps: allContent.filter(c => c.type === 'READ_REP').length,
              tools: allContent.filter(c => c.type === 'TOOL').length,
              total: allContent.length
            };
          } catch (err) {
            counts[skill.id] = { videos: 0, documents: 0, readReps: 0, tools: 0, total: 0 };
          }
        }
        setContentCounts(counts);
      } catch (error) {
        console.error('Error fetching skills:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSkills();
  }, [db]);

  // Filter skills by search
  const filteredSkills = skills.filter(skill => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return skill.label?.toLowerCase().includes(q) || skill.description?.toLowerCase().includes(q);
  });

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
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Find Content by Skill</h2>
              <p className="text-teal-100 text-sm sm:text-base max-w-lg">
                Each skill connects you to relevant Videos, Documents, Read & Reps, and Tools. 
                Click any skill to explore all related content.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1.5 rounded-full">
                <Film className="w-3 h-3" /> Videos
              </div>
              <div className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1.5 rounded-full">
                <BookOpen className="w-3 h-3" /> Read & Reps
              </div>
              <div className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1.5 rounded-full">
                <Wrench className="w-3 h-3" /> Tools
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-corporate-teal focus:border-transparent bg-white shadow-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Skills Found</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery ? 'Try adjusting your search.' : 'No skills have been defined yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredSkills.map((skill) => {
                const counts = contentCounts[skill.id] || { videos: 0, documents: 0, readReps: 0, tools: 0, total: 0 };
                
                return (
                  <div 
                    key={skill.id} 
                    onClick={() => navigate('skill-detail', { id: skill.id, title: skill.label })}
                    className="p-5 transition-colors hover:bg-slate-50 cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <Zap className="w-6 h-6 text-teal-600" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-bold text-slate-800 group-hover:text-corporate-teal transition-colors">
                            {skill.label}
                          </h3>
                          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-corporate-teal group-hover:translate-x-1 transition-all" />
                        </div>
                        
                        {skill.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                            {skill.description}
                          </p>
                        )}
                        
                        {/* Content Counts */}
                        {counts.total > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {counts.videos > 0 && (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-pink-50 text-pink-600 px-2 py-1 rounded-full">
                                <Film className="w-3 h-3" /> {counts.videos}
                              </span>
                            )}
                            {counts.documents > 0 && (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                <FileText className="w-3 h-3" /> {counts.documents}
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

        {/* Count */}
        {!loading && filteredSkills.length > 0 && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Showing {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </PageLayout>
  );
};

export default SkillsIndex;
