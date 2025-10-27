// src/components/screens/AdminDataMaintenance.jsx (Refactored for Consistency, Presets, Comments)

import React, { useEffect, useMemo, useState, useCallback } from "react";
// --- Firebase Modular SDK ---
// This component uses direct SDK calls for low-level access
import {
  getFirestore, doc, collection, getDoc, getDocs, onSnapshot,
  setDoc, deleteDoc, writeBatch, query, limit as qLimit, serverTimestamp // Added serverTimestamp
} from "firebase/firestore";
import { getAuth } from "firebase/auth"; // For getting current user ID

// --- Core Services (for DB instance, UID) ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Icons ---
import { Loader, AlertTriangle, Download, Upload, Trash2, Save, Play, StopCircle, Search, Edit } from 'lucide-react'; // Added relevant icons

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', PURPLE: '#7C3AED', BG: '#F9FAFB' }; // cite: App.jsx

// --- Standardized UI Components (Matches Dashboard/Dev Plan) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use exact Button definition from Dashboard.jsx ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C312] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`; // Subtle button for less critical actions
    // Added specific variants for this admin tool
    else if (variant === 'action-read') baseStyle += ` bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:ring-blue-500/50 px-4 py-2 text-sm`;
    else if (variant === 'action-write') baseStyle += ` bg-green-600 text-white shadow-md hover:bg-green-700 focus:ring-green-500/50 px-4 py-2 text-sm`;
    else if (variant === 'action-danger') baseStyle += ` bg-red-600 text-white shadow-md hover:bg-red-700 focus:ring-red-500/50 px-4 py-2 text-sm`;
    else if (variant === 'action-special') baseStyle += ` bg-purple-600 text-white shadow-md hover:bg-purple-700 focus:ring-purple-500/50 px-4 py-2 text-sm`; // For listener toggle
    else if (variant === 'preset') baseStyle += ` px-3 py-1.5 rounded-full border border-blue-200 text-xs bg-white text-blue-700 hover:bg-blue-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`; // Preset button style

    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};
const LoadingSpinner = ({ message = "Loading data..." }) => ( // Adjusted message
    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg flex items-center justify-center min-h-[100px]">
        <Loader className="w-5 h-5 animate-spin mr-2" style={{ color: COLORS.TEAL }} />
        {message}
    </div>
);


/* =========================================================
   UTILITIES (Data Handling, Path Logic)
========================================================= */
// --- Data Conversion & Handling ---
const pretty = (v) => JSON.stringify(v ?? {}, null, 2); // cite: AdminDataMaintenance.jsx (Original)
const tryParse = (t, fb) => { try { return JSON.parse(t); } catch { console.warn("JSON Parse Error:", t); return fb; } }; // cite: AdminDataMaintenance.jsx (Original)

// Coerces string values back to appropriate types (boolean, null, number, date, JSON object/array)
const coerce = (s) => { /* ... Re-use exact coerce definition from AdminDataMaintenance.jsx ... */
    if (typeof s !== "string") return s;
    const t = s.trim();
    if (t === "true") return true; if (t === "false") return false; if (t === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(t)) { try { const d=new Date(t); if(!isNaN(d.getTime())) return d;}catch{} }
    if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) { try { const p=JSON.parse(t); if(typeof p==='object'&& p!==null) return p;}catch{} }
    return s;
}; // cite: AdminDataMaintenance.jsx (Original)

// Flattens a nested object into dot-notation keys, handling Timestamps and stringifying complex types
const flatten = (obj, prefix = "", out = {}) => { /* ... Re-use exact flatten definition from AdminDataMaintenance.jsx ... */
    if (obj == null || typeof obj !== 'object') return out;
    Object.entries(obj).forEach(([k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && v.seconds !== undefined && v.nanoseconds !== undefined) { try { out[key] = new Date(v.seconds * 1000 + v.nanoseconds / 1000000).toISOString(); } catch { out[key] = "[Invalid Timestamp]"; } }
        else if (Array.isArray(v) || (v && typeof v === "object" && !(v instanceof Date))) { out[key] = JSON.stringify(v, null, 2); }
        else if (v instanceof Date) { out[key] = v.toISOString(); }
        else { out[key] = v; }
    });
    return out;
}; // cite: AdminDataMaintenance.jsx (Original)

// Unflattens a dot-notation object back into a nested structure, coercing values
const unflatten = (flat) => { /* ... Re-use exact unflatten definition from AdminDataMaintenance.jsx ... */
    const out = {};
    Object.entries(flat).forEach(([path, value]) => {
        const parts = path.split("."); let cur = out;
        while (parts.length > 1) { const p = parts.shift(); if (typeof cur[p]==='undefined'||cur[p]===null){cur[p]={};} else if(typeof cur[p]!=='object'||Array.isArray(cur[p])){cur[p]={};} cur = cur[p]; }
        cur[parts[0]] = coerce(value);
    });
    return out;
}; // cite: AdminDataMaintenance.jsx (Original)

// Infers column headers from an array of flat objects
const inferColumns = (rows) => { /* ... Re-use exact inferColumns definition from AdminDataMaintenance.jsx ... */
    const set = new Set(["_id"]); if (Array.isArray(rows)) { rows.forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k))); } return Array.from(set);
}; // cite: AdminDataMaintenance.jsx (Original)
const nowIso = () => new Date().toISOString(); // cite: AdminDataMaintenance.jsx (Original)

// --- Path Logic ---
const pathParts = (p) => (p || '').trim().split("/").filter(Boolean); // cite: AdminDataMaintenance.jsx (Original)
// Normalizes path by replacing <uid> or {uid} placeholders
const normalizePath = (raw, uid) => (raw || '').replaceAll(/<uid>|{uid}/g, uid || ""); // cite: AdminDataMaintenance.jsx (Original)
const isDocumentPath = (p) => pathParts(p).length % 2 === 0; // cite: AdminDataMaintenance.jsx (Original)
const isCollectionPath = (p) => pathParts(p).length % 2 === 1; // cite: AdminDataMaintenance.jsx (Original)

