// src/providers/UIVersionProvider.jsx
// Side-by-side UI version toggle. Lets users (and your boss) preview the
// next-generation "v2" surface treatment alongside the existing classic
// (v1) UI. Applies a `ui-v2` class to <html> so Tailwind's `ui-v2:` variant
// (registered via tailwind.config.cjs) can scope new styles without touching
// any existing utility class.
//
// Persistence: localStorage key `leaderreps-ui-version` (light by default).
// URL override: `?ui=v2` or `?ui=v1` — useful for sharing demo links.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

const STORAGE_KEY = 'leaderreps-ui-version';
const VERSIONS = { CLASSIC: 'v1', NEXT: 'v2' };

const UIVersionContext = createContext({
  uiVersion: VERSIONS.CLASSIC,
  isV2: false,
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

const readStoredVersion = () => {
  if (typeof window === 'undefined') return VERSIONS.CLASSIC;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'v2' || stored === 'v1') return stored;
  } catch {
    // ignore
  }
  return VERSIONS.CLASSIC;
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
  const [uiVersion, setVersionState] = useState(() => {
    const override = readUrlOverride();
    return override || readStoredVersion();
  });

  // Apply class on mount + whenever version changes
  useEffect(() => {
    applyUIVersion(uiVersion);
  }, [uiVersion]);

  const setUIVersion = useCallback((next) => {
    const normalized = next === VERSIONS.NEXT ? VERSIONS.NEXT : VERSIONS.CLASSIC;
    setVersionState(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // ignore
    }
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
