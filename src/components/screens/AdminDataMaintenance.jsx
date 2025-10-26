// src/components/screens/AdminDataMaintenance.jsx
import React, { useEffect, useMemo, useState } from "react";
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
import { Loader } from 'lucide-react'; // Import Lucide Loader icon

/* ----------------------- utilities ----------------------- */

const pretty = (v) => JSON.stringify(v ?? {}, null, 2);
const tryParse = (t, fb) => { try { return JSON.parse(t); } catch { return fb; } };
const pathParts = (p) => p.trim().split("/").filter(Boolean);

// --- PATH CONSTANTS AND UTILITIES ---
const ARRAY_WRAPPER_KEY = "items";

// Paths that are known to contain a single array at the root or are collections of arrays
// NOTE: ALL PATHS CORRECTED TO USE SINGULAR '/catalog/'
const SINGLE_ARRAY_DOCUMENTS = [
    "metadata/reading_catalog",
    "metadata/config/catalog/COMMITMENT_BANK", // Kept for consistency if data exists
    "metadata/config/catalog/TARGET_REP_CATALOG",
    "metadata/config/catalog/quick_challenge_catalog",
    "metadata/config/catalog/SKILL_CONTENT_LIBRARY",
    // These might be collections, not single array docs:
    // "metadata/config/leadership_domains",
    // "metadata/config/resource_library"
];

// Standard Firestore path logic (even segments = Document)
const isDocumentPath = (p) => pathParts(p).length % 2 === 0;
const isCollectionPath = (p) => !isDocumentPath(p);

const getWrapperKeyForPath = (path) => {
    // Simple check, might need refinement based on exact path structure
    if (path.startsWith("metadata/config/catalog/")) return ARRAY_WRAPPER_KEY;
    if (path === "metadata/reading_catalog") return ARRAY_WRAPPER_KEY;
    // Add specific checks for leadership_domains and resource_library if they are top-level arrays in config
    if (path === "metadata/config" && (path.endsWith("/leadership_domains") || path.endsWith("/resource_library"))) {
       // Assuming these fields within config doc are arrays
       // This logic might need adjustment based on how you load/save these specific fields.
       // For now, let's assume they are handled like standard map fields in the KV editor.
       return null;
    }
    return null;
};
// --- END PATH UTILITIES ---


const normalizePath = (raw, uid) =>
  raw.replaceAll("<uid>", uid || "").replaceAll("{uid}", uid || "");

const coerce = (s) => {
  if (typeof s !== "string") return s;
  const t = s.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if ((t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))) {
    try { return JSON.parse(t); } catch { /* fall through */ }
  }
  return s;
};

const flatten = (obj, prefix = "", out = {}) => {
  if (obj == null) return out;
  Object.entries(obj).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v) || (v && typeof v === "object" && !(v instanceof Date) && !(v?.seconds !== undefined && v?.nanoseconds !== undefined))) { // Added check for Firestore Timestamp like objects
      // store arrays/objects as JSON strings at leaf cells for table editing
      if (Array.isArray(v) || typeof v === "object") {
          out[key] = JSON.stringify(v, null, 2); // Prettify JSON strings for readability
      } else {
          out[key] = v; // Should not happen based on the check above
      }
    } else if (v?.seconds !== undefined && v?.nanoseconds !== undefined) {
        // Handle Firestore Timestamps - display as ISO string
        try {
            out[key] = new Date(v.seconds * 1000 + v.nanoseconds / 1000000).toISOString();
        } catch {
            out[key] = "[Invalid Timestamp]";
        }
    }
     else {
      out[key] = v;
    }
  });
  return out;
};

// simple dot-path unflatten (one level is plenty for admin use)
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
    // Attempt to parse JSON strings back into objects/arrays
    let coercedValue = coerce(value);
    if (typeof coercedValue === 'string') {
        try {
            const parsed = JSON.parse(coercedValue);
            // Only use parsed value if it's an object or array
            if (typeof parsed === 'object' && parsed !== null) {
                coercedValue = parsed;
            }
        } catch { /* Ignore if parsing fails, keep as string */ }
    }
    cur[parts[0]] = coercedValue;
  });
  return out;
};

const inferColumns = (rows) => {
  const set = new Set(["_id"]);
  rows.forEach((r) => Object.keys(r).forEach((k) => set.add(k)));
  return Array.from(set);
};

