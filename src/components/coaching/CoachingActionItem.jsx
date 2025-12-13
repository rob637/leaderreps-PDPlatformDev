import React, { useState } from 'react';
import { 
  CheckCircle, 
  Calendar, 
  Users, 
  Clock, 
  Zap,
  AlertTriangle,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import SessionPickerModal from './SessionPickerModal';

/**
 * CoachingActionItem Component
 * 
 * A specialized action item for coaching activities in the Dev Plan.
 * Unlike content items, coaching items are clickable to open a session picker
 * where users can register for available live sessions.
 * 
 * Props:
 * - item: The coaching item from the dev plan (id, label, type, skillFocus, etc.)
 * - isCompleted: Whether the user has attended a session for this item
 * - isCarriedOver: Whether this item was carried over from a previous week
 * - carryCount: Number of times this item has been carried over
 * - onComplete: Callback when a session is attended
 * - registration: User's current registration for this skill (if any)
 */
const CoachingActionItem = ({ 
  item, 
  isCompleted = false,
  isCarriedOver = false,
  carryCount = 0,
  onComplete,
  registration,
  weekNumber
}) => {
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  
  // Determine the icon based on coaching type
  const getIcon = () => {
    const type = (item.type || item.coachingItemType || '').toLowerCase();
    if (type.includes('open_gym') || type.includes('opengym')) return Users;
    if (type.includes('leader_circle') || type.includes('leadercircle')) return Users;
    if (type.includes('workshop')) return MessageSquare;
    if (type.includes('live_workout') || type.includes('workout')) return Zap;
    return Calendar;
  };
  
  const Icon = getIcon();
  const label = item.label || item.coachingItemLabel || item.title || 'Coaching Session';
  const skillFocus = item.skillFocus || item.skill || [];
  const skillArray = Array.isArray(skillFocus) ? skillFocus : [skillFocus].filter(Boolean);
  
  // Format registration status if user is registered
  const registrationStatus = registration?.status;
  const sessionDate = registration?.sessionDate;
  
  const formatSessionDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const handleItemClick = () => {
    if (!isCompleted) {
      setShowSessionPicker(true);
    }
  };
  
  const handleSessionRegistered = () => {
    // Session registration is handled by the modal
    // The parent component will get updated through the registrations hook
    setShowSessionPicker(false);
  };
  
  const handleSessionAttended = (sessionId) => {
    // Called when user confirms attendance
    if (onComplete) {
      onComplete(item.id, {
        sessionId,
        attendedAt: new Date().toISOString(),
        weekNumber
      });
    }
    setShowSessionPicker(false);
  };

  return (
    <>
      <div 
        onClick={handleItemClick}
        className={`
          group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer
          ${isCompleted 
            ? 'bg-green-50 border-green-200' 
            : isCarriedOver 
              ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' 
              : 'bg-purple-50 border-purple-100 hover:bg-purple-100 hover:border-purple-300'
          }
        `}
      >
        {/* Status Icon / Checkbox */}
        <div
          className={`
            flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            ${isCompleted 
              ? 'bg-green-500 border-green-500' 
              : registrationStatus === 'registered'
                ? 'bg-purple-500 border-purple-500'
                : 'border-purple-300 group-hover:border-purple-400'
            }
          `}
        >
          {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
          {!isCompleted && registrationStatus === 'registered' && (
            <Calendar className="w-3 h-3 text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className={`text-sm font-bold ${isCompleted ? 'text-green-700 line-through' : 'text-slate-700'}`}>
              {label}
            </p>
            
            {/* Required Badge */}
            {item.required !== false && !item.optional && !isCarriedOver && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Required
              </span>
            )}
            
            {/* Carried Over Badge */}
            {isCarriedOver && (
              <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                Carried {carryCount > 1 ? `(${carryCount}x)` : ''}
              </span>
            )}
            
            {/* Last Chance Warning */}
            {carryCount >= 2 && (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                Last Chance
              </span>
            )}
            
            {/* Registered Badge */}
            {registrationStatus === 'registered' && !isCompleted && (
              <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {formatSessionDate(sessionDate)}
              </span>
            )}
          </div>
          
          {/* Meta Info */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Icon className="w-3 h-3" />
            <span className="capitalize">{(item.type || 'coaching').replace(/_/g, ' ').toLowerCase()}</span>
            {item.estimatedTime && (
              <>
                <span>•</span>
                <span>{item.estimatedTime}</span>
              </>
            )}
            {skillArray.length > 0 && (
              <>
                <span>•</span>
                <span className="text-purple-600">{skillArray.join(', ')}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Button */}
        {!isCompleted && (
          <div className="flex items-center">
            <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              {registrationStatus === 'registered' ? (
                <>View Session</>
              ) : (
                <>Pick Session</>
              )}
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        )}
      </div>

      {/* Session Picker Modal */}
      {showSessionPicker && (
        <SessionPickerModal
          isOpen={showSessionPicker}
          onClose={() => setShowSessionPicker(false)}
          coachingItem={item}
          currentRegistration={registration}
          onRegister={handleSessionRegistered}
          onAttended={handleSessionAttended}
        />
      )}
    </>
  );
};

export default CoachingActionItem;