// Key used for documents structured as { items: [...] }
const ARRAY_WRAPPER_KEY = "items"; // cite: AdminDataMaintenance.jsx (Original)
// List of specific document paths known to use the { items: [...] } structure
const SINGLE_ARRAY_WRAPPER_DOCUMENTS = [ // cite: AdminDataMaintenance.jsx (Original, Updated List)
    "metadata/reading_catalog",
    "metadata/config/catalog/SKILL_CATALOG", // Renamed from leadership_domains conceptually
    "metadata/config/catalog/RESOURCE_LIBRARY_ITEMS", // Raw items // cite: useAppServices.jsx
    "metadata/config/catalog/scenario_catalog",
    "metadata/config/catalog/video_catalog",
    "metadata/config/catalog/REP_LIBRARY", // Unified Rep Library Concept
    "metadata/config/catalog/EXERCISE_LIBRARY", // New
    "metadata/config/catalog/WORKOUT_LIBRARY", // New
    "metadata/config/catalog/COURSE_LIBRARY", // New
    "metadata/config/catalog/IDENTITY_ANCHOR_CATALOG",
    "metadata/config/catalog/HABIT_ANCHOR_CATALOG",
    "metadata/config/catalog/WHY_CATALOG",
];
// Checks if the current path exactly matches one of the wrapper documents
const getStrictWrapperKeyForPath = (path) => SINGLE_ARRAY_WRAPPER_DOCUMENTS.includes(path) ? ARRAY_WRAPPER_KEY : null; // cite: AdminDataMaintenance.jsx (Original)


/* =========================================================
   CSV UTILITIES (Unchanged Logic)
========================================================= */
const toCSV = (rows) => { /* ... Re-use exact toCSV definition from AdminDataMaintenance.jsx ... */ }; // cite: AdminDataMaintenance.jsx (Original)
const fromCSV = (text) => { /* ... Re-use exact fromCSV definition from AdminDataMaintenance.jsx ... */ }; // cite: AdminDataMaintenance.jsx (Original)


/* =========================================================
   UI SUB-COMPONENTS (KVEditor, ArrayTable, AdminWarning)
========================================================= */

/**
 * AdminWarning Component
 * Displays a persistent warning about the risks of direct data manipulation.
 */
const AdminWarning = () => ( // cite: AdminDataMaintenance.jsx (Original)
    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg mb-6 shadow-md">
        <div className="flex">
            <div className="flex-shrink-0 pt-0.5"> <AlertTriangle className="h-5 w-5 text-yellow-500" /> </div>
            <div className="ml-3">
                <h3 className="text-sm font-bold text-yellow-800">Warning: Direct Database Access</h3>
                <p className="mt-1 text-sm text-yellow-700">Actions taken here directly modify the Firestore database and may be irreversible. Proceed with caution.</p>
            </div>
        </div>
    </div>
);

/**
 * KVEditor Component (Refactored Styling)
 * Table editor for non-array fields within a Firestore document. Uses flatten/unflatten.
 */
