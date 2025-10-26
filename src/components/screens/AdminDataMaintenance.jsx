// src/components/screens/AdminDataMaintenance.jsx
// Restored comprehensive version with all catalog presets and refined editor logic

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  limit as qLimit,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Loader, AlertTriangle } from 'lucide-react';

/* ----------------------- utilities ----------------------- */
// (pretty, tryParse, pathParts, normalizePath, coerce, flatten, unflatten, inferColumns, nowIso - Unchanged from previous complete version)
const pretty = (v) => JSON.stringify(v ?? {}, null, 2);
const tryParse = (t, fb) => { try { return JSON.parse(t); } catch { return fb; } };
const pathParts = (p) => p.trim().split("/").filter(Boolean);
const normalizePath = (raw, uid) => raw.replaceAll("<uid>", uid || "").replaceAll("{uid}", uid || "");

const coerce = (s) => {
    if (typeof s !== "string") return s;
    const t = s.trim();
    if (t === "true") return true;
    if (t === "false") return false;
    if (t === "null") return null;
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    // Try parsing ISO date strings
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(t)) {
        try { const date = new Date(t); if (!isNaN(date.getTime())) return date; } catch {}
    }
    // Try parsing JSON but ONLY return if it's an object/array
    if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
        try {
             const parsed = JSON.parse(t);
             // Ensure we only return actual objects/arrays, not parsed primitives like "true"
             if (typeof parsed === 'object' && parsed !== null) return parsed;
        } catch {}
    }
    return s; // Return original string if no other type matches
};

const flatten = (obj, prefix = "", out = {}) => {
    if (obj == null || typeof obj !== 'object') return out; // Added check for non-objects
    Object.entries(obj).forEach(([k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && v.seconds !== undefined && v.nanoseconds !== undefined) {
             try { out[key] = new Date(v.seconds * 1000 + v.nanoseconds / 1000000).toISOString(); }
             catch { out[key] = "[Invalid Timestamp]"; }
        } else if (Array.isArray(v) || (v && typeof v === "object" && !(v instanceof Date))) {
            // Store complex types as pretty JSON strings in the flattened view
            out[key] = JSON.stringify(v, null, 2);
        } else if (v instanceof Date) {
            out[key] = v.toISOString();
        } else {
            // Handle primitives directly
            out[key] = v;
        }
    });
    return out;
};

const unflatten = (flat) => {
    const out = {};
    Object.entries(flat).forEach(([path, value]) => {
        const parts = path.split(".");
        let cur = out;
        while (parts.length > 1) {
            const p = parts.shift();
            // Initialize intermediate steps as objects if they don't exist
            if (typeof cur[p] === 'undefined' || cur[p] === null) {
                cur[p] = {};
            } else if (typeof cur[p] !== 'object' || Array.isArray(cur[p])) {
                 // If it exists but isn't an object (e.g., primitive overwrite), reset to object
                 console.warn(`Unflatten conflict: Overwriting non-object at path ${p} while reconstructing ${path}`);
                 cur[p] = {};
            }
            cur = cur[p];
        }
        // Coerce the final value (handles primitives, dates, JSON strings)
        cur[parts[0]] = coerce(value);
    });
    return out;
};


const inferColumns = (rows) => {
     const set = new Set(["_id"]);
     // Ensure rows is an array before iterating
     if (Array.isArray(rows)) {
        rows.forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k)));
     }
     return Array.from(set);
};
const nowIso = () => new Date().toISOString();


// --- PATH CONSTANTS AND UTILITIES ---
const ARRAY_WRAPPER_KEY = "items";

// List *all* document paths expected to be structured strictly as { items: [...] }
const SINGLE_ARRAY_WRAPPER_DOCUMENTS = [
    "metadata/reading_catalog", // This one is explicitly separate
    // Add ALL catalogs under /catalog/ IF they use the { items: [...] } structure
    "metadata/config/catalog/TARGET_REP_CATALOG",
    "metadata/config/catalog/quick_challenge_catalog",
    "metadata/config/catalog/leadership_domains",
    "metadata/config/catalog/resource_library",
    "metadata/config/catalog/scenario_catalog",
    "metadata/config/catalog/video_catalog",
    // Add SKILL_CONTENT_LIBRARY if it also follows this pattern
    "metadata/config/catalog/SKILL_CONTENT_LIBRARY" // Assuming it does
];

const isDocumentPath = (p) => pathParts(p).length % 2 === 0;
const isCollectionPath = (p) => !isDocumentPath(p);

// Checks if the current path is in the explicit list of wrapped docs
const getStrictWrapperKeyForPath = (path) => {
    return SINGLE_ARRAY_WRAPPER_DOCUMENTS.includes(path) ? ARRAY_WRAPPER_KEY : null;
};
// --- END PATH UTILITIES ---


/* ----------------------- CSV helpers ----------------------- */
const toCSV = (rows) => {
  if (!rows || !rows.length) return "";
  const cols = inferColumns(rows);
  const header = cols.join(",") + "\n";
  const body = rows.map(row => {
    return cols.map(col => {
      let val = row[col];
      if (val == null) return "";
      if (typeof val === 'object') {
        val = JSON.stringify(val); // Stringify nested objects/arrays
      }
      let str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        str = `"${str.replace(/"/g, '""')}"`; // Handle escaping
      }
      return str;
    }).join(",");
  }).join("\n");
  return header + body;
};

const fromCSV = (text) => {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines.shift().split(",").map(h => h.trim().replace(/^"|"$/g, '')); // Handle quoted headers
  return lines.filter(Boolean).map((line, idx) => {
    // Regex to split CSV row, handling quotes
    const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const row = { _id: `__import__${idx}` };
    headers.forEach((h, i) => {
      let val = (values[i] || "").trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"'); // Unescape
      }
      row[h] = coerce(val); // Coerce values back to types
    });
    return row;
  });
};


