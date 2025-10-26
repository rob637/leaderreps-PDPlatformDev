import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { ChevronsLeft, AlertTriangle, Save, Lock, Cpu, RotateCcw } from 'lucide-react';

const ADMIN_PASSWORD = '7777';

const JSONEditor = ({ label, data, setData, isSaving, setModified }) => {
  const safeData = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const cleanText = useMemo(() => {
    try { return JSON.stringify(safeData, null, 2); } catch { return '{}'; }
  }, [safeData]);

  const [jsonText, setJsonText] = useState(cleanText);
  const [isError, setIsError] = useState(false);
  const userHasTypedRef = useRef(false);

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

// Helper to flatten reading catalog doc {Category: [items]} -> array rows
function flattenReadingCatalog(raw) {
  if (!raw || typeof raw !== 'object') return [];
  const skip = new Set(['_meta', 'catalog_data']);
  const rows = [];
  for (const [category, list] of Object.entries(raw)) {
    if (skip.has(category)) continue;
    if (!Array.isArray(list)) continue;
    for (const it of list) {
      rows.push({
        category,
        id: it.id || `${category}-${it.title || 'untitled'}`,
        title: it.title || '',
        author: it.author || '',
        duration: it.duration ?? '',
        complexity: it.complexity || '',
        focus: it.focus || '',
        theme: it.theme || '',
      });
    }
  }
  return rows;
}

export default function AdminDataMaintenance() {
  const services = useAppServices();

  const {
    GLOBAL_SETTINGS,
    LEADERSHIP_TIERS,
    COMMITMENT_BANK,
    TARGET_REP_CATALOG,
    VIDEO_CATALOG,
    LEADERSHIP_DOMAINS,

    // these may or may not include category arrays depending on hook implementation
    READING_CATALOG_SERVICE,
    RESOURCE_LIBRARY,

    writeConfigDoc,
    writeReadingCatalogDoc,
    reloadMetadata,

    isSavingConfig,
    isSavingCatalog,
  } = services || {};

  // Direct live read of reading_catalog to guarantee visibility in UI tables
  const [readingRaw, setReadingRaw] = useState(null);
  useEffect(() => {
    const db = getFirestore();
    const ref = doc(db, 'metadata', 'reading_catalog');
    const unsub = onSnapshot(ref, (snap) => {
      setReadingRaw(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, []);

  const readingRows = useMemo(() => flattenReadingCatalog(readingRaw), [readingRaw]);

  // Local editors
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

  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');

  const handleSaveConfig = async () => {
    await writeConfigDoc?.(configDraft);
    await reloadMetadata?.();
    setModifiedConfig(false);
  };

  const handleSaveCatalog = async () => {
    await writeReadingCatalogDoc?.(catalogDraft);
    await reloadMetadata?.();
    setModifiedCatalog(false);
  };

  const metadataReady =
    !!(GLOBAL_SETTINGS || LEADERSHIP_TIERS || COMMITMENT_BANK || TARGET_REP_CATALOG || VIDEO_CATALOG || LEADERSHIP_DOMAINS);
  const catalogReady = !!(READING_CATALOG_SERVICE || RESOURCE_LIBRARY || readingRows.length);

  if (!authed) {
    return (
      <div className="max-w-lg mx-auto mt-20 p-6 border rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={18} className="text-gray-600" />
          <h2 className="text-lg font-semibold">Admin Access</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">Enter the admin PIN to edit platform metadata and reading catalog.</p>
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
        {pin && pin !== ADMIN_PASSWORD && <p className="text-xs text-red-600 mt-2">Incorrect PIN.</p>}
      </div>
    );
  }

  if (!metadataReady && !catalogReady) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-6 border rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Cpu size={18} className="text-gray-600" />
          <h2 className="text-lg font-semibold">Loading admin data…</h2>
        </div>
        <p className="text-sm text-gray-600">Fetching configuration and reading catalog from Firestore.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
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

        {/* Quick preview to prove data presence */}
        <div className="mt-2 text-xs text-gray-600">
          <div>Preview: TIERS = {LEADERSHIP_TIERS ? Object.keys(LEADERSHIP_TIERS).length : 0}</div>
          <div>Preview: QUICK_CHALLENGE_CATALOG = {Array.isArray(services?.QUICK_CHALLENGE_CATALOG) ? services.QUICK_CHALLENGE_CATALOG.length : 0}</div>
        </div>
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

        {/* LIVE TABLE PREVIEW from Firestore (guaranteed) */}
        <div className="mt-6">
          <h3 className="text-base font-medium mb-2">Live Catalog Preview (from Firestore)</h3>
          <div className="text-xs text-gray-600 mb-2">
            Rows: {readingRows.length} (skips <code>_meta</code> and <code>catalog_data</code>)
          </div>
          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Author</th>
                  <th className="text-left p-2">Duration</th>
                  <th className="text-left p-2">Complexity</th>
                </tr>
              </thead>
              <tbody>
                {readingRows.slice(0, 20).map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.category}</td>
                    <td className="p-2">{r.title}</td>
                    <td className="p-2">{r.author}</td>
                    <td className="p-2">{r.duration}</td>
                    <td className="p-2">{r.complexity}</td>
                  </tr>
                ))}
                {readingRows.length === 0 && (
                  <tr>
                    <td className="p-3 text-gray-500" colSpan={5}>No rows found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">Showing first 20 for preview.</p>
        </div>
      </section>
    </div>
  );
}
