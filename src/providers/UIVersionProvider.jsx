// src/providers/UIVersionProvider.jsx
// Locks the app to the "Next" (v2) UI treatment. The Classic (v1) preview
// toggle was retired May 2026 per product direction — Next is the chosen
// surface. The `?ui=v1` URL override is preserved as an emergency kill
// switch for admins/QA if a v2-only regression appears.
//
// History: This file used to expose a user-facing toggle (persisted in
// localStorage under `leaderreps-ui-version`). The toggle UI was removed
// from MySettingsWidget; we now ignore any stored value so all users land
// on v2 by default.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

const VERSIONS = { CLASSIC: 'v1', NEXT: 'v2' };

const UIVersionContext = createContext({
  uiVersion: VERSIONS.NEXT,
  isV2: true,
  setUIVersion: () => {},
  toggleUIVersion: () => {},
});

const readUrlOverride = () => {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const ui = params.get('ui');
    if (ui === 'v2' || ui === 'v1') return ui;
  } catch {
    // ignore
  }
  return null;
};

const applyUIVersion = (version) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (version === VERSIONS.NEXT) {
    root.classList.add('ui-v2');
  } else {
    root.classList.remove('ui-v2');
  }
};

export const UIVersionProvider = ({ children }) => {
  // Default is now NEXT. Only the URL override can flip back to CLASSIC.
  const [uiVersion, setVersionState] = useState(() => {
    const override = readUrlOverride();
    return override || VERSIONS.NEXT;
  });

  // Apply class on mount + whenever version changes
  useEffect(() => {
    applyUIVersion(uiVersion);
  }, [uiVersion]);

  const setUIVersion = useCallback((next) => {
    const normalized = next === VERSIONS.NEXT ? VERSIONS.NEXT : VERSIONS.CLASSIC;
    setVersionState(normalized);
  }, []);

  const toggleUIVersion = useCallback(() => {
    setUIVersion(uiVersion === VERSIONS.NEXT ? VERSIONS.CLASSIC : VERSIONS.NEXT);
  }, [uiVersion, setUIVersion]);

  const value = useMemo(
    () => ({
      uiVersion,
      isV2: uiVersion === VERSIONS.NEXT,
      setUIVersion,
      toggleUIVersion,
    }),
    [uiVersion, setUIVersion, toggleUIVersion],
  );

  return (
    <UIVersionContext.Provider value={value}>
      {children}
    </UIVersionContext.Provider>
  );
};

export const useUIVersion = () => useContext(UIVersionContext);

export const UI_VERSIONS = VERSIONS;