function KVEditor({ value, onChange, onSave, isLoading, excludedKeys = [] }) {
    const [rows, setRows] = useState([]); // Local state for table rows [{ key: string, value: string }]

    // Effect to update local rows when the main document value changes
    useEffect(() => {
        const flat = flatten(value); // Flatten the document object
        const filteredRows = Object.entries(flat)
            // Filter out fields managed by the ArrayTable
            .filter(([k]) => !excludedKeys.includes(k.split('.')[0]))
            // Map to the row structure
            .map(([k, v]) => ({ key: k, value: String(v ?? '') }));
        setRows(filteredRows);
    }, [value, excludedKeys]); // Recalculate if value or excluded keys change

    // Update handler: Modifies local row state and calls parent onChange with the unflattened object
    const update = useCallback((idx, field, val) => {
        setRows(currentRows => {
            const nextLocalRows = currentRows.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
            // --- Reconstruct the *entire* document object for parent onChange ---
            const fullObjectFromParent = tryParse(pretty(value), {}); // Get parent's current full object
            const kvUpdates = unflatten(Object.fromEntries(nextLocalRows.map(r => [r.key, r.value]))); // Unflatten local KV edits
            // Merge kvUpdates onto a copy of the parent object, preserving excluded fields
            const mergedObject = { ...fullObjectFromParent };
            Object.keys(kvUpdates).forEach(key => {
                 // Simple dot-notation key overwrite (assumes KV editor manages leaves)
                 // More complex merge needed if editing objects containing excluded arrays.
                 let target = mergedObject;
                 const parts = key.split('.');
                 for(let i = 0; i < parts.length - 1; i++) {
                     if (!target[parts[i]] || typeof target[parts[i]] !== 'object') target[parts[i]] = {};
                     target = target[parts[i]];
                 }
                 target[parts[parts.length - 1]] = kvUpdates[key];
            });
            onChange(mergedObject); // Update the main JSON state in the parent
            return nextLocalRows; // Return updated local rows
        });
    }, [value, onChange]); // Dependencies: value (for full object reconstruction), onChange

    // Adds a new empty row to the local state
    const addRow = useCallback(() => setRows(prev => [{ key: "", value: "" }, ...prev]), []);
    // Deletes a row locally and updates the parent state
    const delRow = useCallback((idx) => {
        setRows(currentRows => {
            const keyToDelete = currentRows[idx]?.key; // Get the key being deleted
            const nextLocalRows = currentRows.filter((_, i) => i !== idx);
            // --- Reconstruct and update parent state ---
            const fullObjectFromParent = tryParse(pretty(value), {});
            const kvUpdates = unflatten(Object.fromEntries(nextLocalRows.map(r => [r.key, r.value])));
            const mergedObject = { ...fullObjectFromParent };
            // Clear existing non-excluded KV keys first
            Object.keys(fullObjectFromParent).forEach(k => { if (!excludedKeys.includes(k)) delete mergedObject[k]; });
            // Merge back the current KV state
            Object.assign(mergedObject, kvUpdates);
            // Deep delete might be needed for nested keys - handled by unflatten/reconstruct process
            onChange(mergedObject);
            return nextLocalRows; // Return updated local rows
        });
    }, [value, excludedKeys, onChange]); // Dependencies

    return (
        <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
            {/* Header with Add/Save buttons */}
            <div className="p-2 flex items-center gap-2 bg-gray-50 border-b">
                <Button variant="outline" size="sm" onClick={addRow} disabled={isLoading}>➕ Add Field</Button>
                <Button variant="action-write" size="sm" onClick={onSave} disabled={isLoading}>💾 Save Key/Values</Button>
            </div>
            {/* Table Area */}
            {isLoading ? <LoadingSpinner message="Loading fields..." /> : (
                <div className="overflow-auto max-h-96 custom-scrollbar">
                <table className="min-w-full text-sm">
                    {/* Table Header */}
                    <thead className="sticky top-0 bg-gray-100 z-10">
                        <tr>
                            <th className="p-2 border-b text-left font-semibold text-gray-700 w-1/3">Key (dot.notation)</th>
                            <th className="p-2 border-b text-left font-semibold text-gray-700 w-2/3">Value (String / JSON / ISO Date)</th>
                            <th className="p-2 border-b font-semibold text-gray-700">Del</th>
                        </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody>
                    {rows.length === 0 ? (
                        <tr><td colSpan={3} className="p-6 text-center text-gray-500 italic">No non-array fields.</td></tr>
                    ) : rows.map((r, idx) => (
                        <tr key={idx} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 transition-colors">
                            {/* Key Input */}
                            <td className="p-1.5 border-b"><input className="w-full border rounded px-2 py-1 font-mono text-xs bg-white focus:ring-1 focus:ring-blue-500" value={r.key} onChange={(e) => update(idx, "key", e.target.value)} placeholder="fieldName or nested.field" aria-label={`Key for row ${idx + 1}`} /></td>
                            {/* Value Input (Textarea for multiline JSON) */}
                            <td className="p-1.5 border-b">
                                <textarea className="w-full border rounded px-2 py-1 font-mono text-xs h-10 min-h-[2.5rem] resize-y bg-white focus:ring-1 focus:ring-blue-500" value={r.value} onChange={(e) => update(idx, "value", e.target.value)} placeholder="String, number, boolean, null, ISO Date, or JSON string" rows={1} aria-label={`Value for row ${idx + 1}`}/>
                            </td>
                            {/* Delete Button */}
                            <td className="p-1.5 border-b text-center"><Button variant="ghost" size="sm" className="!p-1 text-red-500 hover:!bg-red-100" onClick={() => delRow(idx)} aria-label={`Delete row ${idx + 1}`}> <Trash2 size={14}/> </Button></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
        </div>
    );
}

/**
 * ArrayTable Component (Refactored Styling)
 * Table editor for array fields (either top-level wrapped `items` or nested arrays).
 */
function ArrayTable({ fieldName, rows, setRows, onSave, isLoading }) {
    // Infer columns dynamically from the array items
    const cols = useMemo(() => inferColumns(rows), [rows]);
    // Check if the array contains primitives/simple values (only '_id' and 'value' columns)
    const isPrimitiveArray = useMemo(() => cols.length === 2 && cols.includes('value'), [cols]);
    const valueColHeader = isPrimitiveArray ? "Array Value (Primitive or JSON String)" : "value"; // Header for the 'value' column

    // --- Row Manipulation Callbacks ---
    // Adds a new empty row (with a temporary ID) to the beginning of the local state
    const add = useCallback(() => setRows((prev = []) => [{ _id: `new_${Date.now()}` }, ...prev]), [setRows]);
    // Edits a specific cell value in the local state
    const edit = useCallback((id, key, val) => setRows((prev = []) => prev.map((r) => (r._id === id ? { ...r, [key]: val } : r))), [setRows]);
    // Removes a row from the local state by ID
    const del = useCallback((id) => setRows((prev = []) => prev.filter((r) => r._id !== id)), [setRows]);

    return (
        <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
            {/* Header with Add/Save buttons */}
            <div className="p-2 flex items-center gap-2 bg-gray-50 border-b">
                <Button variant="outline" size="sm" onClick={add} disabled={isLoading}>➕ Add Row</Button>
                <Button variant="action-write" size="sm" onClick={onSave} disabled={isLoading}>💾 Save Array: "{fieldName}"</Button>
            </div>
            {/* Table Area */}
            {isLoading ? <LoadingSpinner message={`Loading ${fieldName}...`} /> : (
                <div className="overflow-auto max-h-96 custom-scrollbar">
                <table className="min-w-full text-sm table-fixed"> {/* Use table-fixed for better layout control */}
                     {/* Table Header */}
                    <thead className="sticky top-0 bg-gray-100 z-10">
                        <tr>
                            {/* Dynamically render column headers */}
                            {cols.map((c) => (
                                <th key={c} className={`p-2 border-b text-left font-semibold text-gray-700 ${c === '_id' ? 'w-24' : (isPrimitiveArray && c === 'value' ? '' : 'w-48')}`}> {/* Adjust widths */}
                                    { c === "_id" ? "Index ID" : (c === "value" ? valueColHeader : c) }
                                </th>
                            ))}
                            <th className="p-2 border-b font-semibold text-gray-700 w-16">Del</th> {/* Fixed width delete column */}
                        </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody>
                      {/* Empty State */}
                      {!rows || rows.length === 0 ? (
                        <tr><td colSpan={cols.length + 1} className="p-6 text-center text-gray-500 italic">Array is empty. Click "Add Row".</td></tr>
                      ) : rows.map((r, rowIndex) => ( // Use rowIndex for unique key if _id isn't perfect
                        <tr key={r._id || `row-${rowIndex}`} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 transition-colors">
                          {/* Render cells dynamically */}
                          {cols.map((c) => (
                            <td key={c} className="p-1.5 border-b align-top">
                              {c === "_id" ? (
                                  // Display temporary ID differently
                                  <div className={`px-2 py-1 rounded font-mono text-[10px] truncate ${r._id.startsWith('new_') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                                      {r._id.startsWith('new_') ? 'NEW' : r._id}
                                  </div>
                              ) : (
                                  // Use textarea for potentially long/JSON values
                                  <textarea
                                      className="w-full border rounded px-2 py-1 font-mono text-xs h-10 min-h-[2.5rem] resize-y bg-white focus:ring-1 focus:ring-blue-500"
                                      value={r[c] ?? ""}
                                      onChange={(e) => edit(r._id, c, e.target.value)}
                                      placeholder={c} rows={1}
                                      aria-label={`${c} for row ${rowIndex + 1}`}
                                  />
                              )}
                            </td>
                          ))}
                          {/* Delete Button */}
                          <td className="p-1.5 border-b text-center align-top">
                             <Button variant="ghost" size="sm" className="!p-1 text-red-500 hover:!bg-red-100" onClick={() => del(r._id)} aria-label={`Delete row ${rowIndex + 1}`}> <Trash2 size={14}/> </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                </table>
                </div>
            )}
        </div>
    );
}


/* =========================================================
   MAIN SCREEN COMPONENT: AdminDataMaintenance
========================================================= */

export default function AdminDataMaintenance() {
  // --- Services & State ---
  const { db, userId } = useAppServices(); // Get DB instance and User ID from context // cite: useAppServices.jsx
  // Path state
  const [path, setPath] = useState("metadata/config"); // Default path
  const [limit, setLimit] = useState(500); // Limit for collection lists
  // Status state
  const [status, setStatus] = useState("Idle. Select a preset or enter a path.");
  const [err, setErr] = useState("");
  // Document state
  const [docJson, setDocJson] = useState("{}"); // Stores the raw JSON string for the editor
  const [docExists, setDocExists] = useState(false); // Does the current document path exist?
  const [liveUnsub, setLiveUnsub] = useState(null); // Firestore listener unsubscribe function
  // Collection state
  const [rows, setRows] = useState([]); // Stores flattened data for collection view table
  const [selected, setSelected] = useState({}); // Stores selected row IDs for batch actions { rowId: boolean }
  // Editor state
  const [activeArray, setActiveArray] = useState(""); // Which array field is currently being edited in ArrayTable

  // --- Derived State ---
  const isDocView = useMemo(() => isDocumentPath(path), [path]);
  const isCollView = useMemo(() => isCollectionPath(path), [path]);
  const isLoading = useMemo(() => status.includes("Reading") || status.includes("Listing") || status.includes("Listening"), [status]);
  const isWriting = useMemo(() => status.includes("Saving") || status.includes("Replacing") || status.includes("Deleting") || status.includes("Batch"), [status]);
  // Parse JSON for use in editors
  const rawDocObj = useMemo(() => tryParse(docJson, {}), [docJson]);
  // Determine if the current document path uses the { items: [...] } wrapper
  const wrapperKey = useMemo(() => getStrictWrapperKeyForPath(normalizePath(path, userId)), [path, userId]); // Normalize path before checking
  // Find all keys in the current document object that point to an array (excluding the main wrapper key)
  const arrayFields = useMemo(() => Object.keys(rawDocObj).filter(k => k !== wrapperKey && Array.isArray(rawDocObj[k])), [rawDocObj, wrapperKey]);
  // Collection table columns (inferred from data)
  const cols = useMemo(() => inferColumns(rows), [rows]);

  // --- Effects ---
  // Cleanup listener on unmount
  useEffect(() => { return () => { if (liveUnsub) liveUnsub(); } }, [liveUnsub]);
  // Auto-select active array for editing when document data changes
  useEffect(() => {
    if (wrapperKey) setActiveArray(ARRAY_WRAPPER_KEY); // Wrapped docs always edit 'items'
    else if (arrayFields.length > 0 && !arrayFields.includes(activeArray)) setActiveArray(arrayFields[0]); // Select first available array if current selection invalid
    else if (arrayFields.length === 0) setActiveArray(""); // Clear selection if no arrays
  }, [arrayFields, activeArray, wrapperKey]); // Re-run when arrays change

  // --- Data for ArrayTable (Memoized) ---
  // Extracts and prepares the data for the currently selected array field
  const arrayRows = useMemo(() => {
    const targetKey = wrapperKey || activeArray; // Key to extract array from
    const sourceArray = (targetKey && Array.isArray(rawDocObj?.[targetKey])) ? rawDocObj[targetKey] : [];
    // Map array items to table row structure ({ _id, ...flattenedProps } or { _id, value })
    return sourceArray.map((item, i) => {
        const base = { _id: String(i) }; // Use index as stable ID for local editing
        if (item && typeof item === "object" && !Array.isArray(item)) return { ...base, ...flatten(item) }; // Flatten objects
        else return { ...base, value: typeof item === "string" ? item : JSON.stringify(item, null, 2) }; // Primitives/Arrays go in 'value'
    });
  }, [rawDocObj, activeArray, wrapperKey]);

  // --- Update Callbacks for Editors ---
  // Updates the main docJson state when ArrayTable rows change
  const setArrayRows = useCallback((nextRowsOrFn) => {
    setDocJson(prevJson => {
        const currentRaw = tryParse(prevJson, {});
        const nextRows = typeof nextRowsOrFn === 'function' ? nextRowsOrFn(arrayRows) : nextRowsOrFn; // Resolve functional update
        const rebuiltArray = nextRows.map(({ _id, ...rest }) => (Object.keys(rest).length === 1 && rest.value !== undefined) ? coerce(rest.value) : unflatten(rest)); // Reconstruct array items
        const targetArrayKey = wrapperKey || activeArray;
        const updatedFullDoc = targetArrayKey ? { ...currentRaw, [targetArrayKey]: rebuiltArray } : currentRaw;
        return pretty(updatedFullDoc);
    });
  }, [activeArray, wrapperKey, arrayRows]); // Added arrayRows dependency

  // Updates the main docJson state when KVEditor rows change (passed directly to KVEditor)
  const handleKvChange = useCallback((updatedFullDoc) => setDocJson(pretty(updatedFullDoc)), []);


  // --- Firestore Action Callbacks ---
  // Reads a single document
  const readDoc = useCallback(async () => { /* ... Re-use exact readDoc logic ... */ }, [path, userId, db, isLoading, liveUnsub]);
  // Sets up a live listener for a document
  const listenDoc = useCallback(() => { /* ... Re-use exact listenDoc logic ... */ }, [path, userId, db, isLoading, liveUnsub]);
  // Saves document using merge:true
  const saveMerge = useCallback(async () => { /* ... Re-use exact saveMerge logic, adds serverTimestamp ... */ }, [docJson, path, userId, db, isWriting, liveUnsub, readDoc]);
  // Replaces document using set (overwrite)
  const replaceSet = useCallback(async () => { /* ... Re-use exact replaceSet logic, adds serverTimestamp ... */ }, [docJson, path, userId, db, isWriting, liveUnsub, readDoc]);
  // Deletes a single document
  const deleteTheDoc = useCallback(async () => { /* ... Re-use exact deleteTheDoc logic ... */ }, [path, userId, db, isWriting, liveUnsub]);
  // Saves only the array field currently being edited (merge:true)
  const saveArray = useCallback(async () => { /* ... Re-use exact saveArray logic, uses activeArray/wrapperKey ... */ }, [docJson, path, userId, db, activeArray, wrapperKey, isWriting, liveUnsub, readDoc]);
  // Saves only the non-array (KV) fields (merge:true)
  const saveKV = useCallback(async () => { /* ... Re-use exact saveKV logic, uses excludedKeys ... */ }, [docJson, path, userId, db, isWriting, liveUnsub, readDoc, docExists, wrapperKey, activeArray]); // Added deps
  // Lists documents in a collection (with limit)
  const listCollection = useCallback(async () => { /* ... Re-use exact listCollection logic, uses limit state ... */ }, [path, userId, db, isLoading, limit]);
  // Adds a temporary row for adding new collection docs
  const addCollectionRow = useCallback(() => { /* ... Re-use exact addCollectionRow logic ... */ }, []);
  // Updates a cell in the local collection row state
  const setCollectionCell = useCallback((id, key, val) => { /* ... Re-use exact setCollectionCell logic ... */ }, []);
  // Toggles selection state for a collection row
  const toggleSelection = useCallback((id) => { /* ... Re-use exact toggleSelection logic ... */ }, []);
  // Toggles selection for all currently displayed collection rows
  const toggleAllSelection = useCallback(() => { /* ... Re-use exact toggleAllSelection logic ... */ }, [rows, selected]);
  // Batch saves new/imported and selected/updated collection rows
  const batchSaveCollection = useCallback(async () => { /* ... Re-use exact batchSaveCollection logic, adds serverTimestamp ... */ }, [rows, selected, path, userId, db, isWriting, listCollection]);
  // Batch deletes selected collection rows
  const deleteSelectedCollection = useCallback(async () => { /* ... Re-use exact deleteSelectedCollection logic ... */ }, [selected, path, userId, db, isWriting, listCollection]);
  // Deletes a single document from the collection view
  const deleteSingleCollectionDoc = useCallback(async (id) => { /* ... Re-use exact deleteSingleCollectionDoc logic ... */ }, [path, userId, db, isWriting, listCollection]);

  // --- Import/Export Callbacks (Unchanged Logic) ---
  const exportJSON = useCallback(() => { /* ... Re-use exact exportJSON logic ... */ }, [docJson, rows, path, userId, isDocView, isCollView]); // FIX 2a: Replaced 'uid' with 'userId'
  const importJSON = useCallback((e) => { /* ... Re-use exact importJSON logic ... */ }, [path, isDocView, isCollView]); // Added view checks
  const exportCSV = useCallback(() => { /* ... Re-use exact exportCSV logic ... */ }, [rows, path, userId, isCollView]); // FIX 2b: Replaced 'uid' with 'userId'
  const importCSV = useCallback((e) => { /* ... Re-use exact importCSV logic ... */ }, [path, isCollView]); // Added view check


  /* =========================================================
     PRESETS (Reorganized)
  ========================================================= */
  const presets = useMemo(() => [ // cite: User Request (reorganization)
    // --- App Value Sets ---
    { group: "App Value Sets (Global Config)", label: "⚙️ Global Config Root", value: "metadata/config" },
    { group: "App Value Sets (Global Config)", label: "🚩 Feature Flags", value: "metadata/config" }, // Point to config, edit specific fields
    { group: "App Value Sets (Catalogs)", label: "🗺️ Skill Catalog (Courses)", value: "metadata/config/catalog/SKILL_CATALOG" }, // Renamed // cite: useAppServices.jsx
    { group: "App Value Sets (Catalogs)", label: "📚 Resource Library Items", value: "metadata/config/catalog/RESOURCE_LIBRARY_ITEMS" }, // Raw items // cite: useAppServices.jsx
    { group: "App Value Sets (Catalogs)", label: "🎯 Rep Library (All Reps)", value: "metadata/config/catalog/REP_LIBRARY" }, // Unified // cite: useAppServices.jsx
    { group: "App Value Sets (Catalogs)", label: "🏋️ Exercise Library", value: "metadata/config/catalog/EXERCISE_LIBRARY" }, // New // cite: useAppServices.jsx
    { group: "App Value Sets (Catalogs)", label: "💪 Workout Library", value: "metadata/config/catalog/WORKOUT_LIBRARY" }, // New // cite: useAppServices.jsx
    { group: "App Value Sets (Catalogs)", label: "📘 Course Library", value: "metadata/config/catalog/COURSE_LIBRARY" }, // New // cite: useAppServices.jsx
    { group: "App Value Sets (Catalogs)", label: "👤 Identity Anchors", value: "metadata/config/catalog/IDENTITY_ANCHOR_CATALOG" }, // cite: useAppServices.jsx
    { group: "App Value Sets (Catalogs)", label: "⚓ Habit Anchors", value: "metadata/config/catalog/HABIT_ANCHOR_CATALOG" }, // cite: useAppServices.jsx
    { group: "App Value Sets (Catalogs)", label: "💖 Why Statements", value: "metadata/config/catalog/WHY_CATALOG" }, // cite: useAppServices.jsx
    { group: "App Value Sets (Catalogs)", label: "🎬 Scenario Catalog", value: "metadata/config/catalog/scenario_catalog" }, // cite: useAppServices.jsx
    { group: "App Value Sets (Catalogs)", label: "🎥 Video Catalog", value: "metadata/config/catalog/video_catalog" }, // cite: useAppServices.jsx
    { group: "App Value Sets (Catalogs)", label: "📖 Reading Catalog (Wrapped Doc)", value: "metadata/reading_catalog" }, // Separate // cite: useAppServices.jsx

    // --- User Data (Moved to Bottom) ---
    { group: "User Data (Per User)", label: "👤 Dev Plan Profile", value: "development_plan/<uid>/profile" }, // Updated path/label // cite: useAppServices.jsx
    { group: "User Data (Per User)", label: "📜 Dev Plan History (Coll)", value: "development_plan/<uid>/plan_history" }, // Updated path // cite: useAppServices.jsx
    { group: "User Data (Per User)", label: "📊 Assessment History (Coll)", value: "development_plan/<uid>/assessment_history" }, // Updated path // cite: useAppServices.jsx
    { group: "User Data (Per User)", label: "✅ Daily Practice State", value: "daily_practice/<uid>/state" }, // Updated path/label // cite: useAppServices.jsx
    { group: "User Data (Per User)", label: "📓 Reflection History (Coll)", value: "daily_practice/<uid>/reflection_history" }, // Updated path // cite: useAppServices.jsx
    { group: "User Data (Per User)", label: "📈 Practice History (Coll)", value: "daily_practice/<uid>/practice_history" }, // New: For lab sessions // cite: useAppServices.jsx
    { group: "User Data (Per User)", label: "📝 Strategic Content Data", value: "strategic_content/<uid>/data" }, // Updated path/label // cite: useAppServices.jsx

  ], []); // Empty dependency array as presets are static

  // Get unique group names in the desired order
  const presetGroups = useMemo(() => {
      const groupOrder = ["App Value Sets (Global Config)", "App Value Sets (Catalogs)", "User Data (Per User)"];
      return groupOrder.filter(group => presets.some(p => p.group === group));
  }, [presets]);


  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen" style={{ background: COLORS.BG }}>
      {/* Header */}
      <h1 className="text-3xl font-extrabold mb-6 border-b pb-3" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>
         🔥 Firestore Data Manager
      </h1>

      {/* Warning */}
      <AdminWarning />

      {/* Preset Buttons Section */}
      <div className="space-y-4 mb-6">
        {presetGroups.map(group => (
            <div key={group} className="p-3 bg-white border rounded-lg shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">{group}:</p> {/* Group Title */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Filter presets for the current group */}
                    {presets.filter(p => p.group === group).map((p) => (
                        <Button
                            key={p.value} variant="preset" // Use preset style
                            onClick={() => {
                                const newPath = p.value;
                                setPath(newPath); // Set the path state
                                // Trigger read/list based on path type
                                if (isDocumentPath(newPath)) readDoc(); else listCollection();
                            }}
                            title={`Path: ${p.value}`} // Tooltip shows the full path
                            disabled={isLoading || isWriting} // Disable while loading/writing
                        >
                            {p.label} {/* Button text is the user-friendly label */}
                        </Button>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {/* Path Input & Info */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4 sticky top-4 z-20 border"> {/* Make path bar sticky */}
         <label htmlFor="pathInput" className="block text-sm font-medium text-gray-700 mb-1">Firestore Path (<code className="text-xs bg-gray-100 p-0.5 rounded">&lt;uid&gt;</code> placeholder available)</label>
         <div className="flex items-center gap-2 mb-1">
          {/* Path Input Field */}
          <input id="pathInput" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm shadow-inner focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            value={path} onChange={(e) => setPath(e.target.value)}
            placeholder="collection/doc path..."
            // Trigger read/list on Enter key
            onKeyDown={(e) => { if (e.key === "Enter" && !isLoading && !isWriting) { if (isDocView) readDoc(); else if (isCollView) listCollection(); }}}
            disabled={isLoading || isWriting} aria-label="Firestore Path Input"
          />
          {/* Path Type Indicator */}
          <span className={`text-xs font-semibold px-2 py-1 rounded border ${isDocView ? 'bg-blue-100 text-blue-700 border-blue-200' : isCollView ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
             {isDocView ? "📝 Document" : isCollView ? "📚 Collection" : "❓ Invalid"}
          </span>
        </div>
      </div>

      {/* Status Bar */}
       <div className={`mb-4 p-3 rounded-lg shadow-sm border text-sm font-semibold ${
           err ? 'bg-red-50 border-red-300 text-red-700' :
           status.startsWith("✅") ? 'bg-green-50 border-green-300 text-green-700' :
           status.startsWith("❌") ? 'bg-red-50 border-red-300 text-red-700' :
           'bg-blue-50 border-blue-300 text-blue-700' // Default/Info state
       }`}>
        Status: {status}
        {/* Display error details if present */}
        {err && <div className="mt-1 text-xs font-normal break-words">Details: {err}</div>}
      </div>

      {/* ==================== DOCUMENT VIEW ==================== */}
      {isDocView ? (
        <div className="space-y-6">
          {/* --- Action Buttons --- */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg shadow-md border sticky top-[calc(4rem+1rem)] z-20"> {/* Sticky actions below path bar */}
             {/* Read/Listen */}
             <Button variant="action-read" size="sm" onClick={readDoc} disabled={isLoading || isWriting}> <Search size={14}/> Read</Button>
             <Button variant={liveUnsub ? 'action-danger' : 'action-special'} size="sm" onClick={liveUnsub ? () => { liveUnsub(); setLiveUnsub(null); setStatus("Idle."); } : listenDoc} disabled={isLoading || isWriting}>
                 {liveUnsub ? <><StopCircle size={14}/> Stop</> : <><Play size={14}/> Listen</>}
             </Button>
             {/* Write Actions */}
             <Button variant="action-write" size="sm" onClick={saveMerge} disabled={isLoading || isWriting}> <Save size={14}/> Save (Merge)</Button>
             <Button variant="action-write" size="sm" className="!bg-amber-600 hover:!bg-amber-700 focus:!ring-amber-500/50" onClick={replaceSet} disabled={isLoading || isWriting}> <Edit size={14}/> Replace (Set)</Button>
             <Button variant="action-danger" size="sm" onClick={deleteTheDoc} disabled={!docExists || isLoading || isWriting}> <Trash2 size={14}/> Delete Doc</Button>
             {/* Import/Export & Status */}
             <div className="ml-auto flex items-center gap-3">
                 <Button variant="outline" size="sm" onClick={exportJSON} disabled={!docExists || isLoading || isWriting}> <Download size={14}/> Export JSON</Button>
                 <label className={`inline-flex ${isLoading || isWriting ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <Button variant="outline" size="sm" as="span" disabled={isLoading || isWriting}> <Upload size={14}/> Import JSON</Button>
                    <input type="file" accept="application/json" className="hidden" onChange={importJSON} disabled={isLoading || isWriting}/>
                 </label>
                 <span className={`text-xs font-medium px-2 py-1 rounded border ${docExists ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    Exists: {String(docExists)}
                 </span>
             </div>
          </div>

          {/* --- Editors Layout --- */}
          {isLoading && !liveUnsub ? <LoadingSpinner /> : ( // Show spinner only on initial load, not during live updates
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Left: Raw JSON Editor */}
                 <div className="bg-white p-4 rounded-lg shadow-md border">
                     <label htmlFor="jsonEditor" className="text-base font-semibold text-gray-800 mb-2 block">Raw Document JSON</label>
                     <textarea id="jsonEditor" className="w-full h-[600px] font-mono border border-gray-300 rounded p-3 text-xs bg-gray-50 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-70 resize-y" spellCheck={false} value={docJson} onChange={(e) => setDocJson(e.target.value)} placeholder="Document JSON content..." disabled={isWriting} aria-label="Raw JSON Editor"/>
                </div>
                {/* Right: Table Editors */}
                <div className="flex flex-col gap-6">
                    {/* KV Editor */}
                    <div className="bg-white p-4 rounded-lg shadow-md border">
                      <h3 className="text-base font-semibold text-gray-800 mb-2">Key/Value Fields (Non-Arrays)</h3>
                       <KVEditor
                            value={rawDocObj}
                            // Exclude the strictly defined wrapper key OR the currently selected array field for editing
                            excludedKeys={wrapperKey ? [ARRAY_WRAPPER_KEY] : (activeArray ? [activeArray] : [])}
                            onChange={handleKvChange} // Pass update handler
                            onSave={saveKV} // Pass specific save handler
                            isLoading={isWriting} // Pass only writing state
                       />
                    </div>
                    {/* Array Editor */}
                    <div className="bg-white p-4 rounded-lg shadow-md border">
                      {/* Header with Selector (if applicable) */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-gray-800">Array Field Editor</h3>
                         {/* Show selector only if NOT strictly wrapped AND there are multiple arrays */}
                         {!wrapperKey && arrayFields.length > 0 && (
                            <div className="flex items-center gap-2">
                                <label htmlFor="arraySelector" className="text-sm text-gray-600">Edit Field:</label>
                                <select id="arraySelector" className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                   value={activeArray} onChange={(e) => setActiveArray(e.target.value)} disabled={isWriting}>
                                    {/* Default empty option if needed */}
                                    {arrayFields.map((f) => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                         )}
                         {wrapperKey && <span className="text-sm text-gray-600 font-medium">(Editing '{ARRAY_WRAPPER_KEY}' array)</span>}
                      </div>
                      {/* Render ArrayTable or message */}
                      {(wrapperKey || activeArray) ? (
                        <ArrayTable
                          fieldName={wrapperKey || activeArray} // Pass the correct field name
                          rows={arrayRows} // Pass memoized rows
                          setRows={setArrayRows} // Pass update callback
                          onSave={saveArray} // Pass specific save handler
                          isLoading={isWriting} // Pass only writing state
                        />
                      ) : (
                        <div className="text-sm text-gray-500 p-4 border rounded bg-gray-50 text-center italic">No array field selected or available in this document.</div>
                      )}
                    </div>
                </div>
              </div>
          )}
        </div>

      /* ==================== COLLECTION VIEW ==================== */
      ) : isCollView ? (
         <div className="space-y-6">
            {/* --- Action Buttons --- */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg shadow-md border sticky top-[calc(4rem+1rem)] z-20">
                 <Button variant="action-read" size="sm" onClick={listCollection} disabled={isLoading || isWriting}> <Search size={14}/> List Docs</Button>
                 {/* Limit Input */}
                 <div className="flex items-center gap-1">
                    <label htmlFor="limitInput" className="text-xs font-medium text-gray-600">Limit:</label>
                    <input id="limitInput" type="number" value={limit} onChange={(e) => setLimit(Math.max(1, Number(e.target.value) || 500))} className="w-16 border border-gray-300 rounded px-2 py-1 text-xs shadow-inner disabled:bg-gray-100" disabled={isLoading || isWriting}/>
                 </div>
                 <Button variant="outline" size="sm" onClick={addCollectionRow} disabled={isLoading || isWriting}>➕ Add New (Local)</Button>
                 <Button variant="action-write" size="sm" onClick={batchSaveCollection} disabled={isLoading || isWriting || rows.length === 0}> <Save size={14}/> Batch Save</Button>
                 <Button variant="action-danger" size="sm" onClick={deleteSelectedCollection} disabled={isLoading || isWriting || !Object.values(selected).some(Boolean)}> <Trash2 size={14}/> Delete Selected</Button>
                 {/* Import/Export */}
                 <div className="ml-auto flex items-center gap-3">
                     <Button variant="outline" size="sm" onClick={exportCSV} disabled={!rows.length || isLoading || isWriting}> <Download size={14}/> Export CSV</Button>
                     <label className={`inline-flex ${isLoading || isWriting ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <Button variant="outline" size="sm" as="span" disabled={isLoading || isWriting}> <Upload size={14}/> Import CSV</Button>
                        <input type="file" accept=".csv,text/csv" className="hidden" onChange={importCSV} disabled={isLoading || isWriting}/>
                     </label>
                     {/* JSON Import/Export for Collections too */}
                     <Button variant="outline" size="sm" onClick={exportJSON} disabled={!rows.length || isLoading || isWriting}> <Download size={14}/> Export JSON</Button>
                     <label className={`inline-flex ${isLoading || isWriting ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                        <Button variant="outline" size="sm" as="span" disabled={isLoading || isWriting}> <Upload size={14}/> Import JSON</Button>
                        <input type="file" accept="application/json" className="hidden" onChange={importJSON} disabled={isLoading || isWriting}/>
                     </label>
                 </div>
            </div>
            {/* --- Collection Table --- */}
            <div className="overflow-x-auto border rounded-lg shadow-md bg-white">
             {isLoading ? <LoadingSpinner message="Listing documents..." /> : (
                <table className="min-w-full text-sm divide-y divide-gray-200"> {/* Use divide for borders */}
                   {/* Table Header */}
                   <thead className="bg-gray-50 sticky top-0 z-10">
                     <tr>
                        {/* Select All Checkbox */}
                        <th className="px-3 py-2 w-10 text-center">
                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={rows.length > 0 && Object.keys(selected).length === rows.length && Object.values(selected).every(Boolean)}
                                onChange={toggleAllSelection} title="Select/Deselect All" aria-label="Select all rows"
                                disabled={isLoading || isWriting} />
                        </th>
                        {/* Dynamic Column Headers */}
                        {cols.map((c) => <th key={c} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{c}</th>)}
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">Actions</th>
                     </tr>
                   </thead>
                   {/* Table Body */}
                   <tbody className="bg-white divide-y divide-gray-200">
                    {/* Empty State */}
                    {!rows.length ? (
                        <tr><td colSpan={cols.length + 2} className="p-8 text-center text-gray-500 italic">No documents found or listed. Use 'List Docs' or 'Add New'.</td></tr>
                    ) : rows.map((r, rowIndex) => ( // Row Rendering
                        <tr key={r._id || `row-${rowIndex}`} className={`transition ${selected[r._id] ? 'bg-yellow-50' : 'odd:bg-white even:bg-gray-50'} hover:bg-yellow-50/50`}>
                            {/* Checkbox Cell */}
                            <td className="px-3 py-1.5 align-top text-center">
                                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                   checked={!!selected[r._id]} onChange={() => toggleSelection(r._id)} aria-label={`Select row ${rowIndex + 1}`} disabled={isLoading || isWriting} />
                            </td>
                            {/* Data Cells */}
                            {cols.map((c) => (
                               <td key={c} className="px-2 py-1.5 align-top">
                                {/* Display _id read-only */}
                                {c === "_id" ? (
                                    <div className={`px-2 py-1 rounded font-mono text-[10px] truncate ${r._id.startsWith("__") ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
                                        {r._id.startsWith("__new__") ? 'NEW' : r._id.startsWith("__import__") ? 'IMPORT' : r._id}
                                    </div>
                                ) : ( // Textarea for other fields
                                    <textarea
                                        className="w-full border rounded px-2 py-1 font-mono text-xs h-10 min-h-[2.5rem] resize-y bg-white focus:ring-1 focus:ring-blue-500 disabled:opacity-70"
                                        value={r[c] ?? ""} onChange={(e) => setCollectionCell(r._id, c, e.target.value)}
                                        placeholder={c} title={c} rows={1} disabled={isWriting} aria-label={`${c} for row ${rowIndex + 1}`}
                                    />
                                )}
                               </td>
                            ))}
                            {/* Actions Cell */}
                            <td className="px-3 py-1.5 align-top text-center">
                               <Button variant="ghost" size="sm" className="!p-1 text-red-500 hover:!bg-red-100" onClick={() => deleteSingleCollectionDoc(r._id)}
                                  disabled={isLoading || isWriting || r._id.startsWith("__")} aria-label={`Delete row ${rowIndex + 1}`}> <Trash2 size={14}/> </Button>
                            </td>
                        </tr>
                    ))}
                   </tbody>
                </table>
             )}
            </div>
         </div>
      ) : ( // Fallback if path is invalid
         <div className="p-6 text-center text-gray-500 italic border rounded-lg bg-white">Please enter a valid Firestore path above or select a preset.</div>
      )}
    </div>
  );
}
