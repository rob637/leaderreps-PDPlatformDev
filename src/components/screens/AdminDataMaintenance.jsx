// src/components/screens/AdminDataMaintenance.jsx (Working Version)

import React, { useEffect, useMemo, useState, useCallback } from "react";
// --- Firebase Modular SDK ---
import {
  getFirestore, doc, collection, getDoc, getDocs, onSnapshot,
  setDoc, deleteDoc, writeBatch, query, limit as qLimit, serverTimestamp
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- Core Services (for DB instance, UID) ---
import { useAppServices } from '../../services/useAppServices.jsx';

// --- Icons ---
import { Loader, AlertTriangle, Download, Upload, Trash2, Save, Play, StopCircle, Search, Edit } from 'lucide-react';

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', PURPLE: '#7C3AED', BG: '#F9FAFB' };
// --- Standardized UI Components (Matches Dashboard/Dev Plan) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base';
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C312] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
    else if (variant === 'action-read') baseStyle += ` bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:ring-blue-500/50 px-4 py-2 text-sm`;
    else if (variant === 'action-write') baseStyle += ` bg-green-600 text-white shadow-md hover:bg-green-700 focus:ring-green-500/50 px-4 py-2 text-sm`;
    else if (variant === 'action-danger') baseStyle += ` bg-red-600 text-white shadow-md hover:bg-red-700 focus:ring-red-500/50 px-4 py-2 text-sm`;
    else if (variant === 'action-special') baseStyle += ` bg-purple-600 text-white shadow-md hover:bg-purple-700 focus:ring-purple-500/50 px-4 py-2 text-sm`;
    else if (variant === 'preset') baseStyle += ` px-3 py-1.5 rounded-full border border-blue-200 text-xs bg-white text-blue-700 hover:bg-blue-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`;
    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};
const LoadingSpinner = ({ message = "Loading data..." }) => (
    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg flex items-center justify-center min-h-[100px]">
        <Loader className="w-5 h-5 animate-spin mr-2" style={{ color: COLORS.TEAL }} />
        {message}
    </div>
);


/* =========================================================
   UTILITIES (Data Handling, Path Logic)
========================================================= */
const pretty = (v) => JSON.stringify(v ?? {}, null, 2);
const tryParse = (t, fb) => { try { return JSON.parse(t); } catch { console.warn("JSON Parse Error:", t); return fb; } };

const coerce = (s) => {
    if (typeof s !== "string") return s;
    const t = s.trim();
    if (t === "true") return true; if (t === "false") return false; if (t === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(t)) { try { const d=new Date(t); if(!isNaN(d.getTime())) return d;}catch{} }
    if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) { try { const p=JSON.parse(t); if(typeof p==='object'&& p!==null) return p;}catch{} }
    return s;
};

const flatten = (obj, prefix = "", out = {}) => {
    if (obj == null || typeof obj !== 'object') return out;
    Object.entries(obj).forEach(([k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k;
        // Check for Firebase Timestamp object
        if (v && typeof v === 'object' && v.seconds !== undefined && v.nanoseconds !== undefined) { try { out[key] = new Date(v.seconds * 1000 + v.nanoseconds / 1000000).toISOString(); } catch { out[key] = "[Invalid Timestamp]"; } }
        // Stringify Arrays and nested Objects that aren't Dates
        else if (Array.isArray(v) || (v && typeof v === "object" && !(v instanceof Date))) { out[key] = JSON.stringify(v, null, 2); }
        else if (v instanceof Date) { out[key] = v.toISOString(); }
        else { out[key] = v; }
    });
    return out;
};

const unflatten = (flat) => {
    const out = {};
    Object.entries(flat).forEach(([path, value]) => {
        const parts = path.split("."); let cur = out;
        while (parts.length > 1) { const p = parts.shift(); if (typeof cur[p]==='undefined'||cur[p]===null){cur[p]={};} else if(typeof cur[p]!=='object'||Array.isArray(cur[p])){cur[p]={};} cur = cur[p]; }
        cur[parts[0]] = coerce(value);
    });
    return out;
};

const inferColumns = (rows) => {
    const set = new Set(["_id"]); if (Array.isArray(rows)) { rows.forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k))); } return Array.from(set);
};
const nowIso = () => new Date().toISOString();

// --- Path Logic ---
const pathParts = (p) => (p || '').trim().split("/").filter(Boolean);
const normalizePath = (raw, uid) => (raw || '').replaceAll(/<uid>|{uid}/g, uid || "");
const isDocumentPath = (p) => pathParts(p).length % 2 === 0;
const isCollectionPath = (p) => pathParts(p).length % 2 === 1;

