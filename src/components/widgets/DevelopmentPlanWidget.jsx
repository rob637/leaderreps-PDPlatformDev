import React, { useState } from 'react';
import { BookOpen, CheckCircle, Circle, MessageSquare, Users, Video, Zap, Repeat, Play, FileText, ExternalLink, Loader } from 'lucide-react';
import { Card } from '../ui';
import UniversalResourceViewer from '../ui/UniversalResourceViewer';
import { doc, getDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { CONTENT_COLLECTIONS } from '../../services/contentService';

const DevelopmentPlanWidget = ({ scope }) => {
  const { db } = useAppServices();
  const [viewingResource, setViewingResource] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);
  const { 
    currentWeek,
    userProgress,
    handleItemToggle,
    handleReflectionUpdate
  } = scope;

  if (!currentWeek) return null;

  const { 
    title, 
    focus, 
    phase, 
    description, 
    weekNumber,
    estimatedTimeMinutes,
    skills = [],
    pillars = [],
    difficultyLevel,
    content = [], 
    community = [], 
    coaching = [],
    reps = [],
    dailyReps = [],
    reflectionPrompt
  } = currentWeek;

  const {
    completedItems = [],
    reflectionResponse = ''
  } = userProgress || {};

  const allItems = [...content, ...community, ...coaching];
  // The spec says: requiredItemsCount – total required items in this week.
  // So let's filter by required.
  
  const requiredItems = allItems.filter(i => i.required !== false && i.optional !== true);
  const requiredCompletedCount = requiredItems.filter(i => completedItems.includes(i.id)).length;
  const progressPercent = requiredItems.length > 0 ? (requiredCompletedCount / requiredItems.length) * 100 : 0;

  const getItemIcon = (type) => {
    switch (type) {
      case 'workout': return Video;
      case 'read_and_rep': return BookOpen;
      case 'leader_circle': return Users;
      case 'open_gym': return Users; // Or another icon
      default: return Circle;
    }
  };

  const handleViewResource = async (e, item) => {
    e.stopPropagation(); // Prevent toggling completion
    
    if (item.url) {
      // Legacy: direct URL
      setViewingResource({ ...item, resourceType: 'link' });
      return;
    }

    if (item.resourceId) {
      setLoadingResource(item.id);
      try {
        // Determine collection based on type
        let collectionName = CONTENT_COLLECTIONS.READINGS;
        if (item.resourceType === 'video') collectionName = CONTENT_COLLECTIONS.VIDEOS;
        else if (item.resourceType === 'community') collectionName = CONTENT_COLLECTIONS.COMMUNITY;
        else if (item.resourceType === 'coaching') collectionName = CONTENT_COLLECTIONS.COACHING;
        
        const docRef = doc(db, collectionName, item.resourceId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setViewingResource({ id: docSnap.id, ...docSnap.data(), resourceType: item.resourceType });
        } else {
          alert("Resource not found. It may have been deleted.");
        }
      } catch (error) {
        console.error("Error fetching resource:", error);
        alert("Failed to load resource.");
      } finally {
        setLoadingResource(false);
      }
    }
  };

  return (
    <>
      {viewingResource && (
        <UniversalResourceViewer 
          resource={viewingResource} 
          onClose={() => setViewingResource(null)} 
        />
      )}
      <Card title={phase} subtitle={title} icon={BookOpen} accent="BLUE">
      <div className="space-y-4">
        {/* Header Info */}
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-bold text-slate-800">{focus}</h3>
            {weekNumber && (
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">
                Week {weekNumber}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mb-3">{description}</p>
          
          {/* Metadata Tags */}
          <div className="flex flex-wrap gap-2 mb-2">
            {difficultyLevel && (
              <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-2 py-0.5 rounded uppercase">
                {difficultyLevel}
              </span>
            )}
            {estimatedTimeMinutes && (
              <span className="text-[10px] font-bold text-slate-500 border border-slate-200 px-2 py-0.5 rounded uppercase">
                {estimatedTimeMinutes} mins
              </span>
            )}
            {pillars.map(p => (
              <span key={p} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            This Week's Actions
          </p>
          
          {allItems.map((item) => {
            const isCompleted = completedItems.includes(item.id);
            const Icon = getItemIcon(item.type);
            
            return (
              <div 
                key={item.id} 
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer border ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
                onClick={() => handleItemToggle(item.id)}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <Icon size={16} />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-slate-500' : 'text-slate-800'}`}>
                      {item.label}
                    </p>
                    {item.recommendedWeekDay && !isCompleted && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase ml-2 whitespace-nowrap">
                        {item.recommendedWeekDay}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 capitalize">
                    {item.type.replace(/_/g, ' ')} • {item.required === false || item.optional ? 'Optional' : 'Required'}
                  </p>
                </div>

                {(item.resourceId || item.url) && (
                  <button
                    onClick={(e) => handleViewResource(e, item)}
                    className="p-2 text-slate-400 hover:text-corporate-teal hover:bg-teal-50 rounded-full transition-colors"
                    title="View Resource"
                  >
                    {loadingResource === item.id ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : item.resourceType === 'video' ? (
                      <Play className="w-5 h-5" />
                    ) : item.resourceType === 'reading' || item.resourceType === 'pdf' ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <ExternalLink className="w-5 h-5" />
                    )}
                  </button>
                )}

                {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>
            );
          })}
        </div>

        {/* Daily Reps Section */}
        {(reps.length > 0 || dailyReps.length > 0) && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00A896]" />
              Daily Reps
            </p>
            <p className="text-xs text-slate-400 mb-2">
              Practice these daily to reinforce learning
            </p>
            <div className="space-y-2">
              {[...dailyReps, ...reps].map((rep, idx) => (
                <div 
                  key={rep.repId || rep.id || idx}
                  className="flex items-start gap-3 p-3 bg-[#00A896]/10 border border-[#00A896]/20 rounded-xl"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#00A896]/20 text-[#00A896]">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {rep.repLabel || rep.label || rep.name || 'Daily Rep'}
                    </p>
                    {rep.repType && (
                      <p className="text-xs text-[#00A896] capitalize">
                        {rep.repType}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </Card>
    </>
  );
};

export default DevelopmentPlanWidget;
