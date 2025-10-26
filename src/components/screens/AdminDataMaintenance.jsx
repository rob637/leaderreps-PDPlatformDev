/* AdminDataMaintenance.jsx
   Firestore Admin: Doc Viewer + Collection Grid + Import/Export
   - No dependency on useAppServices.jsx (fixes "Could not resolve" build error)
   - Uses only Firebase client SDK (auth + firestore)
   - Keeps live doc viewer + adds editable collection grid
*/

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getFirestore, doc, collection, getDoc, getDocs, onSnapshot,
  setDoc, addDoc, deleteDoc, writeBatch, query, limit
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Download, Upload, Play, Pause, RefreshCw, Trash2, Save, Plus, Eye, Database } from "lucide-react";

/* ----------------------------- helpers ----------------------------- */

const pathExplain = (path) => {
  const parts = (path || "").split("/").filter(Boolean);
  // Firestore alternates: collection / doc / collection / doc ...
  const kind = parts.length % 2 === 0 ? "collection" : "document";
  const tip = kind === "collection"
    ? "This is a collection path. You can list, add, import documents here."
    : "This is a document path. Use Read/Listen/Save/Replace/Delete on this JSON.";
  return { parts, kind, tip };
};

const tryJson = (s) => { try { return JSON.parse(s); } catch { return null; } };
const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

const coerce = (v) => {
  if (v === "null") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  const j = typeof v === "string" ? tryJson(v) : null;
  return j !== null ? j : v;
};

const parseCSV = (text) => {
  const rows = [];
  let i = 0, field = "", row = [], inQuotes = false;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { rows.push(row); row = []; };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    } else {
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ",") { pushField(); i++; continue; }
      if (ch === "\r") { i++; continue; }
      if (ch === "\n") { pushField(); pushRow(); i++; continue; }
      field += ch; i++; continue;
    }
  }
  pushField(); pushRow();
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ""));
};

