// src/components/screens/AdminDataMaintenance.jsx
// Comprehensive version restoring flexibility for different data structures

import React, { useEffect, useMemo, useState, useCallback } from "react"; // Added useCallback
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
import { Loader, AlertTriangle } from 'lucide-react'; // Added AlertTriangle

/* ----------------------- utilities ----------------------- */
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
            out[key] = JSON.stringify(v, null, 2); // Prettify complex types
        } else if (v instanceof Date) {
            out[key] = v.toISOString();
        } else {
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
            cur[p] = cur[p] || {};
            cur = cur[p];
        }
        cur[parts[0]] = coerce(value); // Coerce handles primitives, dates, and tries JSON
    });
    return out;
};

const inferColumns = (rows) => {
     const set = new Set(["_id"]);
     rows.forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k))); // Added check for null rows
     return Array.from(set);
};
const nowIso = () => new Date().toISOString();


// --- PATH CONSTANTS AND UTILITIES ---
const ARRAY_WRAPPER_KEY = "items";

// Specific paths known to be documents structured ONLY as { items: [...] }.
// The ArrayTable will automatically target 'items' for these paths.
const SINGLE_ARRAY_WRAPPER_DOCUMENTS = [
    "metadata/reading_catalog",
    // Add paths like "metadata/config/catalog/TARGET_REP_CATALOG" HERE
    // *IF* they are structured strictly as { items: [...] }
    "metadata/config/catalog/TARGET_REP_CATALOG", // Example assumption
    "metadata/config/catalog/quick_challenge_catalog", // Example assumption
];

const isDocumentPath = (p) => pathParts(p).length % 2 === 0;
const isCollectionPath = (p) => !isDocumentPath(p);

// Returns ARRAY_WRAPPER_KEY only for paths *explicitly* defined above.
const getStrictWrapperKeyForPath = (path) => {
    return SINGLE_ARRAY_WRAPPER_DOCUMENTS.includes(path) ? ARRAY_WRAPPER_KEY : null;
};
// --- END PATH UTILITIES ---