// Key used for documents structured as { items: [...] }
const ARRAY_WRAPPER_KEY = "items";
// List of specific document paths known to use the { items: [...] } structure
const SINGLE_ARRAY_WRAPPER_DOCUMENTS = [
    "metadata/reading_catalog",
    "metadata/config/catalog/SKILL_CATALOG",
    "metadata/config/catalog/RESOURCE_LIBRARY_ITEMS",
    "metadata/config/catalog/scenario_catalog",
    "metadata/config/catalog/video_catalog",
    "metadata/config/catalog/REP_LIBRARY",
    "metadata/config/catalog/EXERCISE_LIBRARY",
    "metadata/config/catalog/WORKOUT_LIBRARY",
    "metadata/config/catalog/COURSE_LIBRARY",
    "metadata/config/catalog/IDENTITY_ANCHOR_CATALOG",
    "metadata/config/catalog/HABIT_ANCHOR_CATALOG",
    "metadata/config/catalog/WHY_CATALOG",
];
// Checks if the current path exactly matches one of the wrapper documents
const getStrictWrapperKeyForPath = (path) => SINGLE_ARRAY_WRAPPER_DOCUMENTS.includes(path) ? ARRAY_WRAPPER_KEY : null;


/* =========================================================
   CSV UTILITIES (Unchanged Logic)
========================================================= */
const toCSV = (rows) => {
    if (!rows || rows.length === 0) return "";
    const columns = inferColumns(rows);
    const header = columns.join(",");
    const csvRows = rows.map(row => columns.map(col => {
        let val = row[col] === undefined || row[col] === null ? "" : String(row[col]);
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
    }).join(","));
    return [header, ...csvRows].join("\n");
};
const fromCSV = (text) => {
    if (!text || text.trim() === "") return [];
    const [headerLine, ...dataLines] = text.trim().split('\n').map(line => line.trim()).filter(Boolean);
    if (!headerLine) return [];

    // Simple split for header (assumes no quoted commas in headers)
    const headers = headerLine.split(',').map(h => h.trim());
    const rows = [];

    // Basic CSV parsing that handles simple quoted strings
    dataLines.forEach(line => {
        const row = {};
        let current = '';
        let inQuotes = false;
        const values = [];

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"' && inQuotes) {
                    current += '"'; // Escaped double quote
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current); // Push the last value

        // Map values to headers and coerce types later (when unflattening for collection save)
        headers.forEach((h, i) => {
            if (i < values.length) {
                row[h] = values[i].trim();
            }
        });

        // Add temporary ID for new imports
        if (!row._id) row._id = `__import__${Date.now()}_${rows.length}`;
        rows.push(row);
    });

    return rows;
};


