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

/* ----------------------- utilities ----------------------- */

const pretty = (v) => JSON.stringify(v ?? {}, null, 2);
const tryParse = (t, fb) => { try { return JSON.parse(t); } catch { return fb; } };
const pathParts = (p) => p.trim().split("/").filter(Boolean);
const isDocumentPath = (p) => pathParts(p).length % 2 === 0;
const isCollectionPath = (p) => pathParts(p).length % 2 === 1;

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
    if (Array.isArray(v) || (v && typeof v === "object")) {
      // store arrays/objects as JSON strings at leaf cells for table editing
      out[key] = Array.isArray(v) || typeof v === "object" ? JSON.stringify(v) : v;
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
  const headers = lines[0].match(/("([^"]|"")*"|[^,]+)/g) || [];
  const parseCell = (cell) => {
    const unq = (cell || "").replace(/^"(.*)"$/, (_, p1) => p1.replace(/""/g, '"'));
    return coerce(unq);
  };
  return lines.slice(1).map((line) => {
    const parts = line.match(/("([^"]|"")*"|[^,]+)/g) || [];
    const row = {};
    headers.forEach((h, i) => (row[h] = parseCell(parts[i] ?? "")));
    return row;
  });
};

/* ----------------------- UI components ----------------------- */

function KVEditor({ value, onChange, onSave }) {
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
      <div className="p-2 flex items-center gap-2">
        <button className="px-2 py-1 border rounded" onClick={addRow}>Add Field</button>
        <button className="px-2 py-1 border rounded" onClick={onSave}>Save Key/Values</button>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {cols.map((c) => <th key={c} className="p-2 border-b text-left">{c}</th>)}
              <th className="p-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr><td colSpan={3} className="p-6 text-center text-gray-500">No fields yet.</td></tr>
            ) : rows.map((r, idx) => (
              <tr key={idx} className="odd:bg-white even:bg-gray-50">
                <td className="p-1.5 border-b"><input className="w-full border rounded px-2 py-1 font-mono" value={r.key} onChange={(e) => update(idx, "key", e.target.value)} /></td>
                <td className="p-1.5 border-b"><input className="w-full border rounded px-2 py-1 font-mono" value={r.value} onChange={(e) => update(idx, "value", e.target.value)} /></td>
                <td className="p-1.5 border-b"><button className="text-xs text-red-600 underline" onClick={() => delRow(idx)}>delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArrayTable({ fieldName, rows, setRows, onSave }) {
  const cols = useMemo(() => inferColumns(rows), [rows]);

  const add = () => setRows((prev) => [{ _id: String(Date.now()) }, ...prev]);
  const edit = (id, key, val) => setRows((prev) => prev.map((r) => (r._id === id ? { ...r, [key]: val } : r)));
  const del = (id) => setRows((prev) => prev.filter((r) => r._id !== id));

  return (
    <div className="border rounded">
      <div className="p-2 flex items-center gap-2">
        <button className="px-2 py-1 border rounded" onClick={add}>Add Row</button>
        <button className="px-2 py-1 border rounded" onClick={onSave}>Save {fieldName}</button>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {cols.map((c) => <th key={c} className="p-2 border-b text-left">{c}</th>)}
              <th className="p-2 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr><td colSpan={cols.length + 1} className="p-6 text-center text-gray-500">No rows. Add one.</td></tr>
            ) : rows.map((r) => (
              <tr key={r._id} className="odd:bg-white even:bg-gray-50">
                {cols.map((c) => (
                  <td key={c} className="p-1.5 border-b">
                    {c === "_id" ? (
                      <div className="px-2 py-1 rounded bg-gray-100 font-mono">{r._id}</div>
                    ) : (
                      <input className="w-full border rounded px-2 py-1 font-mono" value={r[c] ?? ""} onChange={(e) => edit(r._id, c, e.target.value)} />
                    )}
                  </td>
                ))}
                <td className="p-1.5 border-b">
                  <button className="text-xs text-red-600 underline" onClick={() => del(r._id)}>delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

  useEffect(() => { if (!activeArray && arrayFields.length) setActiveArray(arrayFields[0]); }, [arrayFields, activeArray]);

  const explain = isDocumentPath(path)
    ? "Path type: document — read/listen/edit/replace/delete"
    : isCollectionPath(path)
    ? "Path type: collection — list/add/edit/delete/import/export"
    : "Enter a Firestore path";

  /* ---------- document actions ---------- */

  const readDoc = async () => {
    setStatus("Reading…"); setErr("");
    try {
      const p = normalizePath(path, uid);
      const ref = doc(db, ...pathParts(p));
      const snap = await getDoc(ref);
      setDocExists(snap.exists());
      setDocJson(pretty(snap.exists() ? snap.data() : {}));
      setStatus("Done.");
    } catch (e) { setErr(String(e)); setStatus("Error"); }
  };

  const listenDoc = () => {
    setStatus("Listening…"); setErr("");
    try {
      liveUnsub && liveUnsub();
      const p = normalizePath(path, uid);
      const ref = doc(db, ...pathParts(p));
      const unsub = onSnapshot(ref, (snap) => {
        setDocExists(snap.exists());
        setDocJson(pretty(snap.exists() ? snap.data() : {}));
        setStatus("Live");
      }, (e) => { setErr(String(e)); setStatus("Error"); });
      setLiveUnsub(() => unsub);
    } catch (e) { setErr(String(e)); setStatus("Error"); }
  };

  const saveMerge = async () => {
    setStatus("Saving (merge)…"); setErr("");
    try {
      const data = tryParse(docJson, null);
      if (data == null) throw new Error("Invalid JSON.");
      const p = normalizePath(path, uid);
      await setDoc(doc(db, ...pathParts(p)), data, { merge: true });
      setStatus("Saved (merge).");
    } catch (e) { setErr(String(e)); setStatus("Error"); }
  };

  const replaceSet = async () => {
    setStatus("Replacing…"); setErr("");
    try {
      const data = tryParse(docJson, null);
      if (data == null) throw new Error("Invalid JSON.");
      const p = normalizePath(path, uid);
      await setDoc(doc(db, ...pathParts(p)), data);
      setStatus("Replaced.");
    } catch (e) { setErr(String(e)); setStatus("Error"); }
  };

  const deleteTheDoc = async () => {
    setStatus("Deleting…"); setErr("");
    try {
      const p = normalizePath(path, uid);
      await deleteDoc(doc(db, ...pathParts(p)));
      setDocExists(false);
      setDocJson("{}");
      setStatus("Deleted.");
    } catch (e) { setErr(String(e)); setStatus("Error"); }
  };

  const saveArray = async () => {
    if (!activeArray) return;
    setStatus(`Saving array "${activeArray}"…`); setErr("");
    try {
      const data = tryParse(docJson, {});
      const p = normalizePath(path, uid);
      await setDoc(doc(db, ...pathParts(p)), { [activeArray]: data[activeArray], _lastEdited: nowIso() }, { merge: true });
      setStatus(`Saved "${activeArray}".`);
      await readDoc();
    } catch (e) { setErr(String(e)); setStatus("Error"); }
  };

  const saveKV = async () => {
    setStatus("Saving key/values…"); setErr("");
    try {
      const data = tryParse(docJson, {});
      const p = normalizePath(path, uid);
      await setDoc(doc(db, ...pathParts(p)), data, { merge: true });
      setStatus("Saved key/values.");
      await readDoc();
    } catch (e) { setErr(String(e)); setStatus("Error"); }
  };

  /* ---------- collection actions ---------- */

  const listCollection = async () => {
    setStatus("Listing…"); setErr(""); setRows([]); setSelected({});
    try {
      const p = normalizePath(path, uid);
      const snap = await getDocs(query(collection(db, ...pathParts(p)), qLimit(500)));
      const list = [];
      snap.forEach((d) => list.push({ _id: d.id, ...flatten(d.data()) }));
      setRows(list);
      setStatus(`Listed ${list.length} docs.`);
    } catch (e) { setErr(String(e)); setStatus("Error"); }
  };

  const addRow = () => setRows((r) => [{ _id: "__new__" + Math.random().toString(36).slice(2, 8) }, ...r]);
  const setCell = (id, key, val) => setRows((r) => r.map((x) => (x._id === id ? { ...x, [key]: val } : x)));
  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const batchSave = async () => {
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
      setStatus("Batch saved.");
    } catch (e) { setErr(String(e)); setStatus("Error"); }
  };

  const deleteSelected = async () => {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (!ids.length) return;
    setStatus("Deleting…"); setErr("");
    try {
      const p = normalizePath(path, uid);
      const colRef = collection(db, ...pathParts(p));
      const batch = writeBatch(db);
      ids.forEach((id) => { if (!id.startsWith("__new__")) batch.delete(doc(colRef, id)); });
      await batch.commit();
      setRows((prev) => prev.filter((r) => !ids.includes(r._id)));
      setSelected({});
      setStatus("Deleted.");
    } catch (e) { setErr(String(e)); setStatus("Error"); }
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
      if (isDocumentPath(path)) setDocJson(txt);
      else {
        const arr = tryParse(txt, []);
        if (!Array.isArray(arr)) { setErr("JSON must be an array for collection import."); return; }
        setRows(arr.map((o) => {
          const id = o._id || "__new__" + Math.random().toString(36).slice(2, 8);
          const { _id, ...rest } = o;
          return { _id: id, ...flatten(rest) };
        }));
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
      const arr = fromCSV(String(r.result || ""));
      setRows(arr.map((row) => {
        const id = row._id || "__new__" + Math.random().toString(36).slice(2, 8);
        const { _id, ...rest } = row;
        return { _id: id, ...rest };
      }));
    };
    r.readAsText(f); e.target.value = "";
  };

  /* ---------- presets ---------- */

  const presets = [
    { label: "metadata/config (doc)", value: "metadata/config" },
    { label: "metadata/reading_catalog (doc)", value: "metadata/reading_catalog" },
    { label: "leadership_plan/<uid>/profile/roadmap (doc)", value: "leadership_plan/<uid>/profile/roadmap" },
    { label: "user_commitments/<uid>/profile/active (doc)", value: "user_commitments/<uid>/profile/active" },
    { label: "user_planning/<uid>/profile/drafts (doc)", value: "user_planning/<uid>/profile/drafts" },
    { label: "metadata (collection)", value: "metadata" },
  ];

  /* ----------------------- render ----------------------- */

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin · Firestore Data Manager</h1>

      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map((p) => (
          <button key={p.value} className="px-2 py-1 rounded border text-sm hover:bg-gray-50" onClick={() => setPath(p.value)} title={p.value}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input className="flex-1 border rounded px-3 py-2"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="collection or document path… (supports <uid>)"
          onKeyDown={(e) => { if (e.key === "Enter") isDocumentPath(path) ? readDoc() : listCollection(); }}
        />
        <button className="px-3 py-2 border rounded"
          onClick={() => alert("Even segments = document (e.g., metadata/config). Odd = collection (e.g., metadata). You can type <uid> and it will be replaced.")}>
          Path Help
        </button>
      </div>
      <div className="text-sm text-gray-600 mb-3">{explain}</div>

      {isDocumentPath(path) ? (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={readDoc}>Read Doc</button>
            <button className="px-3 py-2 rounded border" onClick={listenDoc}>Listen (live)</button>
            <button className="px-3 py-2 rounded border" onClick={saveMerge}>Save (Merge)</button>
            <button className="px-3 py-2 rounded border" onClick={replaceSet}>Replace (Set)</button>
            <button className="px-3 py-2 rounded border text-red-600" onClick={deleteTheDoc}>Delete Doc</button>
            <button className="px-3 py-2 rounded border" onClick={exportJSON}>Export JSON</button>
            <label className="px-3 py-2 rounded border cursor-pointer">Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
            </label>
            <div className="ml-auto text-sm">Doc exists: <span className={docExists ? "text-green-700" : "text-red-700"}>{String(docExists)}</span></div>
          </div>

          <div className="mb-2 text-sm">
            <span className="font-medium">Status:</span> {status}
          </div>
          {err && <div className="mb-3 p-3 border rounded bg-red-50 text-red-700 text-sm">Error: {err}</div>}

          {/* Editors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: JSON */}
            <div>
              <div className="text-sm font-medium mb-1">Document JSON</div>
              <textarea className="w-full min-h-[420px] font-mono border rounded p-3" spellCheck={false} value={docJson} onChange={(e) => setDocJson(e.target.value)} />
            </div>

            {/* Right: Arrays + Key/Value */}
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Array Table Editor</div>
                  <div className="flex items-center gap-2">
                    <select className="border rounded px-2 py-1" value={activeArray} onChange={(e) => setActiveArray(e.target.value)}>
                      {arrayFields.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                {arrayFields.length ? (
                  <ArrayTable
                    fieldName={activeArray || "(pick a field)"}
                    rows={arrayRows}
                    setRows={setArrayRows}
                    onSave={saveArray}
                  />
                ) : (
                  <div className="text-sm text-gray-600">
                    No array fields detected. Docs like
                    <code className="mx-1">leadership_plan/&lt;uid&gt;/profile/roadmap</code> (field <code>plan_goals</code>) or
                    <code className="mx-1">user_commitments/&lt;uid&gt;/profile/active</code> (field <code>active_commitments</code>) will appear here after you click <b>Read Doc</b>.
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Key/Value Table (dot-path)</div>
                <KVEditor
                  value={docObj}
                  onChange={(obj) => setDocJson(pretty(obj))}
                  onSave={saveKV}
                />
              </div>
            </div>
          </div>
        </>
      ) : isCollectionPath(path) ? (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={listCollection}>List Collection</button>
            <button className="px-3 py-2 rounded border" onClick={addRow}>Add Row</button>
            <button className="px-3 py-2 rounded border" onClick={batchSave} disabled={!rows.length}>Batch Save</button>
            <button className="px-3 py-2 rounded border text-red-600" onClick={deleteSelected} disabled={!Object.values(selected).some(Boolean)}>Delete Selected</button>
            <button className="px-3 py-2 rounded border" onClick={exportCSV} disabled={!rows.length}>Export CSV</button>
            <label className="px-3 py-2 rounded border cursor-pointer">Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
            </label>
            <label className="px-3 py-2 rounded border cursor-pointer">Import CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={importCSV} />
            </label>
          </div>

          <div className="mb-2 text-sm"><span className="font-medium">Status:</span> {status}</div>
          {err && <div className="mb-3 p-3 border rounded bg-red-50 text-red-700 text-sm">Error: {err}</div>}

          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border-b w-10"></th>
                  {cols.map((c) => <th key={c} className="p-2 border-b text-left">{c}</th>)}
                  <th className="p-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!rows.length ? (
                  <tr><td colSpan={cols.length + 2} className="p-6 text-center text-gray-500">No documents loaded. Click <b>List Collection</b> or <b>Add Row</b>.</td></tr>
                ) : rows.map((r) => (
                  <tr key={r._id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border-b align-top">
                      <input type="checkbox" checked={!!selected[r._id]} onChange={() => toggle(r._id)} />
                    </td>
                    {cols.map((c) => (
                      <td key={c} className="p-1.5 border-b align-top">
                        {c === "_id" ? (
                          <div className="px-2 py-1 rounded bg-gray-100 font-mono">{r._id}</div>
                        ) : (
                          <input className="w-full border rounded px-2 py-1 font-mono" value={r[c] ?? ""} onChange={(e) => setCell(r._id, c, e.target.value)} />
                        )}
                      </td>
                    ))}
                    <td className="p-2 border-b">
                      {r._id.startsWith("__new__") ? <span className="text-xs text-gray-500">new</span> : (
                        <button className="text-xs text-red-600 underline" onClick={async () => {
                          try {
                            const p = normalizePath(path, uid);
                            await deleteDoc(doc(collection(db, ...pathParts(p)), r._id));
                            setRows((prev) => prev.filter((x) => x._id !== r._id));
                          } catch (e) { setErr(String(e)); }
                        }}>delete</button>
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
