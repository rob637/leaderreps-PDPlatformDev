// src/components/screens/AdminDataMaintenance.jsx
// Admin Data Maintenance — reads/writes Firestore metadata via useAppServices

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { ChevronsLeft, AlertTriangle, Save, Lock, Cpu, RotateCcw } from 'lucide-react';

// Simple admin PIN gate (you can swap to env/config)
const ADMIN_PASSWORD = '7777';

const JSONEditor = ({ label, data, setData, isSaving, setModified }) => {
  // Always stringify an object — avoid crashing on undefined/null/array
  const safeData = data && typeof data === 'object' && !Array.isArray(data) ? data : {};

  // The “source of truth” text derived from clean props
  const cleanText = useMemo(() => {
    try {
      return JSON.stringify(safeData, null, 2);
    } catch {
      return '{}';
    }
  }, [safeData]);

  // Local editor state
  const [jsonText, setJsonText] = useState(cleanText);
  const [isError, setIsError] = useState(false);
  const userHasTypedRef = useRef(false);

  // Keep editor in sync with new incoming data until the user types
  useEffect(() => {
    if (!userHasTypedRef.current) {
      setJsonText(cleanText);
      setIsError(false);
    }
  }, [cleanText]);

  const handleChange = (e) => {
    const t = e.target.value;
    setJsonText(t);
    userHasTypedRef.current = true;
    setModified?.(true);

    try {
      const parsed = JSON.parse(t);
      setData(parsed);
      setIsError(false);
    } catch {
      setIsError(true);
    }
  };

  const handleReset = () => {
    setJsonText(cleanText);
    setData(safeData);
    setIsError(false);
    setModified?.(false);
    userHasTypedRef.current = false;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
          {isSaving ? (
            <span className="text-xs text-gray-500">Saving…</span>
          ) : isError ? (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle size={14} /> Invalid JSON
            </span>
          ) : (
            <span className="text-xs text-gray-500">OK</span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border"
            title="Reset editor to last clean data"
          >
            <span className="inline-flex items-center gap-1">
              <RotateCcw size={14} /> Reset
            </span>
          </button>
        </div>
      </div>

      <textarea
        className={`w-full h-72 font-mono text-sm p-3 border rounded outline-none ${
          isError ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`}
        value={jsonText}
        onChange={handleChange}
        spellCheck={false}
      />
    </div>
  );
};

export default function AdminDataMaintenance() {
  // Pull metadata + actions from the shared service hook
  const services = useAppServices();

  // Readables (use whatever your hook exposes; these names match your logs)
  const {
    GLOBAL_SETTINGS,
    LEADERSHIP_TIERS,
    COMMITMENT_BANK,
    TARGET_REP_CATALOG,
    VIDEO_CATALOG,
    LEADERSHIP_DOMAINS,

    READING_CATALOG_SERVICE,
    RESOURCE_LIBRARY,

    // Actions
    writeConfigDoc,
    writeReadingCatalogDoc,
    reloadMetadata,

    // Saving flags (optional, used to flip button states/spinners)
    isSavingConfig,
    isSavingCatalog,
  } = services || {};

  // If your hook exposes a ready/loading flag, you can use it here
  // Otherwise we infer “ready” if at least one of the expected keys exists.
  const metadataReady =
    !!(GLOBAL_SETTINGS || LEADERSHIP_TIERS || COMMITMENT_BANK || TARGET_REP_CATALOG || VIDEO_CATALOG || LEADERSHIP_DOMAINS);

  const catalogReady =
    !!(READING_CATALOG_SERVICE || RESOURCE_LIBRARY);

  // Local editors (mirrors of the live metadata)
  const [configDraft, setConfigDraft] = useState({
    GLOBAL_SETTINGS,
    LEADERSHIP_TIERS,
    COMMITMENT_BANK,
    TARGET_REP_CATALOG,
    VIDEO_CATALOG,
    LEADERSHIP_DOMAINS,
  });

  const [catalogDraft, setCatalogDraft] = useState({
    READING_CATALOG_SERVICE,
    RESOURCE_LIBRARY,
  });

  const [modifiedConfig, setModifiedConfig] = useState(false);
  const [modifiedCatalog, setModifiedCatalog] = useState(false);

  // Keep local editors in sync when live metadata changes
  useEffect(() => {
    setConfigDraft({
      GLOBAL_SETTINGS,
      LEADERSHIP_TIERS,
      COMMITMENT_BANK,
      TARGET_REP_CATALOG,
      VIDEO_CATALOG,
      LEADERSHIP_DOMAINS,
    });
    setModifiedConfig(false);
  }, [
    GLOBAL_SETTINGS,
    LEADERSHIP_TIERS,
    COMMITMENT_BANK,
    TARGET_REP_CATALOG,
    VIDEO_CATALOG,
    LEADERSHIP_DOMAINS,
  ]);

  useEffect(() => {
    setCatalogDraft({
      READING_CATALOG_SERVICE,
      RESOURCE_LIBRARY,
    });
    setModifiedCatalog(false);
  }, [READING_CATALOG_SERVICE, RESOURCE_LIBRARY]);

  // Admin gate
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');

  const handleSaveConfig = async () => {
    // writeConfigDoc expects an object that matches the config doc schema
    await writeConfigDoc?.(configDraft);
    await reloadMetadata?.();
    setModifiedConfig(false);
  };

  const handleSaveCatalog = async () => {
    // writeReadingCatalogDoc expects an object that matches the catalog doc schema
    await writeReadingCatalogDoc?.(catalogDraft);
    await reloadMetadata?.();
    setModifiedCatalog(false);
  };

  if (!authed) {
    return (
      <div className="max-w-lg mx-auto mt-20 p-6 border rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={18} className="text-gray-600" />
          <h2 className="text-lg font-semibold">Admin Access</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Enter the admin PIN to edit platform metadata and reading catalog.
        </p>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-3"
          placeholder="Enter PIN"
        />
        <button
          className="px-4 py-2 rounded bg-black text-white hover:opacity-90"
          onClick={() => setAuthed(pin === ADMIN_PASSWORD)}
        >
          Unlock
        </button>
        {pin && pin !== ADMIN_PASSWORD && (
          <p className="text-xs text-red-600 mt-2">Incorrect PIN.</p>
        )}
      </div>
    );
  }

  // Gentle loader while metadata hydrates
  if (!metadataReady && !catalogReady) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-6 border rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Cpu size={18} className="text-gray-600" />
          <h2 className="text-lg font-semibold">Loading admin data…</h2>
        </div>
        <p className="text-sm text-gray-600">
          Fetching configuration and reading catalog from Firestore.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChevronsLeft size={18} className="text-gray-500" />
          <h1 className="text-xl font-semibold">Admin · Data Maintenance</h1>
        </div>
        <button
          className="px-3 py-1.5 rounded text-sm bg-gray-100 hover:bg-gray-200 border"
          onClick={() => reloadMetadata?.()}
          title="Re-fetch metadata from Firestore"
        >
          <span className="inline-flex items-center gap-1">
            <Cpu size={14} /> Reload
          </span>
        </button>
      </div>

      {/* CONFIG DOC */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Metadata · config</h2>
          <button
            className={`px-3 py-1.5 rounded text-sm text-white inline-flex items-center gap-1 ${
              modifiedConfig ? 'bg-black hover:opacity-90' : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={!modifiedConfig || isSavingConfig}
            onClick={handleSaveConfig}
            title={modifiedConfig ? 'Save config' : 'No changes to save'}
          >
            <Save size={14} /> Save
          </button>
        </div>

        <JSONEditor
          label="GLOBAL_SETTINGS, LEADERSHIP_TIERS, COMMITMENT_BANK, TARGET_REP_CATALOG, VIDEO_CATALOG, LEADERSHIP_DOMAINS"
          data={configDraft}
          setData={setConfigDraft}
          isSaving={!!isSavingConfig}
          setModified={setModifiedConfig}
        />
      </section>

      {/* READING CATALOG DOC */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Metadata · reading_catalog</h2>
          <button
            className={`px-3 py-1.5 rounded text-sm text-white inline-flex items-center gap-1 ${
              modifiedCatalog ? 'bg-black hover:opacity-90' : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={!modifiedCatalog || isSavingCatalog}
            onClick={handleSaveCatalog}
            title={modifiedCatalog ? 'Save reading catalog' : 'No changes to save'}
          >
            <Save size={14} /> Save
          </button>
        </div>

        <JSONEditor
          label="READING_CATALOG_SERVICE, RESOURCE_LIBRARY"
          data={catalogDraft}
          setData={setCatalogDraft}
          isSaving={!!isSavingCatalog}
          setModified={setModifiedCatalog}
        />
      </section>
    </div>
  );
}
