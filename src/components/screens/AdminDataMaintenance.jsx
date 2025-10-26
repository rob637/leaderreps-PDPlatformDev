import React, { useEffect, useMemo, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  getDocs,
  writeBatch
} from "firebase/firestore";

/**
 * Utility helpers
 */
const jsonPretty = (v) => JSON.stringify(v, null, 2);
const safeParse = (text) => {
  if (!text?.trim()) return {};
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Invalid JSON in editor.");
  }
};
const isEven = (n) => n % 2 === 0;
const pathParts = (p) => p.split("/").filter(Boolean);
const uidify = (p, uid) => p.replaceAll("<uid>", uid || "<uid>");
const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

/** very light CSV helpers (no commas in headers recommended) */
const csvEscape = (s) => {
  const v = String(s ?? "");
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
};
const toCSV = (rows) => {
  if (!rows?.length) return "";
  // Gather union of keys
  const keys = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r || {}).forEach((k) => set.add(k));
      return set;
    }, new Set(["_id"]))
  );
  const header = keys.join(",");
  const body = rows
    .map((r) => keys.map((k) => csvEscape(r?.[k] ?? "")).join(","))
    .join("\n");
  return `${header}\n${body}`;
};
const fromCSV = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const parseLine = (line) => {
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQ) {
        if (c === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (c === '"') {
          inQ = false;
        } else {
          cur += c;
        }
      } else {
        if (c === ",") {
          out.push(cur);
          cur = "";
        } else if (c === '"') {
          inQ = true;
        } else {
          cur += c;
        }
      }
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((ln) => {
    const vals = parseLine(ln);
    const obj = {};
    headers.forEach((h, i) => (obj[h] = vals[i] ?? ""));
    return obj;
  });
};

const DocBadge = ({ exists }) => (
  <span
    className={`ml-2 inline-block text-xs px-2 py-1 rounded ${
      exists ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    }`}
  >
    Doc exists: {String(!!exists)}
  </span>
);

