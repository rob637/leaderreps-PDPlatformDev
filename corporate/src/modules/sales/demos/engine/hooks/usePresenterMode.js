import { useState, useEffect, useCallback } from 'react';
import { presenterNotes, PRESENTER_MODE_SHORTCUT } from '../data/presenterNotes';

export const usePresenterMode = (currentStepId) => {
  const [isPresenterMode, setIsPresenterMode] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const currentNotes = presenterNotes[currentStepId] || null;

  const togglePresenterMode = useCallback(() => {
    setIsPresenterMode(prev => !prev);
  }, []);

  const togglePanel = useCallback(() => {
    setIsPanelCollapsed(prev => !prev);
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key.toLowerCase() === PRESENTER_MODE_SHORTCUT.key &&
        e.ctrlKey === PRESENTER_MODE_SHORTCUT.ctrl &&
        e.shiftKey === PRESENTER_MODE_SHORTCUT.shift
      ) {
        e.preventDefault();
        togglePresenterMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePresenterMode]);

  return {
    isPresenterMode,
    isPanelCollapsed,
    currentNotes,
    togglePresenterMode,
    togglePanel,
  };
};

export default usePresenterMode;