/* ----------------------- UI components ----------------------- */
const LoaderSpinner = () => (
    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg flex items-center justify-center">
        <Loader className="w-5 h-5 animate-spin mr-2 text-indigo-500" />
        Loading data...
    </div>
);

const AdminWarning = () => (
    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg mb-6 shadow-md">
        <div className="flex">
            <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-3">
                <h3 className="text-sm font-bold text-yellow-800">Warning: Direct Database Access</h3>
                <div className="mt-2 text-sm text-yellow-700">
                    <p>You are using a raw data editor. Actions are immediate and may be irreversible. Be 100% certain of your path and data before clicking Save, Replace, or Delete.</p>
                </div>
            </div>
        </div>
    </div>
);

// KVEditor Component (Handles non-array fields)
function KVEditor({ value, onChange, onSave, isLoading, excludedKeys = [] }) {
    const [rows, setRows] = useState([]);

    // Recalculate rows when value or excludedKeys change
    useEffect(() => {
        const flat = flatten(value);
        setRows(Object.keys(flat)
                      .filter(k => !excludedKeys.includes(k.split('.')[0])) // Filter out keys managed by ArrayTable
                      .map((k) => ({ key: k, value: String(flat[k] ?? '') }))
               );
    }, [value, excludedKeys]);

    const cols = ["key", "value"];

    // Update handler for cell changes
    const update = (idx, field, val) => {
        const nextLocalRows = rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
        setRows(nextLocalRows); // Update local state immediately for responsiveness

        // Reconstruct the *full* document object to pass to parent onChange
        const currentFullObject = tryParse(pretty(value), {}); // Get current full state
        const updatedKVPortion = unflatten(Object.fromEntries(nextLocalRows.map((r) => [r.key, r.value])));

        // Merge KV updates onto the full object, preserving excluded key data
        const mergedObject = { ...currentFullObject };
        Object.keys(updatedKVPortion).forEach(key => {
            const topLevelKey = key.split('.')[0];
            if (!excludedKeys.includes(topLevelKey)) { // Ensure we only merge KV-managed fields
                // Simple merge, overwrite leaf nodes
                mergedObject[key] = updatedKVPortion[key];
                // Note: Deeper merging might be needed if KV edits nested objects also containing arrays
            }
        });
        onChange(mergedObject); // Update the main JSON state
    };

     const addRow = () => { setRows(prev => [{ key: "", value: "" }, ...prev]); };
     const delRow = (idx) => {
        const keyToDelete = rows[idx]?.key; // Get the key being deleted
        const nextLocalRows = rows.filter((_, i) => i !== idx);
        setRows(nextLocalRows);

        // Reconstruct the full object, explicitly removing the deleted key
        const currentFullObject = tryParse(pretty(value), {});
        const rebuiltKV = unflatten(Object.fromEntries(nextLocalRows.map((r) => [r.key, r.value])));

        // Start with the full object
        const mergedObject = { ...currentFullObject };
        // Clear existing non-excluded keys that were managed by KV
         Object.keys(mergedObject).forEach(key => {
             if (!excludedKeys.includes(key)) {
                 delete mergedObject[key]; // Clear KV managed keys
             }
         });
         // Add back the current KV state
         Object.assign(mergedObject, rebuiltKV);

         // Ensure the deleted key is truly gone (important for nested keys)
         if (keyToDelete) {
             const parts = keyToDelete.split('.');
             let cur = mergedObject;
             while (parts.length > 1) {
                 const p = parts.shift();
                 if (!cur[p]) break; // Path doesn't exist anymore, stop
                 cur = cur[p];
             }
             if (cur && parts.length === 1) {
                 delete cur[parts[0]];
             }
         }

        onChange(mergedObject);
     };

    return ( /* ... JSX Structure ... */
         <div className="border rounded">
            <div className="p-2 flex items-center gap-2 bg-gray-50 border-b">
                <button className="px-2 py-1 border rounded bg-white hover:bg-gray-100 transition" onClick={addRow} disabled={isLoading}>➕ Add Field</button>
                <button className="px-2 py-1 border rounded bg-green-500 text-white hover:bg-green-600 transition" onClick={onSave} disabled={isLoading}>💾 Save Key/Values</button>
            </div>
             {isLoading ? <LoaderSpinner /> : (
                <div className="overflow-auto max-h-96">
                <table className="min-w-full text-sm">
                    <thead><tr>{cols.map(c=><th key={c} className="sticky top-0 bg-gray-100 p-2 border-b text-left text-gray-700">{c}</th>)}<th className="sticky top-0 bg-gray-100 p-2 border-b">Actions</th></tr></thead>
                    <tbody>
                    {rows.length === 0 ? ( <tr><td colSpan={3} className="p-6 text-center text-gray-500">No non-array fields found or add one.</td></tr> )
                    : rows.map((r, idx) => (
                        <tr key={idx} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 transition">
                        <td className="p-1.5 border-b"><input className="w-full border rounded px-2 py-1 font-mono text-xs" value={r.key} onChange={(e) => update(idx, "key", e.target.value)} placeholder="e.g., fieldName or nested.field" /></td>
                        <td className="p-1.5 border-b">
                            <textarea className="w-full border rounded px-2 py-1 font-mono text-xs h-16 resize-y" value={r.value} onChange={(e) => update(idx, "value", e.target.value)} placeholder="Value (primitive, ISO date, or JSON string)" rows={1}/>
                        </td>
                        <td className="p-1.5 border-b"><button className="text-xs text-red-600 underline hover:text-red-800" onClick={() => delRow(idx)}>🗑️ delete</button></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
        </div>
    );
}

// ArrayTable Component (Handles arrays, either wrapped or nested)
function ArrayTable({ fieldName, rows, setRows, onSave, isLoading }) {
    const cols = useMemo(() => inferColumns(rows), [rows]);
    const add = () => setRows((prev = []) => [{ _id: `new_${Date.now()}` }, ...prev]); // Safer default
    const edit = (id, key, val) => setRows((prev = []) => prev.map((r) => (r._id === id ? { ...r, [key]: val } : r)));
    const del = (id) => setRows((prev = []) => prev.filter((r) => r._id !== id));
    const isPrimitiveArray = cols.length === 2 && cols.includes('value');
    const primaryColName = isPrimitiveArray ? "Array Value (Primitives/JSON)" : "Data Field";

    return ( /* ... JSX Structure ... */
         <div className="border rounded">
            <div className="p-2 flex items-center gap-2 bg-gray-50 border-b">
                <button className="px-2 py-1 border rounded bg-white hover:bg-gray-100 transition" onClick={add} disabled={isLoading}>➕ Add Row</button>
                <button className="px-2 py-1 border rounded bg-green-500 text-white hover:bg-green-600 transition" onClick={onSave} disabled={isLoading}>💾 Save Array: {fieldName}</button>
            </div>
            {isLoading ? <LoaderSpinner /> : (
                <div className="overflow-auto max-h-96">
                <table className="min-w-full text-sm">
                     <thead className="sticky top-0 bg-gray-100">
                        <tr>
                            {cols.map((c) => (<th key={c} className="p-2 border-b text-left text-gray-700">{ c === "_id" ? "Index ID" : (isPrimitiveArray && c === "value" ? primaryColName : c) }</th>))}
                            <th className="p-2 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                      {!rows || rows.length === 0 ? ( // Added check for null/undefined rows
                        <tr><td colSpan={cols.length + 1} className="p-6 text-center text-gray-500">No rows. Add one to begin.</td></tr>
                      ) : rows.map((r) => (
                        <tr key={r._id} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 transition">
                          {cols.map((c) => (
                            <td key={c} className="p-1.5 border-b">
                              {c === "_id" ? ( <div className="px-2 py-1 rounded bg-gray-100 font-mono text-xs">{r._id.startsWith('new_') ? 'NEW' : r._id}</div> )
                              : ( <textarea className="w-full border rounded px-2 py-1 font-mono text-xs h-16 resize-y" value={r[c] ?? ""} onChange={(e) => edit(r._id, c, e.target.value)} placeholder={c === "value" ? "Value" : c} rows={1}/> )}
                            </td>
                          ))}
                          <td className="p-1.5 border-b"> <button className="text-xs text-red-600 underline hover:text-red-800" onClick={() => del(r._id)}>🗑️ delete</button> </td>
                        </tr>
                      ))}
                    </tbody>
                </table>
                </div>
            )}
        </div>
    );
}


/* ----------------------- main screen ----------------------- */

export default function AdminDataMaintenance() {
  const db = getFirestore();
  const uid = getAuth().currentUser?.uid || "";
  const [path, setPath] = useState("metadata/config");
  const [status, setStatus] = useState("Idle. Select a preset or enter path and click Read/List.");
  const [err, setErr] = useState("");

  const [docJson, setDocJson] = useState("{}");
  const [docExists, setDocExists] = useState(false);
  const [liveUnsub, setLiveUnsub] = useState(null);

  const isReading = status.startsWith("Reading") || status.startsWith("Listening");
  const isWriting = status.startsWith("Saving") || status.startsWith("Replacing") || status.startsWith("Deleting") || status.startsWith("Batch saving");

  // State derived from docJson
  const rawDocObj = useMemo(() => tryParse(docJson, {}), [docJson]);
  const wrapperKey = useMemo(() => getStrictWrapperKeyForPath(path), [path]);

  // Determine array fields present in the raw data, excluding the wrapper key itself
  const arrayFields = useMemo(() => {
    if (typeof rawDocObj !== 'object' || rawDocObj === null) return [];
    return Object.keys(rawDocObj).filter(k => k !== wrapperKey && Array.isArray(rawDocObj[k]));
  }, [rawDocObj, wrapperKey]);

  const [activeArray, setActiveArray] = useState(""); // State for dropdown selection

  // Auto-select logic for the array dropdown
  useEffect(() => {
    if (wrapperKey) {
        setActiveArray(ARRAY_WRAPPER_KEY); // Wrapped docs always target 'items'
    } else if (arrayFields.length > 0) {
        // If current selection is not valid OR no selection exists, pick the first one
        if (!activeArray || !arrayFields.includes(activeArray)) {
             setActiveArray(arrayFields[0]);
        }
    } else {
        setActiveArray(""); // No arrays found
    }
  }, [arrayFields, activeArray, wrapperKey, rawDocObj]); // Re-run when raw data changes


  // Derive rows for the ArrayTable based on selection/wrapperKey
  const arrayRows = useMemo(() => {
    let src = [];
    const targetKey = wrapperKey ? ARRAY_WRAPPER_KEY : activeArray; // Determine which key holds the array
    if (targetKey && rawDocObj && Array.isArray(rawDocObj[targetKey])) {
        src = rawDocObj[targetKey];
    }
    if (!Array.isArray(src)) return [];
    // Map items to rows for the table
    return src.map((item, i) => {
        const base = { _id: String(i) }; // Use index as ID
        if (item && typeof item === "object" && !Array.isArray(item)) {
            return { ...base, ...flatten(item) }; // Flatten objects within array
        } else {
            // Represent primitives or nested arrays as 'value' column (stringified if needed)
            return { ...base, value: typeof item === "string" ? item : JSON.stringify(item, null, 2) };
        }
    });
  }, [rawDocObj, activeArray, wrapperKey]);


  // Update main JSON state when ArrayTable rows change
  const setArrayRows = useCallback((nextRowsOrFn) => {
    setDocJson(prevJson => {
        const currentRaw = tryParse(prevJson, {});
        
        // Resolve functional update
        const nextRows = typeof nextRowsOrFn === 'function' 
            ? nextRowsOrFn(arrayRows) // Pass the memoized arrayRows to the function
            : nextRowsOrFn;

        // Rebuild the array from the table rows
        const rebuiltArray = nextRows.map(({ _id, ...rest }) => {
            const keys = Object.keys(rest);
            if (keys.length === 1 && keys[0] === "value") { return coerce(rest.value); }
            return unflatten(rest);
        });

        let updatedFullDoc;
        const targetArrayKey = wrapperKey ? ARRAY_WRAPPER_KEY : activeArray;
        if (targetArrayKey) {
             updatedFullDoc = { ...currentRaw, [targetArrayKey]: rebuiltArray };
        } else {
             console.error("setArrayRows called without a valid target array key.");
             updatedFullDoc = currentRaw;
        }
        return pretty(updatedFullDoc);
    });
  }, [activeArray, wrapperKey, arrayRows]); // Added arrayRows dependency for functional updates


  // Collection state
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState({});
  const [limit, setLimit] = useState(500); // <-- NEW: State for query limit
  const cols = useMemo(() => inferColumns(rows), [rows]);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => { return () => { if (liveUnsub) liveUnsub(); } }, [liveUnsub]);

  const explain = isDocumentPath(path) ? "Path type: 📝 Document" : isCollectionPath(path) ? "Path type: 📚 Collection" : "Enter Path";

  /* ---------- document actions ---------- */
  
  const readDoc = useCallback(async () => {
    if (isReading) return;
    if (liveUnsub) { liveUnsub(); setLiveUnsub(null); }
    setStatus("Reading doc…"); setErr("");
    try {
      const p = normalizePath(path, uid);
      const docRef = doc(db, ...pathParts(p));
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setDocJson(pretty(docSnap.data()));
        setDocExists(true);
        setStatus(`✅ Read doc: ${p}`);
      } else {
        setDocJson("{}");
        setDocExists(false);
        setStatus("ⓘ Doc does not exist.");
      }
    } catch (e) {
      setErr(String(e)); setStatus("❌ Error");
    }
  }, [path, uid, db, isReading, liveUnsub]);

  const listenDoc = useCallback(() => {
    if (isReading) return;
    if (liveUnsub) { liveUnsub(); setLiveUnsub(null); }
    setStatus("Listening for changes…"); setErr("");
    try {
      const p = normalizePath(path, uid);
      const unsub = onSnapshot(
        doc(db, ...pathParts(p)),
        (docSnap) => {
          if (docSnap.exists()) {
            setDocJson(pretty(docSnap.data()));
            setDocExists(true);
            setStatus(`🎧 Live update: ${p} @ ${nowIso()}`);
          } else {
            setDocJson("{}");
            setDocExists(false);
            setStatus("ⓘ Watched doc was deleted.");
          }
        },
        (e) => {
          setErr(String(e)); setStatus("❌ Listener error");
          if (liveUnsub) { liveUnsub(); setLiveUnsub(null); }
        }
      );
      setLiveUnsub(() => unsub);
    } catch (e) {
      setErr(String(e)); setStatus("❌ Error");
    }
  }, [path, uid, db, isReading, liveUnsub]);

  const saveMerge = useCallback(async () => {
    if (isWriting) return;
    setStatus("Saving (merge)…"); setErr("");
    try {
      const data = tryParse(docJson, null);
      if (data === null) throw new Error("Invalid JSON");
      const p = normalizePath(path, uid);
      await setDoc(doc(db, ...pathParts(p)), { ...data, _lastEdited: nowIso() }, { merge: true });
      setStatus("✅ Saved (merge).");
      if (!liveUnsub) await readDoc();
    } catch (e) {
      setErr(String(e)); setStatus("❌ Error");
    }
  }, [docJson, path, uid, db, isWriting, liveUnsub, readDoc]);

  const replaceSet = useCallback(async () => {
    if (isWriting) return;
    if (!window.confirm("Replace (Set) will OVERWRITE the entire document. Are you sure?")) return;
    setStatus("Replacing (set)…"); setErr("");
    try {
      const data = tryParse(docJson, null);
      if (data === null) throw new Error("Invalid JSON");
      const p = normalizePath(path, uid);
      await setDoc(doc(db, ...pathParts(p)), { ...data, _lastEdited: nowIso() });
      setStatus("✅ Replaced (set).");
      if (!liveUnsub) await readDoc();
    } catch (e) {
      setErr(String(e)); setStatus("❌ Error");
    }
  }, [docJson, path, uid, db, isWriting, liveUnsub, readDoc]);

  const deleteTheDoc = useCallback(async () => {
    if (isWriting) return;
    if (!window.confirm("Are you sure you want to permanently DELETE this document?")) return;
    setStatus("Deleting doc…"); setErr("");
    try {
      const p = normalizePath(path, uid);
      await deleteDoc(doc(db, ...pathParts(p)));
      setStatus("✅ Deleted doc.");
      setDocJson("{}");
      setDocExists(false);
      if (liveUnsub) { liveUnsub(); setLiveUnsub(null); }
    } catch (e) {
      setErr(String(e)); setStatus("❌ Error");
    }
  }, [path, uid, db, isWriting, liveUnsub]);

  const saveArray = useCallback(async () => {
    if (isWriting) return;
    const arrayFieldToSave = wrapperKey ? ARRAY_WRAPPER_KEY : activeArray;
    if (!arrayFieldToSave) { setErr("No array field targeted."); setStatus("❌ Error"); return; }
    setStatus(`Saving array "${arrayFieldToSave}"…`); setErr("");
    try {
        const fullDocData = tryParse(docJson, {});
        const p = normalizePath(path, uid);
        const arrayDataToSave = fullDocData[arrayFieldToSave];
        if (!Array.isArray(arrayDataToSave)) { throw new Error(`Data for "${arrayFieldToSave}" is not an array.`); }
        await setDoc(doc(db, ...pathParts(p)), { [arrayFieldToSave]: arrayDataToSave, _lastEdited: nowIso() }, { merge: true });
        setStatus(`✅ Saved array "${arrayFieldToSave}".`);
        if (!liveUnsub) await readDoc();
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  }, [docJson, path, uid, db, activeArray, wrapperKey, isWriting, liveUnsub, readDoc]);

  const saveKV = useCallback(async () => {
    if (isWriting) return;
    setStatus("Saving key/values…"); setErr("");
    try {
        const dataFromEditor = tryParse(docJson, {});
        const p = normalizePath(path, uid);
        let dataToSave = { ...dataFromEditor };
        
        // Determine fields managed by Array editor
        const currentWrapperKey = getStrictWrapperKeyForPath(path);
        const currentArrayFields = Object.keys(dataFromEditor).filter(k => k !== currentWrapperKey && Array.isArray(dataFromEditor[k]));
        const arrayManagedFields = currentWrapperKey ? [ARRAY_WRAPPER_KEY] : currentArrayFields;

        // Delete array-managed fields from the object we are about to save
        arrayManagedFields.forEach(field => { 
            if (dataToSave.hasOwnProperty(field)) { 
                delete dataToSave[field]; 
            } 
        });

        if (Object.keys(dataToSave).length > 0 || !docExists) { // Allow saving KV if doc doesn't exist
            await setDoc(doc(db, ...pathParts(p)), { ...dataToSave, _lastEdited: nowIso() }, { merge: true });
            setStatus("✅ Saved key/values.");
            if (!liveUnsub) await readDoc();
        } else { setStatus("✅ No non-array key/values to save."); }
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  }, [docJson, path, uid, db, isWriting, liveUnsub, readDoc, docExists]);


  /* ---------- collection actions ---------- */
  
  const listCollection = useCallback(async () => {
    if (isReading) return;
    setStatus("Listing collection…"); setErr("");
    setRows([]); // Clear previous results
    try {
      const p = normalizePath(path, uid);
      const collRef = collection(db, ...pathParts(p));
      const q = query(collRef, qLimit(limit)); // Using the limit state
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ ...flatten(d.data()), _id: d.id }));
      setRows(data);
      setSelected({});
      setStatus(`✅ Listed ${data.length} docs from ${p}. (Limit: ${limit})`);
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  }, [path, uid, db, isReading, limit]); // Added limit dependency

  const addCollectionRow = useCallback(() => setRows((r) => [{ _id: "__new__" + Math.random().toString(36).slice(2, 8) }, ...r]), []);
  const setCollectionCell = useCallback((id, key, val) => setRows((r) => r.map((x) => (x._id === id ? { ...x, [key]: val } : x))), []);
  const toggleSelection = useCallback((id) => setSelected((s) => ({ ...s, [id]: !s[id] })), []);
  
  const toggleAllSelection = useCallback(() => {
    const allSelected = rows.length > 0 && Object.keys(selected).length === rows.length && Object.values(selected).every(Boolean);
    if (allSelected) {
      setSelected({});
    } else {
      setSelected(Object.fromEntries(rows.map(r => [r._id, true])));
    }
  }, [rows, selected]);

  const batchSaveCollection = useCallback(async () => {
    if (isWriting) return;
    const toSave = rows.filter(r => r._id.startsWith('__new__') || r._id.startsWith('__import__'));
    const toUpdate = rows.filter(r => selected[r._id] && !r._id.startsWith('__'));
    
    if (toSave.length === 0 && toUpdate.length === 0) {
        setStatus("ⓘ No new/imported rows or selected rows to save.");
        return;
    }
    if (!window.confirm(`This will save/merge ${toSave.length} new/imported docs and update ${toUpdate.length} selected docs. Continue?`)) return;

    setStatus(`Batch saving ${toSave.length + toUpdate.length} docs...`); setErr("");
    const p = normalizePath(path, uid);
    const batch = writeBatch(db);
    
    try {
        // Save/merge selected existing docs
        toUpdate.forEach(r => {
            const { _id, ...data } = r;
            const docRef = doc(db, ...pathParts(p).concat(_id));
            batch.set(docRef, { ...unflatten(data), _lastEdited: nowIso() }, { merge: true });
        });

        // Save new/imported docs
        toSave.forEach((r) => {
            const { _id, ...data } = r;
            const newId = _id.startsWith('__new__') ? doc(collection(db, 'id_holder')).id : _id.replace('__import__', '');
            const docRef = doc(db, ...pathParts(p).concat(newId));
            batch.set(docRef, { ...unflatten(data), _lastEdited: nowIso() });
        });

        await batch.commit();
        setStatus(`✅ Batch save complete.`);
        await listCollection(); // Refresh
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  }, [rows, selected, path, uid, db, isWriting, listCollection]);

  const deleteSelectedCollection = useCallback(async () => {
    if (isWriting) return;
    const toDelete = Object.keys(selected).filter((id) => selected[id] && !id.startsWith("__"));
    if (!toDelete.length) { setStatus("ⓘ No existing rows selected to delete."); return; }
    if (!window.confirm(`Are you sure you want to permanently DELETE ${toDelete.length} document(s)?`)) return;

    setStatus(`Batch deleting ${toDelete.length} docs...`); setErr("");
    const p = normalizePath(path, uid);
    const batch = writeBatch(db);
    try {
        toDelete.forEach((id) => {
            batch.delete(doc(db, ...pathParts(p).concat(id)));
        });
        await batch.commit();
        setStatus(`✅ Batch delete complete.`);
        await listCollection(); // Refresh
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  }, [selected, path, uid, db, isWriting, listCollection]);

  const deleteSingleCollectionDoc = useCallback(async (id) => {
    if (isWriting || id.startsWith("__")) return;
    if (!window.confirm(`Are you sure you want to permanently DELETE document ${id}?`)) return;
    setStatus(`Deleting doc ${id}…`); setErr("");
    try {
      const p = normalizePath(path, uid);
      await deleteDoc(doc(db, ...pathParts(p).concat(id)));
      setStatus(`✅ Deleted doc ${id}.`);
      await listCollection(); // Refresh
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  }, [path, uid, db, isWriting, listCollection]);


  /* ---------- import / export ---------- */
  
  const exportJSON = useCallback(() => {
    const p = normalizePath(path, uid).replaceAll('/', '_');
    let dataToExport;
    let fileName;

    // For Doc view
    if (isDocumentPath(path)) {
        dataToExport = docJson;
        fileName = `${p}.json`;
    }
    // For Collection view
    else if (isCollectionPath(path)) {
        dataToExport = pretty(rows.map(({_id, ...data}) => ({ _id, ...unflatten(data) })));
        fileName = `${p}_collection.json`;
    } else {
        return;
    }
    
    const blob = new Blob([dataToExport], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);

  }, [docJson, rows, path, uid]);

  const importJSON = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        // For Doc view
        if (isDocumentPath(path)) {
          const data = tryParse(text, null);
          if (data === null) throw new Error("Invalid JSON file");
          setDocJson(pretty(data));
          setStatus(`ⓘ Loaded ${file.name}. Click Save/Replace to commit.`);
        }
        // For Collection view (imports array of docs)
        else if (isCollectionPath(path)) {
          const data = tryParse(text, null);
          if (!Array.isArray(data)) throw new Error("JSON file is not an array of documents");
          const importedRows = data.map((doc, idx) => {
             const id = doc._id || `__import__${idx}`;
             delete doc._id;
             return { ...flatten(doc), _id: id };
          });
          setRows(importedRows);
          setStatus(`ⓘ Loaded ${importedRows.length} docs from ${file.name}. Click Batch Save to commit.`);
        }
      } catch (err) {
        setErr(String(err)); setStatus("❌ Error importing file");
      }
      e.target.value = ""; // Clear file input
    };
    reader.readAsText(file);
  }, [path]);

  const exportCSV = useCallback(() => {
    // Only for Collection view
    if (!isCollectionPath(path) || !rows.length) return;
    try {
      const csv = toCSV(rows);
      const p = normalizePath(path, uid).replaceAll('/', '_');
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${p}_collection.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setErr(String(e)); setStatus("❌ Error exporting CSV");
    }
  }, [rows, path, uid]);

  const importCSV = useCallback((e) => {
    // Only for Collection view
    if (!isCollectionPath(path)) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const importedRows = fromCSV(text);
        setRows(importedRows);
        setStatus(`ⓘ Loaded ${importedRows.length} docs from ${file.name}. Click Batch Save to commit.`);
      } catch (err) {
        setErr(String(err)); setStatus("❌ Error importing CSV");
      }
      e.target.value = ""; // Clear file input
    };
    reader.readAsText(file);
  }, [path]);


  /* ---------- presets (WITH ALL CATALOGS) ---------- */
  const presets = useMemo(() => [
    // --- USER DATA ---
    { group: "User Data (Development Plan)", label: "👤 Dev Plan (Current)", value: "leadership_plan/<uid>/profile/plan" },
    { group: "User Data (Development Plan)", label: "📜 Dev Plan History (Coll)", value: "leadership_plan/<uid>/plan_history" },
    { group: "User Data (Development Plan)", label: "📊 Assessment History (Coll)", value: "leadership_plan/<uid>/assessment_history" },
    { group: "User Data (Daily Practice)", label: "✅ Daily Reps / Reflection", value: "user_commitments/<uid>/profile/active" },
    // --- *** REMOVED previous field-based presets *** ---
    { group: "User Data (Other)", label: "📝 Planning Drafts", value: "user_planning/<uid>/profile/drafts" },
    
    // --- APP DATASETS ---
    { group: "App DataSets (Global)", label: "⚙️ Global Config Root", value: "metadata/config" },
    { group: "App DataSets (Development Plan)", label: "🗺️ Leadership Domains (Tiers)", value: "metadata/config/catalog/leadership_domains" },
    { group: "App DataSets (Development Plan)", label: "🛠️ Skill Content Library (Courses)", value: "metadata/config/catalog/SKILL_CONTENT_LIBRARY" },
    { group: "App DataSets (Daily Practice)", label: "🏦 Daily Rep Bank", value: "metadata/config/catalog/COMMITMENT_BANK" },
    // --- *** ADDED CATALOG PRESETS *** ---
    { group: "App DataSets (Daily Practice)", label: "👤 Identity Anchor Catalog", value: "metadata/config/catalog/IDENTITY_ANCHOR_CATALOG" },
    { group: "App DataSets (Daily Practice)", label: "⚓ Habit Anchor Catalog", value: "metadata/config/catalog/HABIT_ANCHOR_CATALOG" },
    // --- *** END ADDED *** ---
    { group: "App DataSets (Other Features)", label: "🎯 Target Rep Catalog", value: "metadata/config/catalog/TARGET_REP_CATALOG" },
    { group: "App DataSets (Other Features)", label: "📚 Resource Library", value: "metadata/config/catalog/resource_library" },
    { group: "App DataSets (Other Features)", label: "⚡ Quick Challenges", value: "metadata/config/catalog/quick_challenge_catalog" },
    { group: "App DataSets (Other Features)", label: "🎬 Scenario Catalog", value: "metadata/config/catalog/scenario_catalog" },
    { group: "App DataSets (Other Features)", label: "🎥 Video Catalog", value: "metadata/config/catalog/video_catalog" },
    { group: "App DataSets (Other Features)", label: "📖 Reading Catalog (Wrapped)", value: "metadata/reading_catalog" },
  ], []);

  // Helper to get unique, ordered groups
  const presetGroups = useMemo(() => [...new Set(presets.map(p => p.group))], [presets]);


  /* ----------------------- render ----------------------- */

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">🔥 Firestore Data Manager (Admin)</h1>
      
      <AdminWarning /> {/* <-- NEW: Added Warning */}

      {/* Presets */}
      <div className="flex flex-col gap-4 mb-4">
        {presetGroups.map(group => (
            <div key={group} className="flex flex-wrap items-center gap-2 p-3 bg-white border rounded-lg shadow-sm">
                <span className="text-sm font-semibold text-gray-800 w-full sm:w-auto sm:min-w-[200px] pr-2">{group}:</span>
                <div className="flex flex-wrap gap-2">
                {presets.filter(p => p.group === group).map((p) => (
                    <button key={p.value} className="px-3 py-1.5 rounded-full border border-blue-200 text-sm bg-white text-blue-700 hover:bg-blue-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => { setPath(p.value); if (isDocumentPath(p.value)) readDoc(); else listCollection(); }} title={p.value} disabled={isReading || isWriting}>
                        {p.label}
                    </button>
                ))}
                </div>
            </div>
        ))}
      </div>

      {/* Path Input */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
         <div className="flex items-center gap-2 mb-2">
          <input className="flex-1 border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm shadow-inner focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            value={path} onChange={(e) => setPath(e.target.value)}
            placeholder="collection/document path… (supports <uid>)"
            onKeyDown={(e) => { if (e.key === "Enter") { if (isDocumentPath(path)) readDoc(); else if (isCollectionPath(path)) listCollection(); }}}
            disabled={isReading || isWriting}
          />
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50" onClick={() => alert("Path Segments:\n- EVEN = Document (e.g., users/uid)\n- ODD = Collection (e.g., users)\n- Use <uid> for current User ID.")} disabled={isReading || isWriting}>❓ Path Help </button>
        </div>
        <div className="text-sm text-gray-600 font-medium">{explain}</div>
      </div>

      {/* Status Bar */}
       <div className={`mb-4 p-3 rounded-lg shadow-sm border ${err ? 'bg-red-50 border-red-300' : status.includes("✅") ? 'bg-green-50 border-green-300' : status.includes("❌") ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'}`}>
        <div className={`text-sm font-semibold ${err ? "text-red-700" : status.includes("✅") ? "text-green-700" : status.includes("❌") ? "text-red-700" : "text-blue-700"}`}>Status: {status}</div>
        {err && <div className="mt-1 text-xs text-red-600 break-words">Error Details: {err}</div>}
      </div>

      {/* Document View */}
      {isDocumentPath(path) ? (
        <>
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-lg shadow-md border">
             <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-md disabled:opacity-50" onClick={readDoc} disabled={isReading || isWriting}>🔍 Read Doc</button>
            <button className={`px-4 py-2 rounded-lg border transition disabled:opacity-50 ${liveUnsub ? 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200' : 'bg-white text-gray-700 hover:bg-gray-100'}`} onClick={liveUnsub ? () => { liveUnsub(); setLiveUnsub(null); setStatus("Idle."); } : listenDoc} disabled={isReading || isWriting}> {liveUnsub ? '🔴 Stop Listening' : '👂 Listen (Live)'} </button>
            <button className="px-4 py-2 rounded-lg border border-green-300 bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition disabled:opacity-50" onClick={saveMerge} disabled={isReading || isWriting}>💾 Save (Merge)</button>
            <button className="px-4 py-2 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-700 font-semibold hover:bg-yellow-100 transition disabled:opacity-50" onClick={replaceSet} disabled={isReading || isWriting}>🔄 Replace (Set)</button>
            <button className="px-4 py-2 rounded-lg border border-red-600 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition disabled:opacity-50" onClick={deleteTheDoc} disabled={!docExists || isReading || isWriting}>🗑️ Delete Doc</button>
            <div className="ml-auto flex items-center gap-3">
               <button className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 transition disabled:opacity-50" onClick={exportJSON} disabled={!docExists}>📥 Export JSON</button>
              <label className={`px-4 py-2 rounded-lg border cursor-pointer bg-white hover:bg-gray-100 transition ${isReading || isWriting ? 'opacity-50 cursor-not-allowed' : ''}`}>📤 Import JSON <input type="file" accept="application/json" className="hidden" onChange={importJSON} disabled={isReading || isWriting}/> </label>
              <div className="text-sm font-medium">Exists: <span className={docExists ? "text-green-600" : "text-red-600"}>{String(docExists)}</span></div>
            </div>
          </div>

          {/* Editors Layout */}
          <div className="flex flex-col xl:flex-row gap-6 mb-6">
            {/* Left: JSON Editor */}
             <div className="flex-1 bg-white p-4 rounded-lg shadow-md border">
                 <div className="text-base font-semibold text-gray-800 mb-2">Full Document JSON (Raw Edit)</div>
                <textarea className="w-full min-h-[400px] xl:min-h-[600px] font-mono border border-gray-300 rounded p-3 text-xs bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100" spellCheck={false} value={docJson} onChange={(e) => setDocJson(e.target.value)} placeholder="Document content..." disabled={isReading || isWriting}/>
            </div>

            {/* Right: KV and Array Editors */}
            <div className="flex-1 flex flex-col gap-6">
                 {/* KV Editor */}
                <div className="bg-white p-4 rounded-lg shadow-md border">
                  <div className="text-base font-semibold text-gray-800 mb-2">Key/Value Table (Non-Array Fields)</div>
                   {isReading ? <LoaderSpinner /> : (
                      <KVEditor
                        value={rawDocObj}
                        // Exclude the strictly defined wrapper key OR the currently selected array field
                        excludedKeys={wrapperKey ? [ARRAY_WRAPPER_KEY] : (activeArray ? [activeArray] : [])}
                        onChange={(obj) => setDocJson(pretty(obj))}
                        onSave={saveKV}
                        isLoading={isReading || isWriting}
                      />
                   )}
                </div>

                {/* Array Editor */}
                <div className="bg-white p-4 rounded-lg shadow-md border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-base font-semibold text-gray-800">Array Table Editor</div>
                     {/* Show selector only if NOT strictly wrapped AND there are arrays */}
                     {!wrapperKey && arrayFields.length > 0 && (
                        <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Field:</span>
                        <select
                           className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                           value={activeArray}
                           onChange={(e) => setActiveArray(e.target.value)}
                           disabled={isReading || isWriting} // Disable during operations
                        >
                            {arrayFields.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                        </div>
                     )}
                     {/* Indicate if editing a wrapped array */}
                     {wrapperKey && <span className="text-sm text-gray-600 font-medium">(Editing '{ARRAY_WRAPPER_KEY}' array in wrapped doc)</span>}
                  </div>
                  {isReading ? <LoaderSpinner /> : (wrapperKey || activeArray) ? ( // Render if wrapped OR an array is selected
                    <ArrayTable
                      fieldName={wrapperKey ? ARRAY_WRAPPER_KEY : activeArray}
                      rows={arrayRows}
                      setRows={setArrayRows}
                      onSave={saveArray}
                      isLoading={isReading || isWriting}
                    />
                  ) : (
                    <div className="text-sm text-gray-600 p-4 border rounded bg-gray-50 flex items-center gap-2">
                       <AlertTriangle className="w-4 h-4 text-orange-500"/>
                       {isReading ? 'Loading...' : 'No array field available or selected in this document.'}
                    </div>
                  )}
                </div>
            </div>
          </div>
        </>
      // Collection View
      ) : isCollectionPath(path) ? (
         <>
            {/* Collection Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-lg shadow-md border">
             <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-md disabled:opacity-50" onClick={listCollection} disabled={isReading || isWriting}>📋 List Collection</button>
             {/* NEW: Editable limit */}
             <div className="flex items-center gap-1">
                <label htmlFor="limit" className="text-sm font-medium text-gray-600">Limit:</label>
                <input
                    type="number"
                    id="limit"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value) || 500)}
                    className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm shadow-inner disabled:bg-gray-100"
                    disabled={isReading || isWriting}
                />
             </div>
             <button className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 transition disabled:opacity-50" onClick={addCollectionRow} disabled={isReading || isWriting}>➕ Add New Row (Local)</button>
             <button className="px-4 py-2 rounded-lg border border-green-300 bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition disabled:opacity-50" onClick={batchSaveCollection} disabled={!rows.length || isReading || isWriting}>💾 Batch Save All Changes</button>
             <button className="px-4 py-2 rounded-lg border border-red-600 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition disabled:opacity-50" onClick={deleteSelectedCollection} disabled={!Object.values(selected).some(Boolean) || isReading || isWriting}>🗑️ Delete Selected</button>
             <div className="ml-auto flex items-center gap-3">
                 <button className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 transition disabled:opacity-50" onClick={exportCSV} disabled={!rows.length}>📥 Export CSV</button>
                 <label className={`px-4 py-2 rounded-lg border cursor-pointer bg-white hover:bg-gray-100 transition ${isReading || isWriting ? 'opacity-50 cursor-not-allowed' : ''}`}>📤 Import JSON <input type="file" accept="application/json" className="hidden" onChange={importJSON} disabled={isReading || isWriting}/> </label>
                 <label className={`px-4 py-2 rounded-lg border cursor-pointer bg-white hover:bg-gray-100 transition ${isReading || isWriting ? 'opacity-50 cursor-not-allowed' : ''}`}>📤 Import CSV <input type="file" accept=".csv,text/csv" className="hidden" onChange={importCSV} disabled={isReading || isWriting}/> </label>
             </div>
            </div>
            {/* Collection Table */}
            <div className="overflow-x-auto border rounded-lg shadow-md bg-white">
             {isReading ? <LoaderSpinner/> : (
                <table className="min-w-full text-sm">
                   <thead className="bg-gray-100 sticky top-0 z-10"> {/* Added z-index */}
                     <tr>
                        <th className="p-2 border-b w-10">
                            {/* NEW: Select All Checkbox */}
                            <input 
                                type="checkbox" 
                                checked={rows.length > 0 && Object.keys(selected).length === rows.length && Object.values(selected).every(Boolean)} 
                                onChange={toggleAllSelection} 
                                title="Select All" 
                            />
                        </th>
                        {cols.map((c) => <th key={c} className="p-3 border-b text-left font-semibold text-gray-700">{c}</th>)}
                        <th className="p-3 border-b font-semibold text-gray-700">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                    {!rows.length ? ( <tr><td colSpan={cols.length + 2} className="p-8 text-center text-gray-500">No documents loaded. Click <b>List Collection</b> or <b>Add New Row</b>.</td></tr> )
                    : rows.map((r) => (
                        <tr key={r._id} className={`transition ${selected[r._id] ? 'bg-yellow-100' : 'odd:bg-white even:bg-gray-50'} hover:bg-yellow-50`}>
                            <td className="p-2 border-b align-top text-center"><input type="checkbox" checked={!!selected[r._id]} onChange={() => toggleSelection(r._id)} /></td>
                            {cols.map((c) => (
                               <td key={c} className="p-1.5 border-b align-top">
                                {/* NEW: _id is now read-only */}
                                {c === "_id" ? ( 
                                    <div className={`px-2 py-1 rounded font-mono text-xs ${r._id.startsWith("__new__") || r._id.startsWith("__import__") ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
                                        {r._id.startsWith("__") ? 'NEW/IMPORT' : r._id}
                                    </div> 
                                ) : ( 
                                    <textarea 
                                        className="w-full border rounded px-2 py-1 font-mono text-xs h-16 resize-y disabled:bg-gray-50" 
                                        value={r[c] ?? ""} 
                                        onChange={(e) => setCollectionCell(r._id, c, e.target.value)} 
                                        placeholder={c} 
                                        title={c} 
                                        rows={1} 
                                        disabled={isWriting}
                                    /> 
                                )}
                               </td>
                            ))}
                            <td className="p-2 border-b align-top text-center">
                               <button className="text-xs text-red-600 underline hover:text-red-800 disabled:opacity-50" onClick={() => deleteSingleCollectionDoc(r._id)} disabled={isReading || isWriting || r._id.startsWith('__new__') || r._id.startsWith('__import__')}>🗑️ delete</button>
                            </td>
                        </tr>
                    ))}
                   </tbody>
                </table>
             )}
            </div>
         </>
      ) : null}
    </div>
  );
}