export default function AdminDataMaintenance() {
  const auth = getAuth();
  const db = getFirestore();

  // UI state
  const [rawPath, setRawPath] = useState("metadata/reading_catalog");
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [docExists, setDocExists] = useState(false);
  const [jsonText, setJsonText] = useState("{}");

  // collection data grid
  const [rows, setRows] = useState([]); // [{_id, ...fields}]
  const [selectedIds, setSelectedIds] = useState(new Set());

  // live listener
  const liveUnsubRef = useRef(null);

  const uid = auth.currentUser?.uid || "";
  const resolvedPath = useMemo(() => uidify(rawPath, uid), [rawPath, uid]);
  const parts = useMemo(() => pathParts(resolvedPath), [resolvedPath]);
  const pathType = parts.length === 0 ? "empty" : isEven(parts.length) ? "document" : "collection";

  useEffect(() => {
    // cleanup live listener when path changes
    if (liveUnsubRef.current) {
      liveUnsubRef.current();
      liveUnsubRef.current = null;
    }
    // reset UI bits
    setError("");
    setStatus("Idle");
    setDocExists(false);
    setRows([]);
  }, [resolvedPath]);

  /** Presets for quick navigation */
  const presets = [
    { label: "metadata/config (doc)", value: "metadata/config" },
    { label: "metadata/reading_catalog (doc)", value: "metadata/reading_catalog" },
    { label: "leadership_plan/<uid>/profile/roadmap (doc)", value: "leadership_plan/<uid>/profile/roadmap" },
    { label: "user_commitments/<uid>/profile/active (doc)", value: "user_commitments/<uid>/profile/active" },
    { label: "user_planning/<uid>/profile/drafts (doc)", value: "user_planning/<uid>/profile/drafts" },
    { label: "metadata (collection)", value: "metadata" }
  ];

  /** ------- Document actions ------- */
  const readDoc = async () => {
    try {
      setStatus("Reading…");
      setError("");
      const snap = await getDoc(doc(db, ...parts));
      setDocExists(snap.exists());
      setJsonText(snap.exists() ? jsonPretty(snap.data()) : "{}");
      setStatus("Ready");
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("Error");
    }
  };

  const listenDoc = async () => {
    try {
      if (liveUnsubRef.current) {
        liveUnsubRef.current();
        liveUnsubRef.current = null;
        setStatus("Live listener: OFF");
        return;
      }
      const unsub = onSnapshot(doc(db, ...parts), (snap) => {
        setDocExists(snap.exists());
        setJsonText(snap.exists() ? jsonPretty(snap.data()) : "{}");
      });
      liveUnsubRef.current = unsub;
      setStatus("Live listener: ON");
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("Error");
    }
  };

  const saveMerge = async () => {
    try {
      setStatus("Saving (merge)…");
      setError("");
      const data = safeParse(jsonText);
      await setDoc(doc(db, ...parts), data, { merge: true });
      setStatus("Saved (merge)");
      setDocExists(true);
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("Error");
    }
  };

  const replaceSet = async () => {
    try {
      setStatus("Replacing (set)…");
      setError("");
      const data = safeParse(jsonText);
      await setDoc(doc(db, ...parts), data, { merge: false });
      setStatus("Replaced (set)");
      setDocExists(true);
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("Error");
    }
  };

  const removeDoc = async () => {
    try {
      setStatus("Deleting…");
      setError("");
      await deleteDoc(doc(db, ...parts));
      setDocExists(false);
      setJsonText("{}");
      setStatus("Deleted");
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("Error");
    }
  };

  const exportDocJSON = () => {
    const blob = new Blob([jsonText || "{}"], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${parts.join("_")}.json`;
    a.click();
  };

  const importDocJSON = async (file) => {
    const text = await file.text();
    // just load into editor; user saves explicitly
    setJsonText(text);
  };

  /** ------- Collection actions ------- */
  const listCollection = async () => {
    try {
      setStatus("Listing…");
      setError("");
      const cRef = collection(db, ...parts);
      const qs = await getDocs(cRef);
      const out = [];
      qs.forEach((d) => out.push({ _id: d.id, ...(d.data() || {}) }));
      setRows(out);
      setSelectedIds(new Set());
      setStatus(`Loaded ${out.length} docs`);
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("Error");
    }
  };

  const addRow = () => {
    const id = `doc_${Math.random().toString(36).slice(2, 8)}`;
    setRows((r) => [{ _id: id }, ...r]);
  };

  const toggleRow = (id) => {
    setSelectedIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const quickEdit = (id, key, value) => {
    setRows((r) => r.map((row) => (row._id === id ? { ...row, [key]: value } : row)));
  };

  const batchSave = async () => {
    try {
      setStatus("Batch saving…");
      setError("");
      const b = writeBatch(db);
      const cRef = collection(db, ...parts);
      rows.forEach((row) => {
        const { _id, ...rest } = row || {};
        // auto-id if empty
        const docRef = _id ? doc(cRef, _id) : doc(cRef);
        b.set(docRef, rest, { merge: true });
      });
      await b.commit();
      setStatus("Batch saved");
      await listCollection();
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("Error");
    }
  };

  const deleteSelected = async () => {
    try {
      setStatus("Deleting selected…");
      setError("");
      const b = writeBatch(db);
      const cRef = collection(db, ...parts);
      rows.forEach((row) => {
        if (selectedIds.has(row._id)) {
          b.delete(doc(cRef, row._id));
        }
      });
      await b.commit();
      setStatus("Deleted selected");
      await listCollection();
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("Error");
    }
  };

  const exportCollectionJSON = () => {
    const blob = new Blob([jsonPretty(rows)], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${parts.join("_")}.json`;
    a.click();
  };

  const exportCollectionCSV = () => {
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${parts.join("_")}.csv`;
    a.click();
  };

  const importCollectionJSON = async (file) => {
    const text = await file.text();
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      // [{_id?, ...}]
      setRows(data.map((d, i) => ({ _id: d._id || `row_${i}`, ...d })));
    } else if (isObject(data)) {
      // {id: {...}}
      const arr = Object.entries(data).map(([id, v]) => ({ _id: id, ...(v || {}) }));
      setRows(arr);
    } else {
      throw new Error("JSON must be an array of docs or an object keyed by id.");
    }
  };

  const importCollectionCSV = async (file) => {
    const text = await file.text();
    const arr = fromCSV(text);
    setRows(arr.map((r, i) => ({ _id: r._id || `row_${i}`, ...r })));
  };

  /** Columns for grid (union of keys across rows) */
  const gridColumns = useMemo(() => {
    const set = new Set(["_id"]);
    rows.forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [rows]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Admin · Firestore Data Manager</h1>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setRawPath(p.value)}
            className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
            title={p.value}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Path + Help */}
      <div className="flex items-center gap-2 mb-2">
        <input
          value={rawPath}
          onChange={(e) => setRawPath(e.target.value)}
          className="flex-1 border rounded px-3 py-2 font-mono text-sm"
          placeholder="collection/abc or collection/abc/doc/xyz …"
        />
        <button
          className="px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
          onClick={() =>
            alert(
              "Rule of thumb:\n- Collections have an ODD number of path parts and can be listed.\n- Documents have an EVEN number of parts and can be read/edited.\n\nExamples\n  metadata (collection)\n  metadata/reading_catalog (document)\n  leadership_plan/<uid>/profile (collection)\n  leadership_plan/<uid>/profile/roadmap (document)"
            )
          }
        >
          Path Help
        </button>
      </div>

      <div className="text-xs text-gray-600 mb-3">
        Resolved path: <code className="font-mono">{resolvedPath}</code> · Path type:{" "}
        <span className="font-semibold">{pathType}</span>{" "}
        {auth.currentUser && (
          <span className="ml-2">
            (UID: <span className="font-mono">{auth.currentUser.uid}</span>)
          </span>
        )}
      </div>

      {/* Actions */}
      {pathType === "document" ? (
        <div className="flex flex-wrap gap-2 mb-2">
          <button onClick={readDoc} className="px-3 py-2 rounded bg-gray-900 text-white">
            Read Doc
          </button>
          <button onClick={listenDoc} className="px-3 py-2 rounded bg-indigo-600 text-white">
            Listen (live)
          </button>
          <button onClick={saveMerge} className="px-3 py-2 rounded bg-blue-600 text-white">
            Save (Merge)
          </button>
          <button onClick={replaceSet} className="px-3 py-2 rounded bg-purple-600 text-white">
            Replace (Set)
          </button>
          <button onClick={removeDoc} className="px-3 py-2 rounded bg-red-600 text-white">
            Delete Doc
          </button>
          <button onClick={exportDocJSON} className="px-3 py-2 rounded bg-gray-100">
            Export JSON
          </button>
          <label className="px-3 py-2 rounded bg-gray-100 cursor-pointer">
            Import JSON
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importDocJSON(e.target.files[0])}
            />
          </label>
          <DocBadge exists={docExists} />
        </div>
      ) : pathType === "collection" ? (
        <div className="flex flex-wrap gap-2 mb-2">
          <button onClick={listCollection} className="px-3 py-2 rounded bg-gray-900 text-white">
            List Collection
          </button>
          <button onClick={addRow} className="px-3 py-2 rounded bg-blue-600 text-white">
            + Add Row
          </button>
          <button onClick={batchSave} className="px-3 py-2 rounded bg-green-600 text-white">
            Batch Save
          </button>
          <button onClick={deleteSelected} className="px-3 py-2 rounded bg-red-600 text-white">
            Delete Selected
          </button>
          <label className="px-3 py-2 rounded bg-gray-100 cursor-pointer">
            Import JSON
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importCollectionJSON(e.target.files[0])}
            />
          </label>
          <label className="px-3 py-2 rounded bg-gray-100 cursor-pointer">
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importCollectionCSV(e.target.files[0])}
            />
          </label>
          <button onClick={exportCollectionJSON} className="px-3 py-2 rounded bg-gray-100">
            Export JSON
          </button>
          <button onClick={exportCollectionCSV} className="px-3 py-2 rounded bg-gray-100">
            Export CSV
          </button>
        </div>
      ) : null}

      {/* Status + Error */}
      <div className="mb-2">
        <div className="text-sm">
          <span className="font-medium">Status:</span> {status}
        </div>
        {error && (
          <div className="mt-2 text-sm bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded">
            Error: {error}
          </div>
        )}
      </div>

      {/* Editor / Grid */}
      {pathType === "document" ? (
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="w-full h-[360px] border rounded p-3 font-mono text-sm"
        />
      ) : pathType === "collection" ? (
        <div className="w-full border rounded overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">#</th>
                {gridColumns.map((c) => (
                  <th key={c} className="p-2 text-left">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={gridColumns.length + 1}>
                    No documents loaded. Click <b>List Collection</b> or <b>Add Row</b>.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => (
                  <tr key={r._id || idx} className={idx % 2 ? "bg-white" : "bg-gray-50/40"}>
                    <td className="p-2 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r._id)}
                        onChange={() => toggleRow(r._id)}
                      />
                    </td>
                    {gridColumns.map((k) => (
                      <td key={k} className="p-1 align-top min-w-[160px]">
                        <input
                          className="w-full border rounded px-2 py-1 font-mono"
                          value={r[k] ?? ""}
                          onChange={(e) => quickEdit(r._id, k, e.target.value)}
                          placeholder={k}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="text-xs text-gray-500 p-2">
            Editing notes: values auto-coerce to strings in the grid (for speed). For objects/arrays,
            paste JSON strings; Batch Save will store them as strings unless you convert them to real
            JSON in a doc view.
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600">Enter a path to begin.</div>
      )}
    </div>
  );
}
