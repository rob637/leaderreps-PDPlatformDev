import React, { useState, useEffect } from 'react';
import { Bug, CheckCircle, AlertCircle, Loader, X, Image as ImageIcon } from 'lucide-react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalTitle, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Textarea 
} from '../ui';
import { useAppServices } from '../../services/useAppServices.jsx';
import bugReportService from '../../services/bugReportService.js';
import ScreenshotAnnotator from './ScreenshotAnnotator.jsx';

const BugReportModal = ({ isOpen, onClose, currentScreen, screenshotDataUrl, screenshotAttempted }) => {
  const { db, user, developmentPlanData } = useAppServices();
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [annotatedScreenshot, setAnnotatedScreenshot] = useState(null);

  // Reset "include screenshot" toggle each time a new screenshot is provided
  useEffect(() => {
    if (isOpen) {
      setIncludeScreenshot(Boolean(screenshotDataUrl));
      setAnnotatedScreenshot(screenshotDataUrl || null);
    }
  }, [isOpen, screenshotDataUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Collect system info
      const systemInfo = {
        screen: currentScreen,
        cohortId: developmentPlanData?.cohortId || 'unknown',
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: new Date().toISOString(),
      };

      await bugReportService.submitReport(db, user?.uid, {
        description,
        steps,
        severity: 'medium', // Default
        category: 'user_report',
        screenshotDataUrl: includeScreenshot
          ? (annotatedScreenshot || screenshotDataUrl)
          : null,
      }, systemInfo, {
        email: user?.email,
        displayName: user?.displayName
      });

      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit bug report:', err);
      setError('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setDescription('');
    setSteps('');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      {!isSuccess ? (
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-corporate-teal" />
              <ModalTitle>Report an Issue</ModalTitle>
            </div>
          </ModalHeader>
          
          <ModalBody className="py-4 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                What happened? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue you encountered..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal resize-none h-32 text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Steps to reproduce (optional)
              </label>
              <textarea
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="1. Go to page X&#10;2. Click button Y&#10;3. See error..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal resize-none h-24 text-sm"
              />
            </div>

            {screenshotAttempted && !screenshotDataUrl && (
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 p-3 rounded-lg text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  We couldn’t auto-capture a screenshot of this page. Your report will still be sent — please describe what you saw.
                </span>
              </div>
            )}

            {screenshotDataUrl && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    Screenshot (draw to highlight or redact)
                  </label>
                  {includeScreenshot && (
                    <button
                      type="button"
                      onClick={() => setIncludeScreenshot(false)}
                      className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1"
                      aria-label="Remove screenshot"
                    >
                      <X className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>
                {includeScreenshot ? (
                  <ScreenshotAnnotator
                    src={screenshotDataUrl}
                    onChange={setAnnotatedScreenshot}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIncludeScreenshot(true)}
                    className="w-full text-xs text-corporate-teal hover:underline text-left px-2 py-1"
                  >
                    Screenshot removed — click to include it again
                  </button>
                )}
              </div>
            )}
            
            <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg text-xs text-slate-500 dark:text-slate-400">
              <p>System info will be automatically included: Browser, OS, Screen Resolution, Current Page ({currentScreen}).</p>
            </div>
          </ModalBody>

          <ModalFooter className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!description.trim() || isSubmitting}
              className="bg-corporate-teal hover:bg-corporate-teal/90 text-white min-w-[120px]"
            >
              {isSubmitting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                'Submit Report'
              )}
            </Button>
          </ModalFooter>
        </form>
      ) : (
        <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-corporate-navy dark:text-white">Request Received</h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-xs text-sm">
            Thank you for helping us improve the platform. We'll take a look at this right away.
          </p>
          <Button 
            onClick={handleClose}
            className="mt-4 bg-corporate-navy text-white hover:bg-corporate-navy/90"
          >
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default BugReportModal;