const nowIso = () => new Date().toISOString();

/* ----------------------- CSV helpers (Unchanged) ----------------------- */

const toCSV = (rows) => {
  if (!rows.length) return "";
  const cols = inferColumns(rows);
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c])).join(",")).join("\n");
  return `${header}\n${body}`;
};

const fromCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const parseLine = (line) => {
      const parts = [];
      let current = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
              if (inQuote && line[i + 1] === '"') {
                  current += '"'; i++;
              } else { inQuote = !inQuote; }
          } else if (char === ',' && !inQuote) {
              parts.push(current); current = '';
          } else { current += char; }
      }
      parts.push(current);
      return parts;
  };
  const headers = parseLine(lines[0]);
  const parseCell = (cell) => {
    const unq = (cell || "").replace(/^"(.*)"$/, (_, p1) => p1.replace(/""/g, '"'));
    return coerce(unq);
  };
  return lines.slice(1).map((line) => {
    const parts = parseLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h] = parseCell(parts[i] ?? "")));
    return row;
  });
};

/* ----------------------- UI components (Unchanged) ----------------------- */

const LoaderSpinner = () => (
    <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg flex items-center justify-center">
        <Loader className="w-5 h-5 animate-spin mr-2 text-indigo-500" />
        Loading data...
    </div>
);