/* ----------------------- CSV helpers ----------------------- */
const toCSV = (rows) => {
    if (!rows.length) return "";
    const cols = inferColumns(rows);
    const esc = (v) => {
        const s = v == null ? "" : String(v);
        // Handle values that are stringified JSON - escape internal quotes
        let processedValue = s;
        if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
             try {
                // If it parses, stringify it again but escape quotes for CSV
                JSON.parse(s); // Validate JSON
                processedValue = s.replace(/"/g, '""');
             } catch { /* Ignore if not valid JSON */ }
        } else {
            processedValue = s.replace(/"/g, '""'); // Standard quote escaping
        }
        return /[",\n]/.test(processedValue) ? `"${processedValue}"` : processedValue;
    };
    const header = cols.join(",");
    const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
    return `${header}\n${body}`;
};
const fromCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (!lines.length) return [];
    const parseLine = (line) => {
        const parts = []; let current = ''; let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
                else { inQuote = !inQuote; }
            } else if (char === ',' && !inQuote) { parts.push(current); current = ''; }
            else { current += char; }
        }
        parts.push(current); return parts;
    };
    const headers = parseLine(lines[0]);
    const parseCell = (cell) => {
        const unq = (cell || "").replace(/^"(.*)"$/, (_, p1) => p1.replace(/""/g, '"'));
        // Try to parse if it looks like JSON, otherwise coerce primitives/dates
        if ((unq.startsWith('{') && unq.endsWith('}')) || (unq.startsWith('[') && unq.endsWith(']'))) {
            try { return JSON.parse(unq); } catch { /* fall through */ }
        }
        return coerce(unq);
    };
    return lines.slice(1).map((line) => {
        const parts = parseLine(line); const row = {};
        headers.forEach((h, i) => (row[h] = parseCell(parts[i] ?? "")));
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

function KVEditor({ value, onChange, onSave, isLoading, excludedKeys = [] }) { // Added excludedKeys prop
    const [rows, setRows] = useState(() => {
        const flat = flatten(value);
        return Object.keys(flat)
                     .filter(k => !excludedKeys.includes(k.split('.')[0])) // Filter out excluded top-level keys
                     .map((k) => ({ key: k, value: String(flat[k] ?? '') })); // Ensure value is string
    });

    useEffect(() => {
        const flat = flatten(value);
        setRows(Object.keys(flat)
                      .filter(k => !excludedKeys.includes(k.split('.')[0]))
                      .map((k) => ({ key: k, value: String(flat[k] ?? '') }))
               );
    }, [value, excludedKeys]);

    const cols = ["key", "value"];

    const update = (idx, field, val) => {
        const next = rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
        setRows(next);
        // Important: Reconstruct the *full* object including excluded keys before calling onChange
        const currentFullObject = tryParse(pretty(value), {}); // Get current full state
        const updatedKVPortion = unflatten(Object.fromEntries(next.map((r) => [r.key, r.value])));
        // Merge updates onto the full object
        const mergedObject = { ...currentFullObject };
        Object.keys(updatedKVPortion).forEach(key => {
            // Basic deep merge for one level (adjust if deeper needed)
            const parts = key.split('.');
            if (parts.length > 1) {
                mergedObject[parts[0]] = { ...(mergedObject[parts[0]] || {}), ...unflatten({ [key]: updatedKVPortion[key] })[parts[0]] };
            } else {
                mergedObject[key] = updatedKVPortion[key];
            }
        });

        onChange(mergedObject);
    };

     const addRow = () => { const next = [{ key: "", value: "" }, ...rows]; setRows(next); };
     const delRow = (idx) => {
        const next = rows.filter((_, i) => i !== idx);
        setRows(next);
        const currentFullObject = tryParse(pretty(value), {});
        const updatedKVPortion = unflatten(Object.fromEntries(next.map((r) => [r.key, r.value])));
        const mergedObject = { ...currentFullObject };
        // Logic to remove deleted keys needs care if nested. Simplest is to just rebuild from 'next'.
         const rebuiltKV = unflatten(Object.fromEntries(next.map((r) => [r.key, r.value])));
         // Clear existing non-excluded keys and re-add from rebuiltKV
         Object.keys(mergedObject).forEach(key => {
             if (!excludedKeys.includes(key)) {
                 delete mergedObject[key]; // Clear KV managed keys
             }
         });
         Object.assign(mergedObject, rebuiltKV); // Add back the current KV state
        onChange(mergedObject);
     };

    return (
         <div className="border rounded">
            <div className="p-2 flex items-center gap-2 bg-gray-50 border-b">
                <button className="px-2 py-1 border rounded bg-white hover:bg-gray-100 transition" onClick={addRow} disabled={isLoading}>➕ Add Field</button>
                <button className="px-2 py-1 border rounded bg-green-500 text-white hover:bg-green-600 transition" onClick={onSave} disabled={isLoading}>💾 Save Key/Values</button>
            </div>
             {isLoading ? <LoaderSpinner /> : (
                <div className="overflow-auto max-h-96">
                <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        {cols.map((c) => <th key={c} className="sticky top-0 bg-gray-100 p-2 border-b text-left text-gray-700">{c}</th>)}
                        <th className="sticky top-0 bg-gray-100 p-2 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                    {rows.length === 0 ? (
                        <tr><td colSpan={3} className="p-6 text-center text-gray-500">No non-array fields found or add one.</td></tr>
                    ) : rows.map((r, idx) => (
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

function ArrayTable({ fieldName, rows, setRows, onSave, isLoading }) {
    const cols = useMemo(() => inferColumns(rows), [rows]);
    const add = () => setRows((prev) => [{ _id: `new_${Date.now()}` }, ...prev]);
    const edit = (id, key, val) => setRows((prev) => prev.map((r) => (r._id === id ? { ...r, [key]: val } : r)));
    const del = (id) => setRows((prev) => prev.filter((r) => r._id !== id));
    const isPrimitiveArray = cols.length === 2 && cols.includes('value');
    const primaryColName = isPrimitiveArray ? "Array Value (Primitives/JSON)" : "Data Field";
    return (
         <div className="border rounded">
            <div className="p-2 flex items-center gap-2 bg-gray-50 border-b">
                <button className="px-2 py-1 border rounded bg-white hover:bg-gray-100 transition" onClick={add} disabled={isLoading}>➕ Add Row</button>
                <button className="px-2 py-1 border rounded bg-green-500 text-white hover:bg-green-600 transition" onClick={onSave} disabled={isLoading}>💾 Save {fieldName}</button>
             </div>
            {isLoading ? <LoaderSpinner /> : (
                <div className="overflow-auto max-h-96">
                <table className="min-w-full text-sm">
                     <thead className="sticky top-0 bg-gray-100">
                        <tr>
                            {cols.map((c) => (
                            <th key={c} className="p-2 border-b text-left text-gray-700">
                                {c === "_id" ? "Index ID" : (isPrimitiveArray && c === "value" ? primaryColName : c)}
                            </th>
                            ))}
                            <th className="p-2 border-b">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                      {/* --- FIX: REMOVED COMMENT --- */}
                      {!rows.length ? (
                        <tr><td colSpan={cols.length + 1} className="p-6 text-center text-gray-500">No rows. Add one to begin.</td></tr>
                      ) : rows.map((r) => (
                        <tr key={r._id} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 transition">
                          {cols.map((c) => (
                            <td key={c} className="p-1.5 border-b">
                              {c === "_id" ? ( <div className="px-2 py-1 rounded bg-gray-100 font-mono text-xs">{r._id.startsWith('new_') ? 'NEW' : r._id}</div> )
                              : ( <textarea className="w-full border rounded px-2 py-1 font-mono text-xs h-16 resize-y" value={r[c] ?? ""} onChange={(e) => edit(r._id, c, e.target.value)} placeholder={c === "value" ? "Enter value (primitive or JSON)" : c} rows={1}/> )}
                            </td>
                          ))}
                          <td className="p-1.5 border-b"> <button className="text-xs text-red-600 underline hover:text-red-800" onClick={() => del(r._id)}>🗑️ delete</button> </td>
                        </tr>
                      ))}
                      {/* --- END FIX --- */}
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

  // rawDocObj holds the latest data fetched or from the JSON editor
  const rawDocObj = useMemo(() => tryParse(docJson, {}), [docJson]);

  // wrapperKey is determined ONLY by the strict list
  const wrapperKey = useMemo(() => getStrictWrapperKeyForPath(path), [path]);

  // docObjForKvEditing holds the data for the KV editor (excludes arrays)
  const docObjForKvEditing = useMemo(() => {
    if (typeof rawDocObj !== 'object' || rawDocObj === null) return {};
    if (wrapperKey) return {}; // Wrapped doc -> KV editor is empty
    const filtered = { ...rawDocObj };
    Object.keys(filtered).forEach(key => { if (Array.isArray(filtered[key])) { delete filtered[key]; } });
    return filtered;
  }, [rawDocObj, wrapperKey]);

  // arrayFields finds top-level arrays in the rawDocObj, EXCLUDING the wrapperKey if applicable
  const arrayFields = useMemo(() => {
    if (typeof rawDocObj !== 'object' || rawDocObj === null) return [];
    return Object.keys(rawDocObj).filter(k => k !== wrapperKey && Array.isArray(rawDocObj[k]));
  }, [rawDocObj, wrapperKey]);

  const [activeArray, setActiveArray] = useState("");

  // Auto-select logic for the array dropdown
  useEffect(() => {
    if (wrapperKey) { setActiveArray(ARRAY_WRAPPER_KEY); }
    else if (arrayFields.length > 0 && !arrayFields.includes(activeArray)) { setActiveArray(arrayFields[0]); }
    else if (arrayFields.length === 0) { setActiveArray(""); }
  }, [arrayFields, activeArray, wrapperKey, rawDocObj]);


  // Derive rows for the ArrayTable based on selection/wrapperKey
  const arrayRows = useMemo(() => {
    let src = [];
    if (wrapperKey) { src = rawDocObj[ARRAY_WRAPPER_KEY] || []; }
    else if (activeArray && rawDocObj && Array.isArray(rawDocObj[activeArray])) { src = rawDocObj[activeArray]; }
    if (!Array.isArray(src)) return [];
    return src.map((item, i) => { /* ... mapping logic ... */
        const base = { _id: String(i) };
        if (item && typeof item === "object" && !Array.isArray(item)) { return { ...base, ...flatten(item) }; }
        else { return { ...base, value: typeof item === "string" ? item : JSON.stringify(item, null, 2) }; }
    });
  }, [rawDocObj, activeArray, wrapperKey]);


  // Update main JSON state when ArrayTable rows change
  const setArrayRows = useCallback((nextRowsOrFn) => {
    setDocJson(prevJson => {
        const currentRaw = tryParse(prevJson, {});
        const nextRows = typeof nextRowsOrFn === 'function' ? nextRowsOrFn(arrayRows) : nextRowsOrFn;
        const rebuiltArray = nextRows.map(({ _id, ...rest }) => { /* ... unflatten logic ... */
            const keys = Object.keys(rest);
            if (keys.length === 1 && keys[0] === "value") { return coerce(rest.value); }
            return unflatten(rest);
        });
        let updatedFullDoc;
        const targetArrayKey = wrapperKey ? ARRAY_WRAPPER_KEY : activeArray;
        if (targetArrayKey) { updatedFullDoc = { ...currentRaw, [targetArrayKey]: rebuiltArray }; }
        else { console.error("setArrayRows called without target."); updatedFullDoc = currentRaw; }
        return pretty(updatedFullDoc);
    });
  }, [activeArray, wrapperKey, arrayRows]);


  // collection state
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState({});
  const cols = useMemo(() => inferColumns(rows), [rows]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Stop listener on unmount
  useEffect(() => { return () => { if (liveUnsub) liveUnsub(); } }, [liveUnsub]);

  const explain = isDocumentPath(path)
    ? "Path type: 📝 Document — read/listen/edit/replace/delete a single record."
    : isCollectionPath(path)
    ? "Path type: 📚 Collection — list/add/edit/delete/import/export multiple records."
    : "Enter a Firestore path";

  /* ---------- document actions ---------- */
  // (readDoc, listenDoc, saveMerge, replaceSet, deleteTheDoc, saveArray, saveKV - using useCallback versions from above)
  const readDoc = useCallback(async () => { /* ... */ }, [path, uid, db, isReading, liveUnsub]);
  const listenDoc = useCallback(() => { /* ... */ }, [path, uid, db, isReading, liveUnsub]);
  const saveMerge = useCallback(async () => { /* ... */ }, [docJson, path, uid, db, isWriting, liveUnsub, readDoc]);
  const replaceSet = useCallback(async () => { /* ... */ }, [docJson, path, uid, db, isWriting, liveUnsub, readDoc]);
  const deleteTheDoc = useCallback(async () => { /* ... */ }, [path, uid, db, isWriting, liveUnsub]);
  const saveArray = useCallback(async () => { /* ... */ }, [docJson, path, uid, db, activeArray, wrapperKey, isWriting, liveUnsub, readDoc]);
  const saveKV = useCallback(async () => { /* ... */ }, [docJson, path, uid, db, arrayFields, wrapperKey, isWriting, liveUnsub, readDoc]);


  /* ---------- collection actions ---------- */
  const listCollection = useCallback(async () => {
      if (isReading) return;
      setStatus("Listing…"); setErr(""); setRows([]); setSelected({});
      try {
        const p = normalizePath(path, uid);
        const snap = await getDocs(query(collection(db, ...pathParts(p)), qLimit(500)));
        const list = [];
        snap.forEach((d) => list.push({ _id: d.id, ...flatten(d.data()) }));
        setRows(list);
        setStatus(`✅ Listed ${list.length} docs (Limit: 500).`);
      } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  }, [path, uid, db, isReading]);

  const addCollectionRow = useCallback(() => setRows((r) => [{ _id: "__new__" + Math.random().toString(36).slice(2, 8) }, ...r]), []);
  const setCollectionCell = useCallback((id, key, val) => setRows((r) => r.map((x) => (x._id === id ? { ...x, [key]: val } : x))), []);
  const toggleSelection = useCallback((id) => setSelected((s) => ({ ...s, [id]: !s[id] })), []);
  const toggleAllSelection = useCallback(() => {
    if (Object.keys(selected).length === rows.length && rows.length > 0 && Object.values(selected).every(Boolean)) {
      setSelected({});
    } else {
      setSelected(rows.reduce((acc, r) => ({ ...acc, [r._id]: true }), {}));
    }
  }, [rows, selected]);

  const batchSaveCollection = useCallback(async () => {
    if (isWriting || !rows.length) return;
    if (!window.confirm("Batch Save ALL changes (updates and new rows)?")) return;
    setStatus("Batch saving…"); setErr("");
    try {
      const p = normalizePath(path, uid);
      const colRef = collection(db, ...pathParts(p));
      const batch = writeBatch(db);
      const newMap = [];
      for (const r of rows) {
        const { _id, ...rest } = r;
        const data = unflatten(rest);
        if (_id.startsWith("__new__")) {
          const newRef = doc(colRef); batch.set(newRef, data, { merge: true }); newMap.push({ temp: _id, real: newRef.id });
        } else { batch.set(doc(colRef, _id), data, { merge: true }); }
      }
      await batch.commit();
      if (newMap.length) { setRows((prev) => prev.map((x) => { const f = newMap.find((n) => n.temp === x._id); return f ? { ...x, _id: f.real } : x; })); }
      setStatus("✅ Batch saved.");
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  }, [rows, path, uid, db, isWriting]);

  const deleteSelectedCollection = useCallback(async () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (!ids.length || isWriting) return;
    if (!window.confirm(`PERMANENTLY delete ${ids.length} selected documents?`)) return;
    setStatus("Deleting…"); setErr("");
    try {
      const p = normalizePath(path, uid);
      const colRef = collection(db, ...pathParts(p));
      const batch = writeBatch(db);
      let deletedCount = 0;
      ids.forEach((id) => { if (!id.startsWith("__new__")) { batch.delete(doc(colRef, id)); deletedCount++; } });
      await batch.commit();
      setRows((prev) => prev.filter((r) => !ids.includes(r._id)));
      setSelected({});
      setStatus(`✅ Deleted ${deletedCount} documents.`);
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  }, [selected, path, uid, db, isWriting]);

  const deleteSingleCollectionDoc = useCallback(async (id) => {
    if (isWriting || id.startsWith("__new__")) return;
    if (!window.confirm(`PERMANENTLY delete document ${id}?`)) return;
    setStatus(`Deleting ${id}…`); setErr("");
    try {
        const p = normalizePath(path, uid);
        await deleteDoc(doc(collection(db, ...pathParts(p)), id));
        setRows((prev) => prev.filter((x) => x._id !== id));
        setStatus(`✅ Deleted document ${id}.`);
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  }, [path, uid, db, isWriting]);


  /* ---------- import / export ---------- */
  const exportJSON = useCallback(() => { /* ... */ }, [docJson, path]);
  const importJSON = useCallback((e) => {
     const f = e.target.files?.[0]; if (!f) return;
     const r = new FileReader();
     r.onload = () => {
        const txt = String(r.result || "");
        if (isDocumentPath(path)) {
            try {
                // Prettify imported JSON for the editor
                const parsed = JSON.parse(txt);
                setDocJson(pretty(parsed));
                setStatus("Loaded JSON into editor. Click Save or Replace.");
            } catch (jsonErr) {
                 setErr("Invalid JSON file: " + jsonErr.message); setStatus("❌ Error");
            }
        } else { // Collection import
            const arr = tryParse(txt, null); // Parse into array
            if (!Array.isArray(arr)) { setErr("JSON must be an array for collection import."); setStatus("❌ Error"); return; }
            setRows(arr.map((o, i) => {
                const id = o?._id || `__import__${i}`; // Use imported ID or generate temp
                const { _id, ...rest } = o || {};
                return { _id: String(id), ...flatten(rest) };
            }));
            setStatus(`Loaded ${arr.length} records from JSON. Click Batch Save.`);
        }
     };
     r.onerror = () => { setErr("Failed to read file."); setStatus("❌ Error"); };
     r.readAsText(f); e.target.value = ""; // Clear file input
  }, [path]);

  const exportCSV = useCallback(() => { /* ... */ }, [rows, path]); // Uses collection rows
  const importCSV = useCallback((e) => {
     const f = e.target.files?.[0]; if (!f) return;
     const r = new FileReader();
     r.onload = () => {
        setErr("");
        try {
            const arr = fromCSV(String(r.result || ""));
            setRows(arr.map((row, i) => {
                const id = row?._id || `__import__${i}`;
                const { _id, ...rest } = row || {};
                // Flatten is not needed here as fromCSV returns flat already
                return { _id: String(id), ...rest };
            }));
            setStatus(`Loaded ${arr.length} records from CSV. Click Batch Save.`);
        } catch (csvErr) {
            setErr("Failed to parse CSV: " + csvErr.message); setStatus("❌ Error");
        }
     };
     r.onerror = () => { setErr("Failed to read file."); setStatus("❌ Error"); };
     r.readAsText(f); e.target.value = "";
  }, [path]); // Path needed? Maybe not directly, but good practice


  /* ---------- presets ---------- */
  const presets = useMemo(() => [
    { label: "⚙️ Global Config Root (Doc)", value: "metadata/config" },
    { label: "🏦 Daily Rep Bank (Doc)", value: "metadata/config/catalog/COMMITMENT_BANK" },
    { label: "🎯 Target Rep Catalog (Doc)", value: "metadata/config/catalog/TARGET_REP_CATALOG" },
    { label: "🗺️ Leadership Domains (Doc)", value: "metadata/config/catalog/leadership_domains" },
    { label: "📚 Resource Library (Doc)", value: "metadata/config/catalog/resource_library" },
    { label: "⚡ Quick Challenges (Doc)", value: "metadata/config/catalog/quick_challenge_catalog" },
    { label: "📖 Reading Catalog (Doc - Wrapped)", value: "metadata/reading_catalog" },
    { label: "👤 User - Current Dev Plan (Doc)", value: "leadership_plan/<uid>/profile/plan" },
    { label: "📜 User - Dev Plan History (Coll)", value: "leadership_plan/<uid>/plan_history" },
    { label: "📊 User - Assessment History (Coll)", value: "leadership_plan/<uid>/assessment_history" },
    { label: "✅ User - Daily Reps / Reflection (Doc)", value: "user_commitments/<uid>/profile/active" },
    { label: "📝 User - Planning Drafts (Doc)", value: "user_planning/<uid>/profile/drafts" },
  ], []);


  /* ----------------------- render ----------------------- */

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">🔥 Firestore Data Manager (Admin)</h1>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700 self-center">Quick Access:</span>
        {presets.map((p) => (
          <button key={p.value} className="px-3 py-1.5 rounded-full border border-blue-200 text-sm bg-white text-blue-700 hover:bg-blue-50 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
           onClick={() => { setPath(p.value); readDoc(); }} title={p.value} disabled={isReading || isWriting}>
            {p.label}
          </button>
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
                        excludedKeys={wrapperKey ? Object.keys(rawDocObj) : arrayFields} // Exclude all if wrapped, else exclude selected array fields
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
                     {!wrapperKey && arrayFields.length > 0 && ( // Show selector only if NOT wrapped AND arrays exist
                        <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Field:</span>
                        <select className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500" value={activeArray} onChange={(e) => setActiveArray(e.target.value)} >
                            {arrayFields.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                        </div>
                     )}
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
             <button className="..." onClick={listCollection} disabled={isReading || isWriting}>📋 List Collection (max 500)</button>
             <button className="..." onClick={addCollectionRow} disabled={isReading || isWriting}>➕ Add New Row (Local)</button>
             <button className="..." onClick={batchSaveCollection} disabled={!rows.length || isReading || isWriting}>💾 Batch Save All Changes</button>
             <button className="..." onClick={deleteSelectedCollection} disabled={!Object.values(selected).some(Boolean) || isReading || isWriting}>🗑️ Delete Selected</button>
             <div className="ml-auto flex items-center gap-3">
                 <button className="..." onClick={exportCSV} disabled={!rows.length}>📥 Export CSV</button>
                 <label className={`... ${isReading || isWriting ? 'opacity-50 cursor-not-allowed' : ''}`}>📤 Import JSON <input type="file" accept="application/json" className="hidden" onChange={importJSON} disabled={isReading || isWriting}/> </label>
                 <label className={`... ${isReading || isWriting ? 'opacity-50 cursor-not-allowed' : ''}`}>📤 Import CSV <input type="file" accept=".csv,text/csv" className="hidden" onChange={importCSV} disabled={isReading || isWriting}/> </label>
             </div>
            </div>
            {/* Collection Table */}
            <div className="overflow-x-auto border rounded-lg shadow-md bg-white">
             {isReading ? <LoaderSpinner/> : (
                <table className="min-w-full text-sm">
                   <thead className="bg-gray-100 sticky top-0">
                     <tr>
                        <th className="p-2 border-b w-10"><input type="checkbox" checked={Object.keys(selected).length === rows.length && rows.length > 0 && Object.values(selected).every(Boolean)} onChange={toggleAllSelection} title="Select All" /></th>
                        {cols.map((c) => <th key={c} className="p-3 border-b text-left font-semibold text-gray-700">{c}</th>)}
                        <th className="p-3 border-b font-semibold text-gray-700">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                    {!rows.length ? ( <tr><td colSpan={cols.length + 2} className="p-8 text-center text-gray-500">No documents loaded. Click <b>List Collection</b> or <b>Add New Row</b>.</td></tr> )
                    : rows.map((r) => (
                        <tr key={r._id} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 transition">
                            <td className="p-2 border-b align-top text-center"><input type="checkbox" checked={!!selected[r._id]} onChange={() => toggleSelection(r._id)} /></td>
                            {cols.map((c) => (
                               <td key={c} className="p-1.5 border-b align-top">
                                {c === "_id" ? ( <div className={`... ${r._id.startsWith("__new__") || r._id.startsWith("__import__") ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>{r._id.startsWith("__") ? 'NEW/IMPORT' : r._id}</div> )
                                : ( <textarea className="..." value={r[c] ?? ""} onChange={(e) => setCollectionCell(r._id, c, e.target.value)} placeholder={c} title={c} rows={1}/> )}
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