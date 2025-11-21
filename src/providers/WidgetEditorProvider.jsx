import React, { createContext, useContext, useState, useCallback } from 'react';

const WidgetEditorContext = createContext();

export const useWidgetEditor = () => {
  const context = useContext(WidgetEditorContext);
  if (!context) {
    throw new Error('useWidgetEditor must be used within a WidgetEditorProvider');
  }
  return context;
};

export const WidgetEditorProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editorState, setEditorState] = useState({
    widgetId: null,
    widgetName: '',
    scope: {},
    initialCode: ''
  });
  const [isEditMode, setIsEditMode] = useState(false); // Global toggle to enable "Click to Edit" on widgets

  const openEditor = useCallback(({ widgetId, widgetName, scope, initialCode }) => {
    setEditorState({
      widgetId,
      widgetName: widgetName || widgetId,
      scope: scope || {},
      initialCode: initialCode || ''
    });
    setIsOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsOpen(false);
    // We don't clear state immediately to prevent flickering during close animation if we had one
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  return (
    <WidgetEditorContext.Provider value={{
      isOpen,
      editorState,
      openEditor,
      closeEditor,
      isEditMode,
      toggleEditMode
    }}>
      {children}
    </WidgetEditorContext.Provider>
  );
};
