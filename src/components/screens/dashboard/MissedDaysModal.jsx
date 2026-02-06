import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  Circle, 
  Calendar, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '../../ui/Modal';
import { Button } from '../../ui/Button';

export const MissedDaysModal = ({ 
  isOpen, 
  onClose, 
  missedDays = [], 
  missedWeeks = [],
  onToggleAction 
}) => {
  const [expandedDay, setExpandedDay] = useState(missedDays[0]?.id || null);

  if (!isOpen) return null;

  const handleToggleDay = (dayId) => {
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };
  
  // Use missedWeeks for count, fall back to deriving from missedDays
  const weekCount = missedWeeks.length > 0 
    ? missedWeeks.length 
    : [...new Set(missedDays.map(d => d.weekNumber).filter(Boolean))].length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-full text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <ModalTitle>Catch Up Plan</ModalTitle>
            <p className="text-sm text-slate-500">
              You have {weekCount} missed {weekCount === 1 ? 'week' : 'weeks'}. Complete key activities to get back on track.
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="max-h-[60vh] overflow-y-auto p-0">
        <div className="divide-y divide-slate-100">
          {missedDays.map((day) => {
            const isExpanded = expandedDay === day.id;
            const completedCount = (day.userProgress?.itemsCompleted || []).length;
            const totalActions = (day.actions || []).length;
            const isFullyComplete = totalActions > 0 && completedCount >= totalActions;

            return (
              <div key={day.id} className="bg-white">
                {/* Day Header */}
                <div 
                  onClick={() => handleToggleDay(day.id)}
                  className={`
                    w-full flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors
                    ${isExpanded ? 'bg-slate-50' : ''}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm
                      ${isFullyComplete ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}
                    `}>
                      {isFullyComplete ? <CheckCircle className="w-5 h-5" /> : `Day ${day.dayNumber}`}
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800">{day.title || `Day ${day.dayNumber}`}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{day.focus || 'No focus defined'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-slate-400">
                      {completedCount}/{totalActions} Done
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Day Content (Actions) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 bg-slate-50 border-t border-slate-100">
                    <div className="space-y-2 mt-3">
                      {(day.actions || []).length === 0 && (
                        <p className="text-xs text-slate-400 italic pl-14">No actions required for this day.</p>
                      )}
                      
                      {(day.actions || []).map((action) => {
                        const isCompleted = (day.userProgress?.itemsCompleted || []).includes(action.id);
                        
                        return (
                          <div 
                            key={action.id}
                            onClick={() => onToggleAction(day.id, action.id, !isCompleted)}
                            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-corporate-teal transition-all ml-14"
                          >
                            <div className={`
                              w-5 h-5 rounded-full flex items-center justify-center border transition-colors
                              ${isCompleted 
                                ? 'bg-corporate-teal border-corporate-teal text-white' 
                                : 'bg-white border-slate-300 text-transparent hover:border-corporate-teal'}
                            `}>
                              <CheckCircle className="w-3.5 h-3.5" />
                            </div>
                            <span className={`text-sm ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                              {action.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};
