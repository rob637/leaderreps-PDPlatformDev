/**
 * LiveRegion - Announces dynamic content to screen readers
 */
import React, { useState, useEffect, useCallback } from 'react';

// Global message queue for announcements
let messageQueue = [];
let setMessageExternal = null;

// External function to trigger announcements from anywhere
export const announce = (message, priority = 'polite') => {
  if (setMessageExternal) {
    setMessageExternal({ message, priority });
  } else {
    messageQueue.push({ message, priority });
  }
};

// Convenience methods
export const announcePolite = (message) => announce(message, 'polite');
export const announceAssertive = (message) => announce(message, 'assertive');

const LiveRegion = ({
  politeness = 'polite', // 'polite' | 'assertive' | 'off'
  atomic = true,
  relevant = 'additions text',
  clearDelay = 3000,
  className = '',
}) => {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  // Handle external messages
  const handleMessage = useCallback(({ message, priority }) => {
    if (priority === 'assertive') {
      setAssertiveMessage(message);
      setTimeout(() => setAssertiveMessage(''), clearDelay);
    } else {
      setPoliteMessage(message);
      setTimeout(() => setPoliteMessage(''), clearDelay);
    }
  }, [clearDelay]);

  // Setup external message handler
  useEffect(() => {
    setMessageExternal = handleMessage;

    // Process queued messages
    messageQueue.forEach(handleMessage);
    messageQueue = [];

    return () => {
      setMessageExternal = null;
    };
  }, [handleMessage]);

  // Visually hidden styles
  const hiddenStyles = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  };

  return (
    <div className={className} style={hiddenStyles}>
      {/* Polite region - waits for user to be idle */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic={atomic}
        aria-relevant={relevant}
      >
        {politeMessage}
      </div>

      {/* Assertive region - interrupts immediately */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic={atomic}
        aria-relevant={relevant}
      >
        {assertiveMessage}
      </div>
    </div>
  );
};

/**
 * Status component for displaying loading states
 */
export const StatusMessage = ({ 
  isLoading, 
  loadingMessage = 'Loading...', 
  successMessage = 'Content loaded',
  errorMessage,
  error,
}) => {
  const [announced, setAnnounced] = useState(false);

  useEffect(() => {
    if (isLoading && !announced) {
      announce(loadingMessage, 'polite');
      setAnnounced(true);
    } else if (!isLoading && announced) {
      if (error && errorMessage) {
        announce(errorMessage, 'assertive');
      } else if (successMessage) {
        announce(successMessage, 'polite');
      }
      setAnnounced(false);
    }
  }, [isLoading, announced, loadingMessage, successMessage, errorMessage, error]);

  return null;
};

/**
 * Route change announcer for SPA navigation
 */
export const RouteAnnouncer = ({ title, delay = 100 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      announce(`Navigated to ${title}`, 'polite');
    }, delay);

    return () => clearTimeout(timer);
  }, [title, delay]);

  return null;
};

export default LiveRegion;
