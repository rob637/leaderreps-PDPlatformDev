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

// Rely on standard Firestore path logic (even segments = Document)
// Since we are fixing the presets to use 4 segments (e.g., metadata/config/catalogs/DOC_ID),
// this simple check now works reliably for all your catalogs.
const isDocumentPath = (p) => pathParts(p).length % 2 === 0;
const isCollectionPath = (p) => !isDocumentPath(p);

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
    if (Array.isArray(v) || (v && typeof v === "object" && !(v instanceof Date))) {
      // store arrays/objects as JSON strings at leaf cells for table editing
      // NOTE: Added !(v instanceof Date) to prevent Date objects from being JSON.stringified here,
      // although Firestore usually handles them as timestamps.
      if (Array.isArray(v) || typeof v === "object") {
          out[key] = JSON.stringify(v);
      } else {
          out[key] = v;
      }
    } else {
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
    cur[parts[0]] = coerce(value);
  });
  return out;
};

const inferColumns = (rows) => {
  const set = new Set(["_id"]);
  rows.forEach((r) => Object.keys(r).forEach((k) => set.add(k)));
  return Array.from(set);
};

const nowIso = () => new Date().toISOString();

/* ----------------------- CSV helpers ----------------------- */

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
  
  // Custom regex to handle quotes correctly, similar to what's used in the original.
  // This is a simplified approach and might fail for complex nested quotes/commas in cells.
  // The original implementation used a non-standard regex for split. We'll use a more standard approach for parsing CSV lines.
  const parseLine = (line) => {
      const parts = [];
      let current = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
              // Handle escaped quotes inside quotes ("")
              if (inQuote && line[i + 1] === '"') {
                  current += '"';
                  i++; // skip the next quote
              } else {
                  inQuote = !inQuote;
              }
          } else if (char === ',' && !inQuote) {
              parts.push(current);
              current = '';
          } else {
              current += char;
          }
      }
      parts.push(current); // push the last part
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