const toCSV = (rows, columns) => {
  const esc = (v) => {
    const s = typeof v === "string" ? v : JSON.stringify(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.join(",");
  const lines = rows.map(r => columns.map(c => esc(c === "__id" ? r.__id : r[c])).join(","));
  return [header, ...lines].join("\n");
};

const inferColumns = (docs) => {
  const set = new Set(["__id"]);
  docs.forEach(r => Object.keys(r.data || {}).forEach(k => set.add(k)));
  return Array.from(set);
};

const downloadText = (filename, text) => {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 300);
};

/* ------------------------------ component ---------------------------- */

export default function AdminDataMaintenance() {
  const db = getFirestore();
  const auth = getAuth();
  const uid = auth.currentUser?.uid || "<uid>";

  // Presets you used before (kept)
  const presets = [
    { label: "metadata/config (doc)", path: "metadata/config" },
    { label: "metadata/reading_catalog (doc)", path: "metadata/reading_catalog" },
    { label: "leadership_plan/<uid>/profile/roadmap (doc)", path: `leadership_plan/${uid}/profile/roadmap` },
    { label: "user_commitments/<uid>/profile/active (doc)", path: `user_commitments/${uid}/profile/active` },
    { label: "user_planning/<uid>/profile/drafts (doc)", path: `user_planning/${uid}/profile/drafts` },
    { label: "metadata (collection)", path: "metadata" },
  ];

  const [path, setPath] = useState(presets[0].path);
  const { kind, tip } = useMemo(() => pathExplain(path), [path]);

  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");

  // Document state
  const [docJson, setDocJson] = useState("{}");
  const [docExists, setDocExists] = useState(false);
  const [listening, setListening] = useState(false);
  const unsubRef = useRef(null);

  // Collection state
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState(["__id"]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => () => stopListen(), []);
  const stopListen = () => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; setListening(false); }
  };

  /* ----------------------------- Doc actions ----------------------------- */

  const readDoc = async () => {
    setError(""); setStatus("Reading doc…");
    try {
      const ref = doc(db, ...path.split("/"));
      const snap = await getDoc(ref);
      setDocExists(snap.exists());
      setDocJson(JSON.stringify(snap.exists() ? (snap.data() || {}) : {}, null, 2));
      setStatus(`Read @ ${new Date().toISOString()}`);
    } catch (e) { setError(String(e)); setStatus("Error"); }
  };

  const toggleListen = async () => {
    if (listening) return stopListen();
    setError("");
    try {
      const ref = doc(db, ...path.split("/"));
      unsubRef.current = onSnapshot(ref, (snap) => {
        setDocExists(snap.exists());
        setDocJson(JSON.stringify(snap.exists() ? (snap.data() || {}) : {}, null, 2));
        setStatus(`Live @ ${new Date().toLocaleTimeString()}`);
        console.log("[ADMIN LIVE]", path, snap.exists(), snap.data());
      });
      setListening(true);
    } catch (e) { setError(String(e)); }
  };

  const saveDocMerge = async () => {
    setError(""); setStatus("Saving (merge)…");
    try {
      const data = tryJson(docJson);
      if (!isObject(data)) throw new Error("Invalid JSON (object required).");
      await setDoc(doc(db, ...path.split("/")), data, { merge: true });
      setStatus("Saved (merge).");
    } catch (e) { setError(String(e)); setStatus("Error"); }
  };

  const replaceDoc = async () => {
    setError(""); setStatus("Replacing…");
    try {
      const data = tryJson(docJson);
      if (!isObject(data)) throw new Error("Invalid JSON (object required).");
      await setDoc(doc(db, ...path.split("/")), data, { merge: false });
      setStatus("Replaced.");
    } catch (e) { setError(String(e)); setStatus("Error"); }
  };

  const deleteDocNow = async () => {
    setError(""); setStatus("Deleting…");
    try {
      await deleteDoc(doc(db, ...path.split("/")));
      setDocExists(false);
      setDocJson("{}");
      setStatus("Deleted.");
    } catch (e) { setError(String(e)); setStatus("Error"); }
  };

  /* -------------------------- Collection actions ------------------------- */

  const listCollection = async () => {
    setLoadingList(true); setError("");
    try {
      const ref = collection(db, ...path.split("/"));
      const snap = await getDocs(query(ref, limit(500)));
      const records = [];
      snap.forEach(d => records.push({ __id: d.id, ...(d.data() || {}) }));
      setRows(records);
      setColumns(inferColumns(records));
      setStatus(`Listed ${records.length} doc(s).`);
    } catch (e) { setError(String(e)); setStatus("Error"); }
    finally { setLoadingList(false); }
  };

  const updateCell = (id, key, value) => {
    setRows(prev => prev.map(r => (r.__id === id ? { ...r, [key]: value } : r)));
  };

  const saveRow = async (row) => {
    setError(""); setStatus(`Saving ${row.__id}…`);
    try {
      const { __id, ...data } = row;
      const normalized = {};
      Object.entries(data).forEach(([k, v]) => normalized[k] = coerce(v));
      await setDoc(doc(db, ...path.split("/"), __id), normalized, { merge: true });
      setStatus(`Saved ${__id}.`);
    } catch (e) { setError(String(e)); setStatus("Error"); }
  };

  const addRow = async () => {
    setError("");
    try {
      const ref = collection(db, ...path.split("/"));
      const created = await addDoc(ref, { created_at: new Date().toISOString() });
      setRows(prev => [{ __id: created.id, created_at: new Date().toISOString() }, ...prev]);
      if (!columns.includes("__id")) setColumns(prev => ["__id", ...prev]);
      setStatus(`Added ${created.id}.`);
    } catch (e) { setError(String(e)); setStatus("Error"); }
  };

  const deleteRowOne = async (id) => {
    setError(""); setStatus(`Deleting ${id}…`);
    try {
      await deleteDoc(doc(db, ...path.split("/"), id));
      setRows(prev => prev.filter(r => r.__id !== id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      setStatus(`Deleted ${id}.`);
    } catch (e) { setError(String(e)); setStatus("Error"); }
  };

  const batchSave = async () => {
    setError(""); setStatus("Batch saving…");
    try {
      const b = writeBatch(db);
      rows.forEach(r => {
        const { __id, ...data } = r;
        const normalized = {};
        Object.entries(data).forEach(([k, v]) => normalized[k] = coerce(v));
        b.set(doc(db, ...path.split("/"), __id), normalized, { merge: true });
      });
      await b.commit();
      setStatus(`Batch saved ${rows.length} doc(s).`);
    } catch (e) { setError(String(e)); setStatus("Error"); }
  };

  const batchDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setError(""); setStatus("Batch deleting…");
    try {
      const b = writeBatch(db);
      selectedIds.forEach(id => b.delete(doc(db, ...path.split("/"), id)));
      await b.commit();
      setRows(prev => prev.filter(r => !selectedIds.has(r.__id)));
      setSelectedIds(new Set());
      setStatus("Batch delete complete.");
    } catch (e) { setError(String(e)); setStatus("Error"); }
  };

  /* ----------------------------- Import/Export ---------------------------- */

  const importJSON = async (file) => {
    setError("");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const b = writeBatch(db);

      if (Array.isArray(parsed)) {
        parsed.forEach((obj, i) => {
          const id = String(obj.__id || obj.id || `row_${Date.now()}_${i}`);
          const data = { ...obj }; delete data.id; delete data.__id;
          Object.entries(data).forEach(([k, v]) => data[k] = coerce(v));
          b.set(doc(db, ...path.split("/"), id), data, { merge: true });
        });
        await b.commit();
        await listCollection();
        setStatus(`Imported ${parsed.length} doc(s).`);
      } else {
        const id = String(parsed.__id || parsed.id || `row_${Date.now()}`);
        const data = { ...parsed }; delete data.id; delete data.__id;
        Object.entries(data).forEach(([k, v]) => data[k] = coerce(v));
        await setDoc(doc(db, ...path.split("/"), id), data, { merge: true });
        await listCollection();
        setStatus("Imported 1 doc.");
      }
    } catch (e) { setError(String(e)); }
  };

  const importCSV = async (file) => {
    setError("");
    try {
      const text = await file.text();
      const rowsCsv = parseCSV(text);
      if (rowsCsv.length < 2) throw new Error("CSV needs a header row and at least one data row.");
      const headers = rowsCsv[0];
      const idIndex = headers.findIndex(h => h === "id" || h === "__id");

      const b = writeBatch(db);
      rowsCsv.slice(1).forEach((arr, i) => {
        if (arr.every(v => (v ?? "") === "")) return;
        const obj = {};
        headers.forEach((h, j) => obj[h] = coerce(arr[j] ?? ""));
        const id = String(idIndex >= 0 ? (arr[idIndex] || `row_${Date.now()}_${i}`) : `row_${Date.now()}_${i}`);
        delete obj.id; delete obj.__id;
        b.set(doc(db, ...path.split("/"), id), obj, { merge: true });
      });
      await b.commit();
      await listCollection();
      setStatus(`Imported ${rowsCsv.length - 1} doc(s) from CSV.`);
    } catch (e) { setError(String(e)); }
  };

  const exportJSON = () => {
    if (kind === "document") downloadText("document.json", docJson);
    else downloadText("collection.json", JSON.stringify(rows, null, 2));
  };

  const exportCSV = () => {
    if (kind !== "collection") return;
    const csv = toCSV(rows, columns);
    downloadText("collection.csv", csv);
  };

  /* --------------------------------- UI --------------------------------- */

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-6 h-6 text-slate-700" />
        <h2 className="text-2xl font-bold">Admin · Firestore Data Manager</h2>
      </div>

      <div className="mb-3">
        <div className="text-xs text-slate-600 mb-2">Presets</div>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => setPath(p.path)}
              className="text-xs px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50"
              title={p.path}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className="flex-1 px-3 py-2 rounded border border-slate-300"
          placeholder="collection or collection/doc/collection/doc"
        />
        <button
          onClick={() => (kind === "document" ? readDoc() : listCollection())}
          className="px-3 py-2 bg-slate-800 text-white rounded hover:bg-slate-700"
        >
          {kind === "document" ? "Read Doc" : "List Collection"}
        </button>
        <button onClick={exportJSON} className="px-3 py-2 border rounded bg-white">
          <Download className="w-4 h-4 inline-block mr-1" /> Export JSON
        </button>
        {kind === "collection" && (
          <button onClick={exportCSV} className="px-3 py-2 border rounded bg-white">
            <Download className="w-4 h-4 inline-block mr-1" /> Export CSV
          </button>
        )}
        <button
          onClick={() => window.alert(tip)}
          className="px-3 py-2 border rounded bg-white"
          title="Explain Path"
        >
          <Eye className="w-4 h-4 inline-block mr-1" /> Path Help
        </button>
      </div>

      <div className="text-sm text-slate-600 mb-4">
        <strong>Path type:</strong> <span className="font-mono">{kind}</span> — {tip}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
      <div className="mb-4 p-2 text-xs text-slate-600">
        <strong>Status:</strong> {status}
      </div>

      {/* ------------------- Document panel ------------------- */}
      {kind === "document" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Document Result</div>
              <div className="flex items-center gap-2">
                <button onClick={readDoc} className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 border">
                  <RefreshCw className="w-4 h-4 inline-block mr-1" /> Read
                </button>
                <button onClick={toggleListen} className={`px-3 py-1.5 rounded border ${listening ? "bg-green-100 border-green-300" : "bg-slate-100"}`}>
                  {listening ? <><Pause className="w-4 h-4 inline-block mr-1" /> Stop</> : <><Play className="w-4 h-4 inline-block mr-1" /> Listen</>}
                </button>
              </div>
            </div>

            <textarea
              className="w-full h-96 p-3 font-mono text-xs border rounded"
              value={docJson}
              onChange={(e) => setDocJson(e.target.value)}
            />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={saveDocMerge} className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700">
                <Save className="w-4 h-4 inline-block mr-1" /> Save (merge)
              </button>
              <button onClick={replaceDoc} className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">
                Replace
              </button>
              <button onClick={deleteDocNow} className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">
                <Trash2 className="w-4 h-4 inline-block mr-1" /> Delete
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="p-3 border rounded bg-white">
              <div className="font-semibold mb-2">Doc Meta</div>
              <div className="text-sm"><strong>Exists:</strong> {String(docExists)}</div>
              <div className="text-xs text-slate-600 mt-2">
                Tip: While listening, try a write in console:
                <pre className="mt-2 bg-slate-50 p-2 rounded border whitespace-pre-wrap">
{`await setDoc(
  doc(getFirestore(), "${path.replace(/"/g, '\\"')}"),
  { test_write: Date.now() },
  { merge: true }
);`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- Collection panel ------------------- */}
      {kind === "collection" && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={listCollection} className="px-3 py-1.5 rounded bg-slate-800 text-white hover:bg-slate-700">
              <RefreshCw className="w-4 h-4 inline-block mr-1" /> {loadingList ? "Loading…" : "List Collection"}
            </button>
            <button onClick={addRow} className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="w-4 h-4 inline-block mr-1" /> Add Row
            </button>
            <button onClick={batchSave} className="px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700">
              <Save className="w-4 h-4 inline-block mr-1" /> Batch Save
            </button>
            <button onClick={batchDeleteSelected} className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">
              <Trash2 className="w-4 h-4 inline-block mr-1" /> Delete Selected
            </button>

            <label className="ml-4 px-3 py-1.5 rounded border bg-white cursor-pointer">
              <Upload className="w-4 h-4 inline-block mr-1" /> Import JSON
              <input type="file" accept=".json,application/json" className="hidden"
                     onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
            </label>
            <label className="px-3 py-1.5 rounded border bg-white cursor-pointer">
              <Upload className="w-4 h-4 inline-block mr-1" /> Import CSV
              <input type="file" accept=".csv,text/csv" className="hidden"
                     onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])} />
            </label>
          </div>

          <div className="overflow-auto border rounded bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-3 py-2 border-r w-10">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && selectedIds.size === rows.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(new Set(rows.map(r => r.__id)));
                        else setSelectedIds(new Set());
                      }}
                    />
                  </th>
                  {columns.map((c) => (
                    <th key={c} className="px-3 py-2 border-r text-left">{c}</th>
                  ))}
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.__id} className="border-b hover:bg-slate-50">
                    <td className="px-3 py-2 border-r">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.__id)}
                        onChange={(e) => {
                          setSelectedIds(prev => {
                            const n = new Set(prev);
                            if (e.target.checked) n.add(r.__id); else n.delete(r.__id);
                            return n;
                          });
                        }}
                      />
                    </td>
                    {columns.map((c) => {
                      const val = c === "__id" ? r.__id : r[c];
                      const asText = typeof val === "string" ? val : JSON.stringify(val ?? "");
                      const readOnly = c === "__id";
                      return (
                        <td key={c} className="px-3 py-1.5 border-r align-top">
                          <input
                            readOnly={readOnly}
                            className={`w-full text-xs px-2 py-1 border rounded ${readOnly ? "bg-slate-100" : "bg-white"}`}
                            value={asText}
                            onChange={(e) => updateCell(r.__id, c, e.target.value)}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-1.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveRow(r)}
                          className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                          title="Save row"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRowOne(r.__id)}
                          className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 2} className="px-3 py-10 text-center text-slate-500">
                      No documents loaded. Click <strong>List Collection</strong> or <strong>Add Row</strong>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-slate-500 mt-2">
            Editing notes: values auto-coerce to numbers/booleans/JSON. Wrap in quotes to force plain strings.
          </div>
        </div>
      )}
    </div>
  );
}
