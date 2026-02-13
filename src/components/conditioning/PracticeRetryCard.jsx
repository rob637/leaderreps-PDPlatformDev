// src/components/conditioning/PracticeRetryCard.jsx
// Phase 2: Practice Retry Flow for dimension improvement

import React, { useState } from 'react';
import conditioningService from '../../services/conditioningService.js';
import { Card, Button } from '../ui';
import { 
  RefreshCw, CheckCircle, Target, ChevronRight, 
  MessageSquare, Handshake, Lightbulb, AlertCircle
} from 'lucide-react';

// Dimension icons - use string keys to avoid module initialization order issues
const DIMENSION_ICONS = {
  specific_language: MessageSquare,
  clear_request: Target,
  named_commitment: Handshake,
  reflection: Lightbulb
};

const DIMENSION_LABELS = {
  specific_language: 'Specific Language',
  clear_request: 'Clear Request',
  named_commitment: 'Named Commitment',
  reflection: 'Reflection'
};

// ============================================
// PRACTICE FORM
// ============================================
const PracticeForm = ({ retry, onComplete, onCancel }) => {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const prompt = conditioningService.getPracticePrompt(retry.dimension);
  const DimensionIcon = DIMENSION_ICONS[retry.dimension] || Target;
  
  const handleSubmit = async () => {
    if (!response.trim()) {
      setError('Please enter your practice response');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await conditioningService.completePracticeRetry(retry.db, retry.userId, retry.id, response);
      onComplete?.();
    } catch (err) {
      console.error('Error completing practice:', err);
      setError('Failed to submit practice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="border-l-4 border-l-corporate-navy">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-corporate-navy/10 rounded-full">
            <RefreshCw className="w-5 h-5 text-corporate-navy" />
          </div>
          <div>
            <h4 className="font-bold text-corporate-navy">Practice Retry</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Improve your {DIMENSION_LABELS[retry.dimension]}
            </p>
          </div>
        </div>
        
        {/* Dimension Badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-4">
          <DimensionIcon className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">
            {DIMENSION_LABELS[retry.dimension]}
          </span>
        </div>
        
        {/* Practice Prompt */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">Your Practice Challenge:</p>
          <p className="text-corporate-navy italic bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            "{prompt}"
          </p>
        </div>
        
        {/* Original Context */}
        {retry.context?.originalResponse && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Your original response:</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded border-l-2 border-gray-300 dark:border-gray-600">
              {retry.context.originalResponse.substring(0, 150)}...
            </p>
          </div>
        )}
        
        {/* Practice Response */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Your Improved Response
          </label>
          <textarea
            placeholder="Write your improved response here..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={4}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-corporate-navy focus:border-corporate-navy"
          />
        </div>
        
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Skip for Now
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !response.trim()}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Practice
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ============================================
// PENDING RETRIES LIST
// ============================================
const PendingRetriesList = ({ retries, onStartPractice }) => {
  if (!retries?.length) return null;
  
  return (
    <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-5 h-5 text-amber-600" />
          <h4 className="font-bold text-amber-800">Practice Available</h4>
          <span className="ml-auto px-2 py-0.5 bg-amber-200 rounded-full text-xs font-medium text-amber-800">
            {retries.length}
          </span>
        </div>
        
        <p className="text-sm text-amber-700 mb-3">
          Complete these practice exercises to improve your leadership skills.
        </p>
        
        <div className="space-y-2">
          {retries.map((retry) => {
            const DimensionIcon = DIMENSION_ICONS[retry.dimension] || Target;
            return (
              <button
                key={retry.id}
                onClick={() => onStartPractice(retry)}
                className="w-full flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800 hover:border-amber-400 transition-colors text-left"
              >
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <DimensionIcon className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-corporate-navy">
                    {DIMENSION_LABELS[retry.dimension]}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    From: {retry.repType}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

// ============================================
// MAIN EXPORT
// ============================================
export { PracticeForm, PendingRetriesList };

const PracticeRetryCard = ({ retries, onComplete }) => {
  const [activePractice, setActivePractice] = useState(null);
  
  if (activePractice) {
    return (
      <PracticeForm
        retry={activePractice}
        onComplete={() => {
          setActivePractice(null);
          onComplete?.();
        }}
        onCancel={() => setActivePractice(null)}
      />
    );
  }
  
  return (
    <PendingRetriesList
      retries={retries}
      onStartPractice={setActivePractice}
    />
  );
};

export default PracticeRetryCard;