/* =========================================================
   UI SUB-COMPONENTS (KVEditor, ArrayTable, AdminWarning)
========================================================= */
const AdminWarning = () => (
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

function KVEditor({ value, onChange, onSave, isLoading, excludedKeys = [] }) {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        const flat = flatten(value);
        const filteredRows = Object.entries(flat)
            .filter(([k]) => !excludedKeys.includes(k.split('.')[0]))
            .map(([k, v]) => ({ key: k, value: String(v ?? '') }));
        setRows(filteredRows);
    }, [value, excludedKeys]);

    const update = useCallback((idx, field, val) => {
        setRows(currentRows => {
            const nextLocalRows = currentRows.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
            const fullObjectFromParent = tryParse(pretty(value), {});
            const kvUpdates = unflatten(Object.fromEntries(nextLocalRows.map(r => [r.key, r.value])));
            const mergedObject = { ...fullObjectFromParent };
            Object.keys(kvUpdates).forEach(key => {
                 let target = mergedObject;
                 const parts = key.split('.');
                 for(let i = 0; i < parts.length - 1; i++) {
                     if (!target[parts[i]] || typeof target[parts[i]] !== 'object') target[parts[i]] = {};
                     target = target[parts[i]];
                 }
                 target[parts[parts.length - 1]] = kvUpdates[key];
            });
            onChange(mergedObject);
            return nextLocalRows;
        });
    }, [value, onChange]);

    const addRow = useCallback(() => setRows(prev => [{ key: "", value: "" }, ...prev]), []);
    const delRow = useCallback((idx) => {
        setRows(currentRows => {
            const keyToDelete = currentRows[idx]?.key;
            const nextLocalRows = currentRows.filter((_, i) => i !== idx);
            const fullObjectFromParent = tryParse(pretty(value), {});
            const kvUpdates = unflatten(Object.fromEntries(nextLocalRows.map(r => [r.key, r.value])));
            const mergedObject = { ...fullObjectFromParent };
            Object.keys(fullObjectFromParent).forEach(k => { if (!excludedKeys.includes(k)) delete mergedObject[k]; });
            Object.assign(mergedObject, kvUpdates);
            onChange(mergedObject);
            return nextLocalRows;
        });
    }, [value, excludedKeys, onChange]);

    return (
        <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
            <div className="p-2 flex items-center gap-2 bg-gray-50 border-b">
                <Button variant="outline" size="sm" onClick={addRow} disabled={isLoading}>➕ Add Field</Button>
                <Button variant="action-write" size="sm" onClick={onSave} disabled={isLoading}>💾 Save Key/Values</Button>
            </div>
            {isLoading ? <LoadingSpinner message="Loading fields..." /> : (
                <div className="overflow-auto max-h-96 custom-scrollbar">
                <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-gray-100 z-10">
                        <tr>
                            <th className="p-2 border-b text-left font-semibold text-gray-700 w-1/3">Key (dot.notation)</th>
                            <th className="p-2 border-b text-left font-semibold text-gray-700 w-2/3">Value (String / JSON / ISO Date)</th>
                            <th className="p-2 border-b font-semibold text-gray-700">Del</th>
                        </tr>
                    </thead>
                    <tbody>
                    {rows.length === 0 ? (
                        <tr><td colSpan={3} className="p-6 text-center text-gray-500 italic">No non-array fields.</td></tr>
                    ) : rows.map((r, idx) => (
                        <tr key={idx} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 transition-colors">
                            <td className="p-1.5 border-b"><input className="w-full border rounded px-2 py-1 font-mono text-xs bg-white focus:ring-1 focus:ring-blue-500" value={r.key} onChange={(e) => update(idx, "key", e.target.value)} placeholder="fieldName or nested.field" aria-label={`Key for row ${idx + 1}`} /></td>
                            <td className="p-1.5 border-b">
                                <textarea className="w-full border rounded px-2 py-1 font-mono text-xs h-10 min-h-[2.5rem] resize-y bg-white focus:ring-1 focus:ring-blue-500" value={r.value} onChange={(e) => update(idx, "value", e.target.value)} placeholder="String, number, boolean, null, ISO Date, or JSON string" rows={1} aria-label={`Value for row ${idx + 1}`}/>
                            </td>
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

function ArrayTable({ fieldName, rows, setRows, onSave, isLoading }) {
    const cols = useMemo(() => inferColumns(rows), [rows]);
    const isPrimitiveArray = useMemo(() => cols.length === 2 && cols.includes('value'), [cols]);
    const valueColHeader = isPrimitiveArray ? "Array Value (Primitive or JSON String)" : "value";

    const add = useCallback(() => setRows((prev = []) => [{ _id: `new_${Date.now()}` }, ...prev]), [setRows]);
    const edit = useCallback((id, key, val) => setRows((prev = []) => prev.map((r) => (r._id === id ? { ...r, [key]: val } : r))), [setRows]);
    const del = useCallback((id) => setRows((prev = []) => prev.filter((r) => r._id !== id)), [setRows]);

    return (
        <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
            <div className="p-2 flex items-center gap-2 bg-gray-50 border-b">
                <Button variant="outline" size="sm" onClick={add} disabled={isLoading}>➕ Add Row</Button>
                <Button variant="action-write" size="sm" onClick={onSave} disabled={isLoading}>💾 Save Array: "{fieldName}"</Button>
            </div>
            {isLoading ? <LoadingSpinner message={`Loading ${fieldName}...`} /> : (
                <div className="overflow-auto max-h-96 custom-scrollbar">
                <table className="min-w-full text-sm table-fixed">
                    <thead className="sticky top-0 bg-gray-100 z-10">
                        <tr>
                            {cols.map((c) => (
                                <th key={c} className={`p-2 border-b text-left font-semibold text-gray-700 ${c === '_id' ? 'w-24' : (isPrimitiveArray && c === 'value' ? '' : 'w-48')}`}>
                                    { c === "_id" ? "Index ID" : (c === "value" ? valueColHeader : c) }
                                </th>
                            ))}
                            <th className="p-2 border-b font-semibold text-gray-700 w-16">Del</th>
                        </tr>
                    </thead>
                    <tbody>
                      {!rows || rows.length === 0 ? (
                        <tr><td colSpan={cols.length + 1} className="p-6 text-center text-gray-500 italic">Array is empty. Click "Add Row".</td></tr>
                      ) : rows.map((r, rowIndex) => (
                        <tr key={r._id || `row-${rowIndex}`} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 transition-colors">
                          {cols.map((c) => (
                            <td key={c} className="p-1.5 border-b align-top">
                              {c === "_id" ? (
                                  <div className={`px-2 py-1 rounded font-mono text-[10px] truncate ${r._id.startsWith('new_') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                                      {r._id.startsWith('new_') ? 'NEW' : r._id}
                                  </div>
                              ) : (
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
  const { db, userId } = useAppServices();
  const [path, setPath] = useState("metadata/config");
  const [limit, setLimit] = useState(500);
  const [status, setStatus] = useState("Idle. Select a preset or enter a path.");
  const [err, setErr] = useState("");
  const [docJson, setDocJson] = useState("{}");
  const [docExists, setDocExists] = useState(false);
  const [liveUnsub, setLiveUnsub] = useState(null);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState({});
  const [activeArray, setActiveArray] = useState("");

  // --- Derived State ---
  const isDocView = useMemo(() => isDocumentPath(path), [path]);
  const isCollView = useMemo(() => isCollectionPath(path), [path]);
  const isLoading = useMemo(() => status.includes("Reading") || status.includes("Listing") || status.includes("Listening"), [status]);
  const isWriting = useMemo(() => status.includes("Saving") || status.includes("Replacing") || status.includes("Deleting") || status.includes("Batch"), [status]);
  const rawDocObj = useMemo(() => tryParse(docJson, {}), [docJson]);
  const wrapperKey = useMemo(() => getStrictWrapperKeyForPath(normalizePath(path, userId)), [path, userId]);
  const arrayFields = useMemo(() => Object.keys(rawDocObj).filter(k => k !== wrapperKey && Array.isArray(rawDocObj[k])), [rawDocObj, wrapperKey]);
  const cols = useMemo(() => inferColumns(rows), [rows]);

  // --- Effects ---
  useEffect(() => { return () => { if (liveUnsub) liveUnsub(); } }, [liveUnsub]);
  useEffect(() => {
    if (wrapperKey) setActiveArray(ARRAY_WRAPPER_KEY);
    else if (arrayFields.length > 0 && !arrayFields.includes(activeArray)) setActiveArray(arrayFields[0]);
    else if (arrayFields.length === 0) setActiveArray("");
  }, [arrayFields, activeArray, wrapperKey]);

  // --- Data for ArrayTable (Memoized) ---
  const arrayRows = useMemo(() => {
    const targetKey = wrapperKey || activeArray;
    const sourceArray = (targetKey && Array.isArray(rawDocObj?.[targetKey])) ? rawDocObj[targetKey] : [];
    return sourceArray.map((item, i) => {
        const base = { _id: String(i) };
        if (item && typeof item === "object" && !Array.isArray(item)) return { ...base, ...flatten(item) };
        else return { ...base, value: typeof item === "string" ? item : JSON.stringify(item, null, 2) };
    });
  }, [rawDocObj, activeArray, wrapperKey]);

  // --- Update Callbacks for Editors ---
  const setArrayRows = useCallback((nextRowsOrFn) => {
    setDocJson(prevJson => {
        const currentRaw = tryParse(prevJson, {});
        const nextRows = typeof nextRowsOrFn === 'function' ? nextRowsOrFn(arrayRows) : nextRowsOrFn;
        const rebuiltArray = nextRows.map(({ _id, ...rest }) => (Object.keys(rest).length === 1 && rest.value !== undefined) ? coerce(rest.value) : unflatten(rest));
        const targetArrayKey = wrapperKey || activeArray;
        const updatedFullDoc = targetArrayKey ? { ...currentRaw, [targetArrayKey]: rebuiltArray } : currentRaw;
        return pretty(updatedFullDoc);
    });
  }, [activeArray, wrapperKey, arrayRows]);

  const handleKvChange = useCallback((updatedFullDoc) => setDocJson(pretty(updatedFullDoc)), []);


  // =========================================================
  // --- FIRESTORE ACTION CALLBACKS (RESTORED LOGIC) ---
  // =========================================================
  const normalizedPath = useMemo(() => normalizePath(path, userId), [path, userId]);
  const docRef = useMemo(() => isDocView ? doc(db, normalizedPath) : null, [db, normalizedPath, isDocView]);
  const collRef = useMemo(() => isCollView ? collection(db, normalizedPath) : null, [db, normalizedPath, isCollView]);

  // Utility to clear any active listener
  const clearListener = useCallback(() => {
    if (liveUnsub) {
        liveUnsub();
        setLiveUnsub(null);
        setStatus("Idle.");
    }
  }, [liveUnsub]);

  // Reads a single document
  const readDoc = useCallback(async () => {
    if (!docRef || isLoading || isWriting) return;
    clearListener();
    setErr("");
    setStatus("Reading document...");

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDocJson(pretty(data));
        setDocExists(true);
        setStatus("✅ Read successful. Document exists.");
      } else {
        setDocJson("{}");
        setDocExists(false);
        setStatus("✅ Read successful. Document does not exist (New).");
      }
    } catch (e) {
      setErr(e.message);
      setStatus("❌ Read failed.");
    }
  }, [docRef, isLoading, isWriting, clearListener]);

  // Sets up a live listener for a document
  const listenDoc = useCallback(() => {
    if (!docRef || isLoading || isWriting || liveUnsub) return;
    setErr("");
    setStatus("Listening for document changes...");

    const unsub = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setDocJson(pretty(data));
            setDocExists(true);
            setStatus(`👂 Listening... Last update: ${nowIso()}`);
        } else {
            setDocJson("{}");
            setDocExists(false);
            setStatus("👂 Listening... Document deleted or does not exist.");
        }
    }, (error) => {
        setErr(error.message);
        setStatus("❌ Listener failed.");
        setLiveUnsub(null); // Stop listening on error
    });

    setLiveUnsub(() => unsub); // Store the unsubscribe function
  }, [docRef, isLoading, isWriting, liveUnsub]);

  // Saves document using merge:true
  const saveMerge = useCallback(async () => {
    if (!docRef || isLoading || isWriting) return;
    clearListener();
    setErr("");
    setStatus("Saving document (Merge: True)...");

    try {
      const dataToSave = { ...rawDocObj, _updated: serverTimestamp() };
      await setDoc(docRef, dataToSave, { merge: true });
      setStatus("✅ Save (Merge) successful.");
      await readDoc(); // Refresh data from DB to get serverTimestamp value
    } catch (e) {
      setErr(e.message);
      setStatus("❌ Save (Merge) failed.");
    }
  }, [docRef, isLoading, isWriting, rawDocObj, readDoc, clearListener]);

  // Replaces document using set (overwrite)
  const replaceSet = useCallback(async () => {
    if (!docRef || isLoading || isWriting) return;
    clearListener();
    setErr("");
    setStatus("Replacing document (Overwrite)...");

    try {
      const dataToSave = { ...rawDocObj, _updated: serverTimestamp() };
      await setDoc(docRef, dataToSave, { merge: false });
      setStatus("✅ Replace (Set) successful.");
      await readDoc(); // Refresh data
    } catch (e) {
      setErr(e.message);
      setStatus("❌ Replace (Set) failed.");
    }
  }, [docRef, isLoading, isWriting, rawDocObj, readDoc, clearListener]);

  // Deletes a single document
  const deleteTheDoc = useCallback(async () => {
    if (!docRef || !docExists || isLoading || isWriting) return;
    clearListener();
    setErr("");
    setStatus("Deleting document...");

    try {
      await deleteDoc(docRef);
      setDocExists(false);
      setDocJson("{}");
      setStatus("✅ Document deleted successfully.");
    } catch (e) {
      setErr(e.message);
      setStatus("❌ Delete failed.");
    }
  }, [docRef, docExists, isLoading, isWriting, clearListener]);

  // Saves only the array field currently being edited (merge:true)
  const saveArray = useCallback(async () => {
    if (!docRef || isLoading || isWriting) return;
    clearListener();
    setErr("");
    const targetKey = wrapperKey || activeArray;
    if (!targetKey) { setStatus("❌ No array selected to save."); return; }

    setStatus(`Saving array field '${targetKey}' (Merge: True)...`);

    try {
      const arrayData = rawDocObj[targetKey];
      const dataToSave = { [targetKey]: arrayData, _updated: serverTimestamp() };
      await setDoc(docRef, dataToSave, { merge: true });
      setStatus(`✅ Save array '${targetKey}' successful.`);
      await readDoc(); // Refresh data
    } catch (e) {
      setErr(e.message);
      setStatus("❌ Save array failed.");
    }
  }, [docRef, isLoading, isWriting, rawDocObj, activeArray, wrapperKey, readDoc, clearListener]);

  // Saves only the non-array (KV) fields (merge:true)
  const saveKV = useCallback(async () => {
    if (!docRef || isLoading || isWriting) return;
    clearListener();
    setErr("");
    setStatus("Saving Key/Value fields (Merge: True)...");

    try {
      // 1. Get the current KV state from the rawDocObj
      const kvData = {};
      const excludedKeys = wrapperKey ? [ARRAY_WRAPPER_KEY] : (activeArray ? [activeArray] : []);
      Object.keys(rawDocObj).forEach(k => {
          if (!excludedKeys.includes(k)) {
              kvData[k] = rawDocObj[k];
          }
      });

      // 2. Perform a merge on the document with the KV data
      const dataToSave = { ...kvData, _updated: serverTimestamp() };
      await setDoc(docRef, dataToSave, { merge: true });
      setStatus("✅ Save Key/Value fields successful.");
      await readDoc(); // Refresh data
    } catch (e) {
      setErr(e.message);
      setStatus("❌ Save Key/Value fields failed.");
    }
  }, [docRef, isLoading, isWriting, rawDocObj, activeArray, wrapperKey, readDoc, clearListener]);


  // Lists documents in a collection (with limit)
  const listCollection = useCallback(async () => {
    if (!collRef || isLoading || isWriting) return;
    setErr("");
    setStatus(`Listing collection (Limit: ${limit})...`);
    setRows([]);
    setSelected({});

    try {
      const q = query(collRef, qLimit(Number(limit)));
      const querySnapshot = await getDocs(q);
      const newRows = querySnapshot.docs.map(doc => ({
        _id: doc.id,
        ...flatten(doc.data()) // Flatten data for table
      }));
      setRows(newRows);
      setStatus(`✅ Listed ${newRows.length} documents successfully.`);
    } catch (e) {
      setErr(e.message);
      setStatus("❌ Listing collection failed.");
    }
  }, [collRef, isLoading, isWriting, limit]);

  // Adds a temporary row for adding new collection docs
  const addCollectionRow = useCallback(() => {
    if (isWriting) return;
    const newRow = { _id: `__new__${Date.now()}` };
    setRows(prev => [newRow, ...prev]);
    setStatus("Added new row (ID starts with '__new__'). Click 'Batch Save' to commit.");
  }, [isWriting]);

  // Updates a cell in the local collection row state
  const setCollectionCell = useCallback((id, key, val) => {
    setRows(prev => prev.map(r => (r._id === id ? { ...r, [key]: val } : r)));
  }, []);

  // Toggles selection state for a collection row
  const toggleSelection = useCallback((id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Toggles selection for all currently displayed collection rows
  const toggleAllSelection = useCallback(() => {
    if (rows.length === 0) return;
    const allSelected = Object.keys(selected).length === rows.length && Object.values(selected).every(Boolean);
    const newSelection = {};
    if (!allSelected) {
        rows.forEach(r => newSelection[r._id] = true);
    }
    setSelected(newSelection);
  }, [rows, selected]);

  // Batch saves new/imported and selected/updated collection rows
  const batchSaveCollection = useCallback(async () => {
    if (!collRef || isLoading || isWriting || rows.length === 0) return;
    setErr("");
    setStatus("Starting batch save...");

    try {
      const batch = writeBatch(db);
      let saveCount = 0;

      rows.forEach(row => {
        // Only process rows that are explicitly selected OR are new/imported
        if (selected[row._id] || row._id.startsWith('__new__') || row._id.startsWith('__import__')) {
          const { _id, ...flatData } = row;
          // Unflatten the data and coerce values back to types
          const data = unflatten(flatData);
          data._updated = serverTimestamp(); // Add timestamp

          // Determine the target Ref and operation
          let targetRef;
          let docId = _id.startsWith('__') ? doc(collRef).id : _id; // Generate new ID if temporary
          targetRef = doc(collRef, docId);

          batch.set(targetRef, data, { merge: true }); // Always use merge for batch updates
          saveCount++;
        }
      });

      if (saveCount === 0) {
        setStatus("✅ Batch save completed. 0 documents were selected/new.");
        return;
      }

      await batch.commit();
      setStatus(`✅ Batch save successful. ${saveCount} documents saved/updated.`);
      setSelected({}); // Clear selection
      await listCollection(); // Refresh data
    } catch (e) {
      setErr(e.message);
      setStatus("❌ Batch save failed.");
    }
  }, [collRef, rows, selected, isLoading, isWriting, db, listCollection]);

  // Batch deletes selected collection rows
  const deleteSelectedCollection = useCallback(async () => {
    if (!collRef || isLoading || isWriting || !Object.values(selected).some(Boolean)) return;
    setErr("");
    setStatus("Starting batch delete...");

    try {
      const batch = writeBatch(db);
      let deleteCount = 0;

      Object.entries(selected).forEach(([id, isSelected]) => {
        if (isSelected && !id.startsWith('__')) { // Only delete existing docs (not temporary new/imported ones)
          const targetRef = doc(collRef, id);
          batch.delete(targetRef);
          deleteCount++;
        }
      });

      if (deleteCount === 0) {
        setStatus("✅ Batch delete completed. 0 existing documents were selected.");
        return;
      }

      await batch.commit();
      setStatus(`✅ Batch delete successful. ${deleteCount} documents deleted.`);
      setSelected({}); // Clear selection
      await listCollection(); // Refresh data
    } catch (e) {
      setErr(e.message);
      setStatus("❌ Batch delete failed.");
    }
  }, [collRef, selected, isLoading, isWriting, db, listCollection]);

  // Deletes a single document from the collection view
  const deleteSingleCollectionDoc = useCallback(async (id) => {
    if (!collRef || isLoading || isWriting || id.startsWith("__")) return;
    setErr("");
    setStatus(`Deleting single document: ${id}...`);

    try {
      const targetRef = doc(collRef, id);
      await deleteDoc(targetRef);
      setStatus(`✅ Document '${id}' deleted successfully.`);
      await listCollection(); // Refresh data
    } catch (e) {
      setErr(e.message);
      setStatus("❌ Single document delete failed.");
    }
  }, [collRef, isLoading, isWriting, listCollection]);

  // --- Import/Export Callbacks (Restored Logic) ---
  const exportJSON = useCallback(() => {
    setErr("");
    try {
      let dataToExport = isDocView ? rawDocObj : rows.map(({ _id, ...rest }) => unflatten(rest));
      const json = pretty(dataToExport);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `${normalizedPath.replace(/\//g, '_')}_export_${nowIso().substring(0, 10)}.json`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus("✅ Data exported as JSON.");
    } catch (e) {
      setErr(e.message);
      setStatus("❌ JSON export failed.");
    }
  }, [rawDocObj, rows, isDocView, normalizedPath]);

  const importJSON = useCallback((e) => {
    if (isLoading || isWriting) return;
    setErr("");
    const file = e.target.files[0];
    if (!file) return;

    setStatus("Importing JSON file...");
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = tryParse(event.target.result, null);
        if (jsonContent === null) throw new Error("File is not valid JSON.");

        if (isDocView) {
          setDocJson(pretty(jsonContent));
          setStatus("✅ Document JSON imported locally. Click 'Save' or 'Replace' to commit.");
        } else if (isCollView) {
          if (!Array.isArray(jsonContent)) throw new Error("Collection JSON must be a top-level array.");
          // Convert array items into flat rows for the collection table
          const importedRows = jsonContent.map((item, index) => ({
              _id: `__import__${Date.now()}_${index}`, // Use temporary ID
              ...flatten(item)
          }));
          setRows(importedRows);
          setSelected({});
          setStatus(`✅ ${importedRows.length} documents imported locally. Click 'Batch Save' to commit.`);
        }
      } catch (e) {
        setErr(e.message);
        setStatus("❌ JSON import failed.");
      } finally {
        e.target.value = null; // Clear input
      }
    };
    reader.readAsText(file);
  }, [isLoading, isWriting, isDocView, isCollView]);

  const exportCSV = useCallback(() => {
    setErr("");
    if (!isCollView || !rows.length) return;
    try {
      const csv = toCSV(rows);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `${normalizedPath.replace(/\//g, '_')}_export_${nowIso().substring(0, 10)}.csv`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus("✅ Data exported as CSV.");
    } catch (e) {
      setErr(e.message);
      setStatus("❌ CSV export failed.");
    }
  }, [rows, isCollView, normalizedPath]);

  const importCSV = useCallback((e) => {
    if (isLoading || isWriting) return;
    setErr("");
    if (!isCollView) return;
    const file = e.target.files[0];
    if (!file) return;

    setStatus("Importing CSV file...");
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target.result;
        const importedRows = fromCSV(csvText);
        setRows(importedRows);
        setSelected({});
        setStatus(`✅ ${importedRows.length} documents imported locally from CSV. Click 'Batch Save' to commit.`);
      } catch (e) {
        setErr(e.message);
        setStatus("❌ CSV import failed.");
      } finally {
        e.target.value = null; // Clear input
      }
    };
    reader.readAsText(file);
  }, [isLoading, isWriting, isCollView]);


  // --- Presets (Unchanged Logic) ---
  const presets = useMemo(() => [
    { group: "App Value Sets (Global Config)", label: "⚙️ Global Config Root", value: "metadata/config" },
    { group: "App Value Sets (Global Config)", label: "🚩 Feature Flags", value: "metadata/config" },
    { group: "App Value Sets (Catalogs)", label: "🗺️ Skill Catalog (Courses)", value: "metadata/config/catalog/SKILL_CATALOG" },
    { group: "App Value Sets (Catalogs)", label: "📚 Resource Library Items", value: "metadata/config/catalog/RESOURCE_LIBRARY_ITEMS" },
    { group: "App Value Sets (Catalogs)", label: "🎯 Rep Library (All Reps)", value: "metadata/config/catalog/REP_LIBRARY" },
    { group: "App Value Sets (Catalogs)", label: "🏋️ Exercise Library", value: "metadata/config/catalog/EXERCISE_LIBRARY" },
    { group: "App Value Sets (Catalogs)", label: "💪 Workout Library", value: "metadata/config/catalog/WORKOUT_LIBRARY" },
    { group: "App Value Sets (Catalogs)", label: "📘 Course Library", value: "metadata/config/catalog/COURSE_LIBRARY" },
    { group: "App Value Sets (Catalogs)", label: "👤 Identity Anchors", value: "metadata/config/catalog/IDENTITY_ANCHOR_CATALOG" },
    { group: "App Value Sets (Catalogs)", label: "⚓ Habit Anchors", value: "metadata/config/catalog/HABIT_ANCHOR_CATALOG" },
    { group: "App Value Sets (Catalogs)", label: "💖 Why Statements", value: "metadata/config/catalog/WHY_CATALOG" },
    { group: "App Value Sets (Catalogs)", label: "🎬 Scenario Catalog", value: "metadata/config/catalog/scenario_catalog" },
    { group: "App Value Sets (Catalogs)", label: "🎥 Video Catalog", value: "metadata/config/catalog/video_catalog" },
    { group: "App Value Sets (Catalogs)", label: "📖 Reading Catalog (Wrapped Doc)", value: "metadata/reading_catalog" },
    { group: "User Data (Per User)", label: "👤 Dev Plan Profile", value: "development_plan/<uid>/profile" },
    { group: "User Data (Per User)", label: "📜 Dev Plan History (Coll)", value: "development_plan/<uid>/plan_history" },
    { group: "User Data (Per User)", label: "📊 Assessment History (Coll)", value: "development_plan/<uid>/assessment_history" },
    { group: "User Data (Per User)", label: "✅ Daily Practice State", value: "daily_practice/<uid>/user_state/state" },
    { group: "User Data (Per User)", label: "📓 Reflection History (Coll)", value: "daily_practice/<uid>/reflection_history" },
    { group: "User Data (Per User)", label: "📈 Practice History (Coll)", value: "daily_practice/<uid>/practice_history" },
    { group: "User Data (Per User)", label: "📝 Strategic Content Data", value: "strategic_content/<uid>/data" },
  ], []);

  const presetGroups = useMemo(() => {
      const groupOrder = ["App Value Sets (Global Config)", "App Value Sets (Catalogs)", "User Data (Per User)"];
      return groupOrder.filter(group => presets.some(p => p.group === group));
  }, [presets]);


  /* =========================================================
     RENDER (Unchanged Logic)
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
                <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">{group}:</p>
                <div className="flex flex-wrap items-center gap-2">
                    {presets.filter(p => p.group === group).map((p) => (
                        <Button
                            key={p.value} variant="preset"
                            onClick={() => {
                                const newPath = p.value;
                                setPath(newPath);
                                // Trigger read/list based on path type
                                // NOTE: We re-check the path type inside the onClick logic for accuracy
                                if (isDocumentPath(newPath)) readDoc(); else listCollection();
                            }}
                            title={`Path: ${p.value}`}
                            disabled={isLoading || isWriting}
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>
            </div>
        ))}
      </div>

      {/* Path Input & Info */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4 sticky top-4 z-20 border">
         <label htmlFor="pathInput" className="block text-sm font-medium text-gray-700 mb-1">Firestore Path (<code className="text-xs bg-gray-100 p-0.5 rounded">&lt;uid&gt;</code> placeholder available)</label>
         <div className="flex items-center gap-2 mb-1">
          <input id="pathInput" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm shadow-inner focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            value={path} onChange={(e) => setPath(e.target.value)}
            placeholder="collection/doc path..."
            onKeyDown={(e) => { if (e.key === "Enter" && !isLoading && !isWriting) { if (isDocView) readDoc(); else if (isCollView) listCollection(); }}}
            disabled={isLoading || isWriting} aria-label="Firestore Path Input"
          />
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
           'bg-blue-50 border-blue-300 text-blue-700'
       }`}>
        Status: {status}
        {err && <div className="mt-1 text-xs font-normal break-words">Details: {err}</div>}
      </div>

      {/* ==================== DOCUMENT VIEW ==================== */}
      {isDocView ? (
        <div className="space-y-6">
          {/* --- Action Buttons --- */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg shadow-md border sticky top-[calc(4rem+1rem)] z-20">
             {/* Read/Listen */}
             <Button variant="action-read" size="sm" onClick={readDoc} disabled={isLoading || isWriting}> <Search size={14}/> Read</Button>
             <Button variant={liveUnsub ? 'action-danger' : 'action-special'} size="sm" onClick={liveUnsub ? clearListener : listenDoc} disabled={isLoading || isWriting}>
                 {liveUnsub ? <><StopCircle size={14}/> Stop</> : <><Play size={14}/> Listen</>}
             </Button>
             {/* Write Actions */}
             <Button variant="action-write" size="sm" onClick={saveMerge} disabled={isLoading || isWriting}> <Save size={14}/> Save (Merge)</Button>
             <Button variant="action-write" size="sm" className="!bg-amber-600 hover:!bg-amber-700 focus:!ring-amber-500/50" onClick={replaceSet} disabled={isLoading || isWriting}> <Edit size={14}/> Replace (Set)</Button>
             <Button variant="action-danger" size="sm" onClick={deleteTheDoc} disabled={!docExists || isLoading || isWriting}> <Trash2 size={14}/> Delete Doc</Button>
             {/* Import/Export & Status */}
             <div className="ml-auto flex items-center gap-3">
                 <Button variant="outline" size="sm" onClick={exportJSON} disabled={!docExists && docJson === "{}" || isLoading || isWriting}> <Download size={14}/> Export JSON</Button>
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
          {isLoading && !liveUnsub ? <LoadingSpinner /> : (
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
                            excludedKeys={wrapperKey ? [ARRAY_WRAPPER_KEY] : (activeArray ? [activeArray] : [])}
                            onChange={handleKvChange}
                            onSave={saveKV}
                            isLoading={isWriting}
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
                                    {arrayFields.map((f) => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                         )}
                         {wrapperKey && <span className="text-sm text-gray-600 font-medium">(Editing '{ARRAY_WRAPPER_KEY}' array)</span>}
                      </div>
                      {/* Render ArrayTable or message */}
                      {(wrapperKey || activeArray) ? (
                        <ArrayTable
                          fieldName={wrapperKey || activeArray}
                          rows={arrayRows}
                          setRows={setArrayRows}
                          onSave={saveArray}
                          isLoading={isWriting}
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
                <table className="min-w-full text-sm divide-y divide-gray-200">
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
                    ) : rows.map((r, rowIndex) => (
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
      ) : (
         <div className="p-6 text-center text-gray-500 italic border rounded-lg bg-white">Please enter a valid Firestore path above or select a preset.</div>
      )}
    </div>
  );
}