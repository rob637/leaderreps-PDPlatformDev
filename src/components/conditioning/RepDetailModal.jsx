// src/components/conditioning/RepDetailModal.jsx
// View details of a committed rep
// Updated to match Capture Evidence overview format

import React, { useMemo } from 'react';
import { Button } from '../ui';
import { User, Calendar, FileText, MessageSquare, Target, Info } from 'lucide-react';
import { getRepTypeV2 } from '../../services/repTaxonomy.js';
import { formatDisplayDate } from '../../services/dateUtils.js';
import ConditioningModal from './ConditioningModal';

// ============================================
// MAIN MODAL COMPONENT
// ============================================
const RepDetailModal = ({ isOpen, onClose, rep }) => {
  if (!isOpen || !rep) return null;
  
  const repTypeConfig = useMemo(() => getRepTypeV2(rep?.repType), [rep?.repType]);
  
  // Get situation text
  const situationText = useMemo(() => {
    if (typeof rep.situation === 'object') {
      return rep.situation.customContext || rep.situation.selected || 'Not specified';
    }
    return rep.situation || rep.context || 'Not specified';
  }, [rep]);
  
  return (
    <ConditioningModal
      isOpen={isOpen}
      onClose={onClose}
      title="Rep Details"
      icon={Info}
    >
      <div className="p-4 space-y-4">
        {/* Overview Cards - matching Capture Evidence format */}
        <div className="space-y-3">
          {/* Rep Type */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <Target className="w-5 h-5 text-corporate-teal mt-0.5" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Real Rep Type</div>
              <div className="font-medium text-corporate-navy dark:text-white">
                {repTypeConfig?.label || rep?.repType || 'Unknown'}
              </div>
            </div>
          </div>

          {/* Who */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <User className="w-5 h-5 text-corporate-teal mt-0.5" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Who was involved</div>
              <div className="font-medium text-corporate-navy dark:text-white">
                {rep?.person || 'Not specified'}
              </div>
            </div>
          </div>

          {/* Situation */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <MessageSquare className="w-5 h-5 text-corporate-teal mt-0.5" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Situation</div>
              <div className="font-medium text-corporate-navy dark:text-white">
                {situationText}
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <Calendar className="w-5 h-5 text-corporate-teal mt-0.5" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Due</div>
              <div className="font-medium text-corporate-navy dark:text-white">
                {formatDisplayDate(rep?.deadline) || 'Not specified'}
              </div>
            </div>
          </div>
        </div>

        {/* Notes (if present) */}
        {rep.notes && (
          <div className="flex items-start gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <FileText className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Notes</div>
              <div className="text-sm text-corporate-navy dark:text-white">
                {rep.notes}
              </div>
            </div>
          </div>
        )}
        
        {/* Close Button */}
        <Button
          onClick={onClose}
          className="w-full bg-corporate-teal hover:bg-corporate-teal/90 text-white mt-4"
        >
          Close
        </Button>
      </div>
    </ConditioningModal>
  );
};

export default RepDetailModal;