function KVEditor({ value, onChange, onSave, isLoading }) {
  const [rows, setRows] = useState(() => {
    const flat = flatten(value);
    return Object.keys(flat).map((k) => ({ key: k, value: flat[k] }));
  });

  useEffect(() => {
    const flat = flatten(value);
    setRows(Object.keys(flat).map((k) => ({ key: k, value: flat[k] })));
  }, [value]);

  const cols = ["key", "value"];

  const update = (idx, field, val) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
    setRows(next);
    onChange(unflatten(Object.fromEntries(next.map((r) => [r.key, r.value]))));
  };

  const addRow = () => {
    const next = [{ key: "", value: "" }, ...rows];
    setRows(next);
  };

  const delRow = (idx) => {
    const next = rows.filter((_, i) => i !== idx);
    setRows(next);
    onChange(unflatten(Object.fromEntries(next.map((r) => [r.key, r.value]))));
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
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                {cols.map((c) => <th key={c} className="p-2 border-b text-left text-gray-700">{c}</th>)}
                <th className="p-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!rows.length ? (
                <tr><td colSpan={3} className="p-6 text-center text-gray-500">No fields yet. Add one to begin.</td></tr>
              ) : rows.map((r, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 transition">
                  <td className="p-1.5 border-b"><input className="w-full border rounded px-2 py-1 font-mono text-xs" value={r.key} onChange={(e) => update(idx, "key", e.target.value)} placeholder="e.g., plan_goals.0.title" /></td>
                  {/* Use textarea for value to better handle JSON strings */}
                  <td className="p-1.5 border-b">
                     <textarea
                       className="w-full border rounded px-2 py-1 font-mono text-xs h-16 resize-y" // Allow vertical resize
                       value={r.value}
                       onChange={(e) => update(idx, "value", e.target.value)}
                       placeholder="Value (primitive, ISO date, or JSON string)"
                       rows={1} // Start small
                     />
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

  const add = () => setRows((prev) => [{ _id: String(Date.now()) }, ...prev]);
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
              {!rows.length ? (
                <tr><td colSpan={cols.length + 1} className="p-6 text-center text-gray-500">No rows. Add one to begin.</td></tr>
              ) : rows.map((r) => (
                <tr key={r._id} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 transition">
                  {cols.map((c) => (
                    <td key={c} className="p-1.5 border-b">
                      {c === "_id" ? (
                        <div className="px-2 py-1 rounded bg-gray-100 font-mono text-xs">{r._id}</div>
                      ) : (
                         <textarea
                            className="w-full border rounded px-2 py-1 font-mono text-xs h-16 resize-y" // Use textarea for editing
                            value={r[c] ?? ""}
                            onChange={(e) => edit(r._id, c, e.target.value)}
                            placeholder={c === "value" ? "Enter value (primitive or JSON)" : c}
                            rows={1}
                          />
                      )}
                    </td>
                  ))}
                  <td className="p-1.5 border-b">
                    <button className="text-xs text-red-600 underline hover:text-red-800" onClick={() => del(r._id)}>🗑️ delete</button>
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

/* ----------------------- main screen ----------------------- */

export default function AdminDataMaintenance() {
  const db = getFirestore();
  const uid = getAuth().currentUser?.uid || "";
  const [path, setPath] = useState("metadata/config"); // Default to main config
  const [status, setStatus] = useState("Idle");
  const [err, setErr] = useState("");

  const [docJson, setDocJson] = useState("{}");
  const [docExists, setDocExists] = useState(false);
  const [liveUnsub, setLiveUnsub] = useState(null);

  const isReading = status.startsWith("Reading") || status.startsWith("Listening");

  const rawDocObj = useMemo(() => tryParse(docJson, {}), [docJson]);

  // Wrapper key logic remains similar, but now more robust checks needed
  const wrapperKey = useMemo(() => getWrapperKeyForPath(path), [path]);

  const docObj = useMemo(() => {
    if (typeof rawDocObj !== 'object' || rawDocObj === null) return {};
    return wrapperKey && rawDocObj[wrapperKey] ? rawDocObj[wrapperKey] : rawDocObj; // Use array if wrapped, else use raw object
  }, [rawDocObj, wrapperKey]);

  // Determine array fields based on the potentially unwrapped docObj
  const arrayFields = useMemo(() => {
    if (wrapperKey) return [wrapperKey]; // If it's a designated wrapper doc, only show that key
    if (typeof docObj !== 'object' || docObj === null) return []; // Handle cases where docObj isn't an object
    return Object.keys(docObj).filter((k) => Array.isArray(docObj[k]));
  }, [docObj, wrapperKey]);

  const [activeArray, setActiveArray] = useState("");

  useEffect(() => {
    // Automatically select the wrapper key if it exists
    if (wrapperKey && activeArray !== wrapperKey) {
        setActiveArray(wrapperKey);
    } else if (!wrapperKey && arrayFields.length > 0 && !arrayFields.includes(activeArray)) {
        // Auto-select the first available array field if none is selected or selection is invalid
        setActiveArray(arrayFields[0]);
    } else if (!wrapperKey && arrayFields.length === 0) {
        // Clear selection if no arrays exist
        setActiveArray("");
    }
    // Cleanup listener on path change or unmount
     return () => {
        if (liveUnsub) {
            liveUnsub();
            setLiveUnsub(null); // Clear the unsub function state
        }
    };
  }, [arrayFields, activeArray, wrapperKey, path]); // Added path dependency


  const arrayRows = useMemo(() => {
    let src = [];
    if (wrapperKey && activeArray === wrapperKey) {
        // Handle wrapped array case
        src = rawDocObj[wrapperKey] || [];
    } else if (docObj && typeof docObj === 'object' && activeArray && Array.isArray(docObj[activeArray])) {
        // Handle standard nested array case
        src = docObj[activeArray];
    }

    if (!Array.isArray(src)) return [];

    return src.map((item, i) => {
        const base = { _id: String(i) }; // Use index as ID for simplicity
        if (item && typeof item === "object" && !Array.isArray(item)) {
            return { ...base, ...flatten(item) };
        } else {
            // Represent primitives or nested arrays/objects as JSON strings
            return { ...base, value: typeof item === "string" ? item : JSON.stringify(item, null, 2) };
        }
    });
  }, [rawDocObj, docObj, activeArray, wrapperKey]);


  const setArrayRows = (nextRows) => {
    const rebuilt = nextRows.map(({ _id, ...rest }) => {
        const keys = Object.keys(rest);
        if (keys.length === 1 && keys[0] === "value") {
            // If only 'value' exists, try to parse it (could be primitive or JSON string)
            return coerce(rest.value);
        }
        // Otherwise, unflatten the object
        return unflatten(rest);
    });

    let updated;
    if (wrapperKey && activeArray === wrapperKey) {
        // Re-wrap the array if editing the main wrapped array
        updated = { ...rawDocObj, [wrapperKey]: rebuilt };
    } else {
        // Update the nested array directly in the raw object
        // Use rawDocObj to preserve other fields correctly
        updated = { ...rawDocObj, [activeArray]: rebuilt };
    }

    setDocJson(pretty(updated));
  };

  // collection state
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState({});
  const cols = useMemo(() => inferColumns(rows), [rows]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const explain = isDocumentPath(path)
    ? "Path type: 📝 Document — read/listen/edit/replace/delete a single record."
    : isCollectionPath(path)
    ? "Path type: 📚 Collection — list/add/edit/delete/import/export multiple records."
    : "Enter a Firestore path";

  /* ---------- document actions ---------- */

  const readDoc = async () => {
    setStatus("Reading…"); setErr("");
    setActiveArray(""); // Reset active array on new read
    try {
      liveUnsub && liveUnsub(); setLiveUnsub(null);
      const p = normalizePath(path, uid);
      const ref = doc(db, ...pathParts(p));
      const snap = await getDoc(ref);
      setDocExists(snap.exists());
      let data = snap.exists() ? snap.data() : {};

      // Auto-select first array field if it's not a designated wrapper document
      const currentWrapperKey = getWrapperKeyForPath(p);
      if (!currentWrapperKey && snap.exists() && typeof data === 'object' && data !== null) {
          const keys = Object.keys(data);
          const firstArrayKey = keys.find(k => Array.isArray(data[k]));
          if (firstArrayKey) {
              setActiveArray(firstArrayKey);
          }
      } else if (currentWrapperKey) {
          // If it IS a wrapper document, ensure the wrapper key is selected
          setActiveArray(currentWrapperKey);
      }

      setDocJson(pretty(data));
      setStatus("✅ Read successful.");
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

   const listenDoc = () => {
    setStatus("Listening…"); setErr("");
    setActiveArray(""); // Reset active array
    try {
      liveUnsub && liveUnsub();
      const p = normalizePath(path, uid);
      const ref = doc(db, ...pathParts(p));
      const unsub = onSnapshot(ref, (snap) => {
        setDocExists(snap.exists());
        let data = snap.exists() ? snap.data() : {};

        // Auto-select first array field logic (same as readDoc)
        const currentWrapperKey = getWrapperKeyForPath(p);
         if (!currentWrapperKey && snap.exists() && typeof data === 'object' && data !== null) {
            const keys = Object.keys(data);
            const firstArrayKey = keys.find(k => Array.isArray(data[k]));
            // Only set if activeArray isn't already set or doesn't match
            if (firstArrayKey && activeArray !== firstArrayKey) {
                setActiveArray(firstArrayKey);
            }
        } else if (currentWrapperKey && activeArray !== currentWrapperKey) {
            setActiveArray(currentWrapperKey);
        }

        setDocJson(pretty(data));
        setStatus("👂 Live listening...");
      }, (e) => { setErr(String(e)); setStatus("❌ Error"); });
      setLiveUnsub(() => unsub); // Store the unsubscribe function
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  const saveMerge = async () => {
    setStatus("Saving (merge)…"); setErr("");
    try {
      const data = tryParse(docJson, null);
      if (data == null) throw new Error("Invalid JSON. Please check the format in the left box.");

      // Allow merge for all documents now, assuming Firestore handles nested merges correctly.
      // const wrapperKey = getWrapperKeyForPath(path);
      // if (wrapperKey && data && data[wrapperKey] && Array.isArray(data[wrapperKey])) {
      //     throw new Error("Cannot use **Save (Merge)** for single-array catalogs. Use **Replace (Set)**.");
      // }

      const p = normalizePath(path, uid);
      await setDoc(doc(db, ...pathParts(p)), data, { merge: true });
      setStatus("✅ Saved (merge).");
       await readDoc(); // Refresh UI after save
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  const replaceSet = async () => {
    setStatus("Replacing…"); setErr("");
    try {
      const data = tryParse(docJson, null);
      if (data == null) throw new Error("Invalid JSON. Please check the format in the left box.");
      const p = normalizePath(path, uid);
      await setDoc(doc(db, ...pathParts(p)), data); // No merge option means overwrite
      setDocExists(true);
      setStatus("✅ Replaced (Set).");
      await readDoc(); // Refresh UI after replace
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  const deleteTheDoc = async () => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete the document at: ${path}?`)) return;
    setStatus("Deleting…"); setErr("");
    try {
      liveUnsub && liveUnsub(); setLiveUnsub(null);
      const p = normalizePath(path, uid);
      await deleteDoc(doc(db, ...pathParts(p)));
      setDocExists(false);
      setDocJson("{}");
      setActiveArray(""); // Clear active array
      setStatus("✅ Deleted.");
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

   const saveArray = async () => {
    if (!activeArray) {
        setErr("No array field selected to save.");
        setStatus("❌ Error");
        return;
    }
    setStatus(`Saving array "${activeArray}"…`); setErr("");
    try {
        const fullDocData = tryParse(docJson, {}); // Get the current state from the editor
        const p = normalizePath(path, uid);

        // Extract the specific array data to be saved
        const arrayDataToSave = fullDocData[activeArray];

        if (!Array.isArray(arrayDataToSave)) {
            throw new Error(`Data for field "${activeArray}" is not an array in the current JSON.`);
        }

        // Save only the active array field using merge to avoid overwriting other fields
        await setDoc(doc(db, ...pathParts(p)), {
            [activeArray]: arrayDataToSave,
            _lastEdited: nowIso() // Add a timestamp for tracking
        }, { merge: true });

        setStatus(`✅ Saved array "${activeArray}".`);
        // No need to re-read manually if listening, but good practice if not
        if (!liveUnsub) {
            await readDoc();
        }
    } catch (e) {
        setErr(String(e));
        setStatus("❌ Error");
    }
  };

  const saveKV = async () => {
    setStatus("Saving key/values…"); setErr("");
    try {
        const kvData = tryParse(docJson, {}); // KV editor updates docJson directly
        const p = normalizePath(path, uid);

        // Filter out array fields managed by the ArrayTable from the KV save data
        // This prevents accidental overwrites if both editors were used without saving in between
        const dataToSave = { ...kvData };
        arrayFields.forEach(field => {
            // Check if the field exists and is still an array in the current JSON
            // If it is, DO NOT include it in the KV save, let saveArray handle it.
            if (Array.isArray(dataToSave[field])) {
                 console.warn(`Field "${field}" is managed by Array Editor, excluding from KV save.`);
                 delete dataToSave[field];
            }
        });

        if (Object.keys(dataToSave).length > 0) {
            await setDoc(doc(db, ...pathParts(p)), {
                ...dataToSave,
                _lastEdited: nowIso() // Add timestamp
            }, { merge: true });
            setStatus("✅ Saved key/values.");
            // No need to re-read manually if listening
            if (!liveUnsub) {
                 await readDoc();
            }
        } else {
             setStatus("✅ No non-array key/values to save.");
        }
    } catch (e) {
        setErr(String(e));
        setStatus("❌ Error");
    }
};

  /* ---------- collection actions (Unchanged) ---------- */

  const listCollection = async () => {
    setStatus("Listing…"); setErr(""); setRows([]); setSelected({});
    try {
      const p = normalizePath(path, uid);
      const snap = await getDocs(query(collection(db, ...pathParts(p)), qLimit(500)));
      const list = [];
      snap.forEach((d) => list.push({ _id: d.id, ...flatten(d.data()) }));
      setRows(list);
      setStatus(`✅ Listed ${list.length} docs (Limit: 500).`);
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  const addRow = () => setRows((r) => [{ _id: "__new__" + Math.random().toString(36).slice(2, 8) }, ...r]);
  const setCell = (id, key, val) => setRows((r) => r.map((x) => (x._id === id ? { ...x, [key]: val } : x)));
  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const toggleAll = () => {
    if (Object.keys(selected).length === rows.length && Object.values(selected).every(Boolean)) {
      setSelected({});
    } else {
      const allSelected = rows.reduce((acc, r) => ({ ...acc, [r._id]: true }), {});
      setSelected(allSelected);
    }
  };

  const batchSave = async () => {
    if (!window.confirm("Are you sure you want to Batch Save ALL changes (including new rows and updates) to this collection?")) return;
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
          const newRef = doc(colRef);
          batch.set(newRef, data, { merge: true });
          newMap.push({ temp: _id, real: newRef.id });
        } else {
          batch.set(doc(colRef, _id), data, { merge: true });
        }
      }
      await batch.commit();
      if (newMap.length) {
        setRows((prev) => prev.map((x) => {
          const f = newMap.find((n) => n.temp === x._id);
          return f ? { ...x, _id: f.real } : x;
        }));
      }
      setStatus("✅ Batch saved.");
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  const deleteSelected = async () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (!ids.length) return;
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete ${ids.length} selected documents? New (unsaved) rows will be ignored.`)) return;

    setStatus("Deleting…"); setErr("");
    try {
      const p = normalizePath(path, uid);
      const colRef = collection(db, ...pathParts(p));
      const batch = writeBatch(db);
      ids.forEach((id) => {
        if (!id.startsWith("__new__")) batch.delete(doc(colRef, id));
      });
      await batch.commit();
      setRows((prev) => prev.filter((r) => !ids.includes(r._id)));
      setSelected({});
      setStatus(`✅ Deleted ${ids.filter(id => !id.startsWith("__new__")).length} documents.`);
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  /* ---------- import / export (Unchanged) ---------- */

  const exportJSON = () => {
    const blob = new Blob([docJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: (path.replace(/\//g, "_") || "export") + ".json" });
    a.click(); URL.revokeObjectURL(url);
  };

  const importJSON = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const txt = String(r.result || "");
      if (isDocumentPath(path)) {
        setDocJson(txt);
        setStatus("Loaded JSON into editor. Click Save or Replace to apply.");
      } else {
        const arr = tryParse(txt, []);
        if (!Array.isArray(arr)) { setErr("JSON must be an array for collection import."); return; }
        setRows(arr.map((o) => {
          const id = o._id || "__new__" + Math.random().toString(36).slice(2, 8);
          const { _id, ...rest } = o;
          return { _id: id, ...flatten(rest) };
        }));
        setStatus(`Loaded ${arr.length} records from JSON. Click Batch Save to apply.`);
      }
    };
    r.readAsText(f); e.target.value = "";
  };

  const exportCSV = () => {
    const blob = new Blob([toCSV(rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: (path.replace(/\//g, "_") || "export") + ".csv" });
    a.click(); URL.revokeObjectURL(url);
  };

  const importCSV = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      setErr("");
      const arr = fromCSV(String(r.result || ""));
      setRows(arr.map((row) => {
        const id = row._id || "__new__" + Math.random().toString(36).slice(2, 8);
        const { _id, ...rest } = row;
        return { _id: id, ...rest };
      }));
      setStatus(`Loaded ${arr.length} records from CSV. Click Batch Save to apply.`);
    };
    r.readAsText(f); e.target.value = "";
  };

  /* ---------- presets (UPDATED) ---------- */
  const presets = [
    // Global Config
    { label: "⚙️ Global Config (Doc)", value: "metadata/config" },
    { label: "📖 Reading Catalog (Doc)", value: "metadata/reading_catalog" },
    // User Specific - Development Plan
    { label: "👤 User - Current Dev Plan (Doc)", value: "leadership_plan/<uid>/profile/plan" },
    { label: "📜 User - Dev Plan History (Coll)", value: "leadership_plan/<uid>/plan_history" },
    { label: "📊 User - Assessment History (Coll)", value: "leadership_plan/<uid>/assessment_history" },
    // User Specific - Daily Reps & Planning
    { label: "✅ User - Daily Reps / Reflection (Doc)", value: "user_commitments/<uid>/profile/active" },
    { label: "📝 User - Planning Drafts (Doc)", value: "user_planning/<uid>/profile/drafts" },

    // Keeping old catalog paths for reference, but maybe remove if unused
    // { label: "뱅크 Commitment Bank (Doc)", value: "metadata/config/catalog/COMMITMENT_BANK" }, // Terminology Update
    // { label: "🎯 Target Rep Catalog (Doc)", value: "metadata/config/catalog/TARGET_REP_CATALOG" },
    // { label: "⚡ Quick Challenge Catalog (Doc)", value: "metadata/config/catalog/quick_challenge_catalog" },
    // { label: "🛠️ Skill Content Library (Doc)", value: "metadata/config/catalog/SKILL_CONTENT_LIBRARY" },
  ];

  /* ----------------------- render ----------------------- */

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">🔥 Firestore Data Manager (Admin)</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700 self-center">Quick Access:</span>
        {presets.map((p) => (
          <button key={p.value} className="px-3 py-1.5 rounded-full border border-blue-200 text-sm bg-white text-blue-700 hover:bg-blue-50 transition shadow-sm" onClick={() => setPath(p.value)} title={p.value}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <div className="flex items-center gap-2 mb-2">
          <input className="flex-1 border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm shadow-inner focus:ring-blue-500 focus:border-blue-500"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="collection/document path… (supports <uid>)"
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    if (isDocumentPath(path)) readDoc();
                    else if (isCollectionPath(path)) listCollection();
                }
            }}
          />
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 transition"
            onClick={() => alert("Path Segments:\n- EVEN segments = Document (e.g., users/uid/profile/data)\n- ODD segments = Collection (e.g., users/uid/profile)\n- Use <uid> or {uid} to insert the current authenticated user's ID.")}>
            ❓ Path Help
          </button>
        </div>
        <div className="text-sm text-gray-600 font-medium">{explain}</div>
      </div>

      {/* Status Bar */}
      <div className="mb-4 p-3 rounded-lg shadow-sm" style={{ backgroundColor: err ? '#fef2f2' : status.includes("✅") ? '#f0fdf4' : status.includes("❌") ? '#fef2f2' : '#eff6ff', border: err ? '1px solid #fca5a5' : status.includes("✅") ? '1px solid #86efac' : status.includes("❌") ? '1px solid #fca5a5' : '1px solid #93c5fd' }}>
        <div className="text-sm font-semibold">Status: <span className={err ? "text-red-700" : status.includes("✅") ? "text-green-700" : status.includes("❌") ? "text-red-700" : "text-blue-700"}>{status}</span></div>
        {err && <div className="mt-1 text-xs text-red-600">Error Details: {err}</div>}
      </div>

      {isDocumentPath(path) ? (
        <>
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-lg shadow-md border">
            <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-md" onClick={readDoc}>🔍 Read Doc</button>
            <button className={`px-4 py-2 rounded-lg border ${liveUnsub ? 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200' : 'bg-white text-gray-700 hover:bg-gray-100'}`} onClick={liveUnsub ? () => { liveUnsub(); setLiveUnsub(null); setStatus("Idle"); } : listenDoc}>
                {liveUnsub ? '🔴 Stop Listening' : '👂 Listen (Live)'}
            </button>
            <button className="px-4 py-2 rounded-lg border border-green-300 bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition" onClick={saveMerge}>💾 Save (Merge)</button>
            <button className="px-4 py-2 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-700 font-semibold hover:bg-yellow-100 transition" onClick={replaceSet}>🔄 Replace (Set)</button>
            <button className="px-4 py-2 rounded-lg border border-red-600 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition" onClick={deleteTheDoc} disabled={!docExists}>🗑️ Delete Doc</button>

            <div className="ml-auto flex items-center gap-3">
              <button className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 transition" onClick={exportJSON}>📥 Export JSON</button>
              <label className="px-4 py-2 rounded-lg border cursor-pointer bg-white hover:bg-gray-100 transition">📤 Import JSON
                <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
              </label>
              <div className="text-sm font-medium">Exists: <span className={docExists ? "text-green-600" : "text-red-600"}>{String(docExists)}</span></div>
            </div>
          </div>

          {/* Editors (Refined Layout) */}
          <div className="flex flex-col xl:flex-row gap-6 mb-6">
            {/* Left Column: JSON Editor */}
             <div className="flex-1 bg-white p-4 rounded-lg shadow-md border">
                <div className="text-base font-semibold text-gray-800 mb-2">Full Document JSON (Raw Edit)</div>
                <textarea
                    className="w-full min-h-[400px] xl:min-h-[600px] font-mono border border-gray-300 rounded p-3 text-xs bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500"
                    spellCheck={false}
                    value={docJson}
                    onChange={(e) => setDocJson(e.target.value)}
                    placeholder="Document content will load here..."
                />
            </div>

            {/* Right Column: KV and Array Editors */}
            <div className="flex-1 flex flex-col gap-6">
                 {/* KV Editor */}
                <div className="bg-white p-4 rounded-lg shadow-md border">
                  <div className="text-base font-semibold text-gray-800 mb-2">Key/Value Table (Dot-Path Editor)</div>
                   {isReading ? <LoaderSpinner /> : (
                      <KVEditor
                        value={tryParse(docJson, {})} // Pass parsed object
                        onChange={(obj) => setDocJson(pretty(obj))} // Update JSON string on change
                        onSave={saveKV}
                        isLoading={isReading || status.startsWith("Saving")} // Disable during save too
                      />
                   )}
                </div>

                {/* Array Editor */}
                <div className="bg-white p-4 rounded-lg shadow-md border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-base font-semibold text-gray-800">Array Table Editor</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Field:</span>
                      <select
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={activeArray}
                        onChange={(e) => setActiveArray(e.target.value)}
                         disabled={arrayFields.length === 0}
                      >
                        <option value="" disabled={arrayFields.length > 0}>-- Select Array Field --</option>
                        {arrayFields.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                  {isReading ? <LoaderSpinner /> : arrayFields.length > 0 && activeArray ? (
                    <ArrayTable
                      fieldName={activeArray}
                      rows={arrayRows}
                      setRows={setArrayRows}
                      onSave={saveArray}
                      isLoading={isReading || status.startsWith("Saving")}
                    />
                  ) : (
                    <div className="text-sm text-gray-600 p-4 border rounded bg-gray-50">
                      {isReading ? 'Loading...' : 'No array fields found or selected in the current document.'}
                    </div>
                  )}
                </div>
            </div>
          </div>

        </>
      ) : isCollectionPath(path) ? (
        <>
          <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-lg shadow-md border">
            <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-md" onClick={listCollection}>📋 List Collection (max 500)</button>
            <button className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 transition" onClick={addRow}>➕ Add New Row (Local)</button>
            <button className="px-4 py-2 rounded-lg border border-green-300 bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition" onClick={batchSave} disabled={!rows.length || status.startsWith("Batch saving")}>💾 Batch Save All Changes</button>
            <button className="px-4 py-2 rounded-lg border border-red-600 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition" onClick={deleteSelected} disabled={!Object.values(selected).some(Boolean) || status.startsWith("Deleting")}>🗑️ Delete Selected</button>

            <div className="ml-auto flex items-center gap-3">
                <button className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 transition" onClick={exportCSV} disabled={!rows.length}>📥 Export CSV</button>
                <label className="px-4 py-2 rounded-lg border cursor-pointer bg-white hover:bg-gray-100 transition">📤 Import JSON
                    <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
                </label>
                <label className="px-4 py-2 rounded-lg border cursor-pointer bg-white hover:bg-gray-100 transition">📤 Import CSV
                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={importCSV} />
                </label>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-lg shadow-md bg-white">
             {isReading ? <LoaderSpinner/> : (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-2 border-b w-10">
                        <input type="checkbox" checked={Object.keys(selected).length === rows.length && rows.length > 0 && Object.values(selected).every(Boolean)} onChange={toggleAll} title="Select All" />
                      </th>
                      {cols.map((c) => <th key={c} className="p-3 border-b text-left font-semibold text-gray-700">{c}</th>)}
                      <th className="p-3 border-b font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!rows.length ? (
                      <tr><td colSpan={cols.length + 2} className="p-8 text-center text-gray-500">No documents loaded. Click <b>List Collection</b> or <b>Add New Row</b>.</td></tr>
                    ) : rows.map((r) => (
                      <tr key={r._id} className="odd:bg-white even:bg-gray-50 hover:bg-yellow-50 transition">
                        <td className="p-2 border-b align-top text-center">
                          <input type="checkbox" checked={!!selected[r._id]} onChange={() => toggle(r._id)} />
                        </td>
                        {cols.map((c) => (
                          <td key={c} className="p-1.5 border-b align-top">
                            {c === "_id" ? (
                              <div className={`px-2 py-1 rounded font-mono text-xs ${r._id.startsWith("__new__") ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-100 text-gray-700'}`} title={r._id.startsWith("__new__") ? "New ID (will be generated on save)" : "Document ID"}>{r._id.startsWith("__new__") ? 'NEW' : r._id}</div>
                            ) : (
                               <textarea
                                className="w-full border rounded px-2 py-1 font-mono text-xs h-16 resize-y" // Use textarea
                                value={r[c] ?? ""}
                                onChange={(e) => setCell(r._id, c, e.target.value)}
                                placeholder={c}
                                title={c}
                                rows={1}
                              />
                            )}
                          </td>
                        ))}
                        <td className="p-2 border-b align-top text-center">
                           <button className="text-xs text-red-600 underline hover:text-red-800" onClick={async () => {
                              if (!window.confirm(`Delete document ${r._id}? New rows cannot be deleted individually.`)) return;
                              if (r._id.startsWith("__new__")) {
                                 setRows((prev) => prev.filter((x) => x._id !== r._id)); // Remove local new row
                                 setStatus("ℹ️ Removed new local row.");
                                 return;
                              }
                              try {
                                const p = normalizePath(path, uid);
                                await deleteDoc(doc(collection(db, ...pathParts(p)), r._id));
                                setRows((prev) => prev.filter((x) => x._id !== r._id));
                                setStatus(`✅ Deleted document ${r._id}.`);
                              } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
                            }}>🗑️ delete</button>
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