/* ----------------------- UI components ----------------------- */

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
                  <td className="p-1.5 border-b"><input className="w-full border rounded px-2 py-1 font-mono text-xs" value={r.value} onChange={(e) => update(idx, "value", e.target.value)} placeholder="Value (will be auto-coerced to number/boolean/JSON)" /></td>
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

  // Determine new column name if the only data is 'value' (for arrays of primitives)
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
                        <input 
                          className="w-full border rounded px-2 py-1 font-mono text-xs" 
                          value={r[c] ?? ""} 
                          onChange={(e) => edit(r._id, c, e.target.value)} 
                          placeholder={c === "value" ? "Enter value (primitive or JSON)" : c}
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
  const [path, setPath] = useState("metadata/reading_catalog");
  const [status, setStatus] = useState("Idle");
  const [err, setErr] = useState("");

  // doc state
  const [docJson, setDocJson] = useState("{}");
  const [docExists, setDocExists] = useState(false);
  const [liveUnsub, setLiveUnsub] = useState(null);
  
  // NEW: Determine if a read operation is actively running
  const isReading = status.startsWith("Reading") || status.startsWith("Listening"); 

  // array editor state
  const docObj = useMemo(() => tryParse(docJson, {}), [docJson]);
  const arrayFields = useMemo(() => {
    return Object.keys(docObj || {}).filter((k) => Array.isArray(docObj[k]));
  }, [docObj]);
  const [activeArray, setActiveArray] = useState("");

  const arrayRows = useMemo(() => {
    const src = Array.isArray(docObj?.[activeArray]) ? docObj[activeArray] : [];
    // map primitives -> { value: <primitive> }, objects -> flattened
    return src.map((item, i) =>
      (item && typeof item === "object" && !Array.isArray(item))
        ? ({ _id: String(i), ...flatten(item) })
        : ({ _id: String(i), value: typeof item === "string" ? item : JSON.stringify(item) })
    );
  }, [docObj, activeArray]);

  const setArrayRows = (nextRows) => {
    const rebuilt = nextRows.map(({ _id, ...rest }) => {
      // if only column is "value" treat as primitive; else unflatten object
      const keys = Object.keys(rest);
      if (keys.length === 1 && keys[0] === "value") return coerce(rest.value);
      return unflatten(rest);
    });
    const updated = { ...docObj, [activeArray]: rebuilt };
    setDocJson(pretty(updated));
  };

  // collection state
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState({});
  const cols = useMemo(() => inferColumns(rows), [rows]);

  // 1) Scroll to top when component loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); 

  // CRITICAL FIX 2: Ensure path type logic uses the correct helper
  const explain = isDocumentPath(path)
    ? "Path type: 📝 Document — read/listen/edit/replace/delete a single record."
    : isCollectionPath(path)
    ? "Path type: 📚 Collection — list/add/edit/delete/import/export multiple records. (Note: Parent/child relationships like Categories/Books are best managed by ensuring the Parent collection is loaded.)"
    : "Enter a Firestore path";

  /* ---------- document actions ---------- */

  const readDoc = async () => {
    setStatus("Reading…"); setErr("");
    try {
      liveUnsub && liveUnsub(); // Stop any current listener
      setLiveUnsub(null);
      
      const p = normalizePath(path, uid);
      const ref = doc(db, ...pathParts(p));
      const snap = await getDoc(ref);
      setDocExists(snap.exists());
      
      let data = snap.exists() ? snap.data() : {};
      
      // Reset active array before reading new data
      setActiveArray("");
      
      // CRITICAL FIX: Aggressively auto-select the most relevant array field
      if (snap.exists() && typeof data === 'object' && data !== null) {
        
        const currentKeys = Object.keys(data);
        const arrayKey = currentKeys.find(k => Array.isArray(data[k]));
        
        // Auto-select the first (or only) top-level array field found
        if (arrayKey) {
            setActiveArray(arrayKey);
        } else if (currentKeys.length === 0) {
            // Document exists but is empty, clear editor
            setDocJson(pretty({}));
            setStatus("✅ Read successful (Document is empty).");
            return;
        }
      }
      
      setDocJson(pretty(data));
      setStatus("✅ Read successful.");
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  const listenDoc = () => {
    setStatus("Listening…"); setErr("");
    try {
      liveUnsub && liveUnsub();
      const p = normalizePath(path, uid);
      const ref = doc(db, ...pathParts(p));
      const unsub = onSnapshot(ref, (snap) => {
        setDocExists(snap.exists());
        
        let data = snap.exists() ? snap.data() : {};
        // Note: We don't change activeArray in the snapshot handler to avoid 
        // interrupting user editing if they switch fields manually.
        
        setDocJson(pretty(data));
        setStatus("👂 Live listening...");
      }, (e) => { setErr(String(e)); setStatus("❌ Error"); });
      setLiveUnsub(() => unsub);
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  const saveMerge = async () => {
    setStatus("Saving (merge)…"); setErr("");
    try {
      const data = tryParse(docJson, null);
      if (data == null) throw new Error("Invalid JSON. Please check the format in the left box.");
      const p = normalizePath(path, uid);
      await setDoc(doc(db, ...pathParts(p)), data, { merge: true });
      setStatus("✅ Saved (merge).");
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  const replaceSet = async () => {
    setStatus("Replacing…"); setErr("");
    try {
      const data = tryParse(docJson, null);
      if (data == null) throw new Error("Invalid JSON. Please check the format in the left box.");
      const p = normalizePath(path, uid);
      await setDoc(doc(db, ...pathParts(p)), data);
      setDocExists(true);
      setStatus("✅ Replaced (Set).");
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  const deleteTheDoc = async () => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete the document at: ${path}?`)) return;
    setStatus("Deleting…"); setErr("");
    try {
      liveUnsub && liveUnsub();
      setLiveUnsub(null);
      const p = normalizePath(path, uid);
      await deleteDoc(doc(db, ...pathParts(p)));
      setDocExists(false);
      setDocJson("{}");
      setStatus("✅ Deleted.");
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  const saveArray = async () => {
    if (!activeArray) return;
    setStatus(`Saving array "${activeArray}"…`); setErr("");
    try {
      const data = tryParse(docJson, {});
      const p = normalizePath(path, uid);
      // Only save the active array field and a timestamp for merge
      await setDoc(doc(db, ...pathParts(p)), { [activeArray]: data[activeArray], _lastEdited: nowIso() }, { merge: true });
      setStatus(`✅ Saved array "${activeArray}".`);
      await readDoc(); // Re-read to refresh docObj/docJson
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  const saveKV = async () => {
    setStatus("Saving key/values…"); setErr("");
    try {
      const data = tryParse(docJson, {});
      const p = normalizePath(path, uid);
      // Save all key/value changes with merge
      await setDoc(doc(db, ...pathParts(p)), data, { merge: true });
      setStatus("✅ Saved key/values.");
      await readDoc(); // Re-read to refresh docObj/docJson
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  /* ---------- collection actions ---------- */

  const listCollection = async () => {
    setStatus("Listing…"); setErr(""); setRows([]); setSelected({});
    try {
      const p = normalizePath(path, uid);
      // Use query(..., qLimit(500)) for performance and safety
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
        // Exclude the _id field from the data written
        const { _id, ...rest } = r;
        const data = unflatten(rest);
        
        if (_id.startsWith("__new__")) {
          // New Document: Use doc() to auto-generate a new ID
          const newRef = doc(colRef);
          batch.set(newRef, data, { merge: true });
          newMap.push({ temp: _id, real: newRef.id });
        } else {
          // Existing Document: Set using its existing ID
          batch.set(doc(colRef, _id), data, { merge: true });
        }
      }
      
      await batch.commit();
      
      // Update the local state with real IDs for new documents
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
        // Only delete if it's an existing document (not a __new__ temp ID)
        if (!id.startsWith("__new__")) batch.delete(doc(colRef, id)); 
      });
      
      await batch.commit();
      setRows((prev) => prev.filter((r) => !ids.includes(r._id)));
      setSelected({});
      setStatus(`✅ Deleted ${ids.filter(id => !id.startsWith("__new__")).length} documents.`);
    } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
  };

  /* ---------- import / export ---------- */

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
        // Document: Load raw JSON to the textarea
        setDocJson(txt);
        setStatus("Loaded JSON into editor. Click Save or Replace to apply.");
      } else {
        // Collection: Load array of docs to the table
        const arr = tryParse(txt, []);
        if (!Array.isArray(arr)) { setErr("JSON must be an array for collection import."); return; }
        
        setRows(arr.map((o) => {
          // Preserve existing _id or assign a new temp ID
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
        // Preserve existing _id or assign a new temp ID
        const id = row._id || "__new__" + Math.random().toString(36).slice(2, 8);
        const { _id, ...rest } = row;
        // Flatten non-_id fields for table editing compatibility
        return { _id: id, ...rest };
      }));
      setStatus(`Loaded ${arr.length} records from CSV. Click Batch Save to apply.`);
    };
    r.readAsText(f); e.target.value = "";
  };

  /* ---------- presets ---------- */
  // CRITICAL FIX: Corrected preset paths to match case and structure shown in Firebase screenshot
  const presets = [
    // Corrected to COMMITMENT_BANK (Uppercase, targets the document)
    { label: "✅ Commitment Bank (Doc)", value: "metadata/config/COMMITMENT_BANK" },
    
    // Corrected TARGET_REP_CATALOG (Uppercase, targets the document)
    { label: "🎯 Target Rep Catalog (Doc)", value: "metadata/config/TARGET_REP_CATALOG" },
    
    // Assumed other single-document catalog names follow the same pattern (Document ID = Name)
    { label: "🗺️ Leadership Domains (Doc)", value: "metadata/config/leadership_domains" },
    { label: "🪜 Leadership Tiers (Doc)", value: "metadata/config/leadership_tiers" },
    { label: "⚡ Quick Challenge Catalog (Doc)", value: "metadata/config/quick_challenge_catalog" },
    { label: "📚 Resource Library (Doc)", value: "metadata/config/resource_library" },
    { label: "🎬 Scenario Catalog (Doc)", value: "metadata/config/scenario_catalog" },
    { label: "🎥 Video Catalog (Doc)", value: "metadata/config/video_catalog" },

    // Reading Catalog appears to be correct as metadata/reading_catalog
    { label: "📖 Reading Catalog (Doc)", value: "metadata/reading_catalog" },
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
            <button className={`px-4 py-2 rounded-lg border ${liveUnsub ? 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200' : 'bg-white text-gray-700 hover:bg-gray-100'}`} onClick={listenDoc}>
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

          {/* Editors (Full Width) */}
          <div className="flex flex-col gap-6 mb-6">
            {/* Array Editor (Full Width) */}
            <div className="bg-white p-4 rounded-lg shadow-md border">
              <div className="flex items-center justify-between mb-3">
                <div className="text-base font-semibold text-gray-800">Array Table Editor (Full Width)</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Field:</span>
                  <select 
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500" 
                    value={activeArray} 
                    onChange={(e) => setActiveArray(e.target.value)}
                  >
                    <option value="" disabled>-- Select Array Field --</option>
                    {arrayFields.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              {isReading ? <LoaderSpinner /> : arrayFields.length ? (
                <ArrayTable
                  fieldName={activeArray}
                  rows={arrayRows}
                  setRows={setArrayRows}
                  onSave={saveArray}
                  isLoading={isReading}
                />
              ) : (
                <div className="text-sm text-gray-600 p-4 border rounded bg-gray-50">
                  No array fields (e.g., lists or arrays of objects) were found in the document. Click **Read Doc** to load an array-containing document.
                </div>
              )}
            </div>

            {/* KV Editor (Full Width) */}
            <div className="bg-white p-4 rounded-lg shadow-md border">
              <div className="text-base font-semibold text-gray-800 mb-2">Key/Value Table (Dot-Path Editor - Full Width)</div>
              <KVEditor
                value={docObj}
                onChange={(obj) => setDocJson(pretty(obj))}
                onSave={saveKV}
                isLoading={isReading}
              />
            </div>
          </div>

          {/* JSON Editor (Moved to Bottom, Full Width) */}
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="text-base font-semibold text-gray-800 mb-2">Full Document JSON (Raw Edit)</div>
            <textarea 
              className="w-full min-h-[500px] font-mono border border-gray-300 rounded p-3 text-xs bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500" 
              spellCheck={false} 
              value={docJson} 
              onChange={(e) => setDocJson(e.target.value)} 
              placeholder="Document content will load here. Edit and use 'Save (Merge)' or 'Replace (Set)'."
            />
          </div>
        </>
      ) : isCollectionPath(path) ? (
        <>
          <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-lg shadow-md border">
            <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition shadow-md" onClick={listCollection}>📋 List Collection (max 500)</button>
            <button className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 transition" onClick={addRow}>➕ Add New Row (Local)</button>
            <button className="px-4 py-2 rounded-lg border border-green-300 bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition" onClick={batchSave} disabled={!rows.length}>💾 Batch Save All Changes</button>
            <button className="px-4 py-2 rounded-lg border border-red-600 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition" onClick={deleteSelected} disabled={!Object.values(selected).some(Boolean)}>🗑️ Delete Selected</button>
            
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
                          <input 
                            className="w-full border rounded px-2 py-1 font-mono text-xs focus:ring-blue-500 focus:border-blue-500" 
                            value={r[c] ?? ""} 
                            onChange={(e) => setCell(r._id, c, e.target.value)} 
                            placeholder={c}
                            title={c}
                          />
                        )}
                      </td>
                    ))}
                    <td className="p-2 border-b align-top text-center">
                      {r._id.startsWith("__new__") ? <span className="text-xs text-yellow-700 font-medium">Local New</span> : (
                        <button className="text-xs text-red-600 underline hover:text-red-800" onClick={async () => {
                          if (!window.confirm(`Delete document ${r._id}?`)) return;
                          try {
                            const p = normalizePath(path, uid);
                            await deleteDoc(doc(collection(db, ...pathParts(p)), r._id));
                            setRows((prev) => prev.filter((x) => x._id !== r._id));
                            setStatus(`✅ Deleted document ${r._id}.`);
                          } catch (e) { setErr(String(e)); setStatus("❌ Error"); }
                        }}>🗑️ delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}