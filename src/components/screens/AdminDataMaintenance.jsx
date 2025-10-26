/* eslint-disable no-undef */
import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Firestore Data Manager
 * - Works with either document paths (even # segments) or collection paths (odd # segments)
 * - No dependency on local hooks; uses Firebase globals already on window (fbReady, getFirestore, etc.)
 * - Safe on Netlify build because we avoid importing app-specific modules
 *
 * Tip: Presets include <uid>; we’ll expand it to the current user id if available.
 */

const presets = [
  { label: "metadata/config (doc)", value: "metadata/config" },
  { label: "metadata/reading_catalog (doc)", value: "metadata/reading_catalog" },
  { label: "leadership_plan/<uid>/profile/roadmap (doc)", value: "leadership_plan/<uid>/profile/roadmap" },
  { label: "user_commitments/<uid>/profile/active (doc)", value: "user_commitments/<uid>/profile/active" },
  { label: "user_planning/<uid>/profile/drafts (doc)", value: "user_planning/<uid>/profile/drafts" },
  { label: "metadata (collection)", value: "metadata" },
];

const trimSlashes = (s) => s.replace(/^\s+|\s+$/g, "").replace(/^\/+|\/+$/g, "");
const segs = (p) => trimSlashes(p).split("/").filter(Boolean);
const pathKind = (p) => {
  const n = segs(p).length;
  if (n === 0) return "invalid";
  return n % 2 === 0 ? "document" : "collection";
};
const nowIso = () => new Date().toISOString();

/** CSV helpers (simple but robust enough for admin use) */
const csvEscape = (v) => {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const rowsToCSV = (rows) => {
  const keys = Array.from(
    rows.reduce((acc, r) => {
      Object.keys(r).forEach((k) => acc.add(k));
      return acc;
    }, new Set(["_id"]))
  );
  const head = keys.join(",");
  const body = rows.map((r) => keys.map((k) => csvEscape(r[k])).join(",")).join("\n");
  return `${head}\n${body}`;
};
// Minimal CSV parser (supports quoted cells and commas in quotes)
const csvToRows = (text) => {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const parseLine = (line) => {
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQ = false;
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') inQ = true;
        else if (ch === ",") {
          out.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
    }
    out.push(cur);
    return out;
  };
  const header = parseLine(lines[0]);
  return lines.slice(1).map((ln) => {
    const cols = parseLine(ln);
    const row = {};
    header.forEach((h, i) => {
      const raw = cols[i] ?? "";
      // Try to parse numbers/booleans/JSON
      let v = raw;
      if (raw === "true") v = true;
      else if (raw === "false") v = false;
      else if (raw === "") v = "";
      else if (/^-?\d+(\.\d+)?$/.test(raw)) v = Number(raw);
      else if ((raw.startsWith("{") && raw.endsWith("}")) || (raw.startsWith("[") && raw.endsWith("]"))) {
        try { v = JSON.parse(raw); } catch {}
      }
      row[h] = v;
    });
    return row;
  });
};

export default function AdminDataMaintenance() {
  const [path, setPath] = useState("metadata/reading_catalog");
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [live, setLive] = useState(null);
  const unsubRef = useRef(null);

  // Document state
  const [docExists, setDocExists] = useState(false);
  const [docJson, setDocJson] = useState({});

  // Collection state
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());

  const expandedPath = useMemo(() => {
    const uid = window?.getAuth?.().currentUser?.uid ?? "<uid>";
    return trimSlashes(path.replaceAll("<uid>", uid));
  }, [path]);

  const kind = useMemo(() => pathKind(expandedPath), [expandedPath]);

  const useFb = () => {
    const fb = {
      getFirestore: window.getFirestore,
      doc: window.doc,
      getDoc: window.getDoc,
      setDoc: window.setDoc,
      deleteDoc: window.deleteDoc,
      updateDoc: window.updateDoc,
      collection: window.collection,
      getDocs: window.getDocs,
      addDoc: window.addDoc,
      writeBatch: window.writeBatch,
      onSnapshot: window.onSnapshot,
      fbReady: window.fbReady,
    };
    Object.entries(fb).forEach(([k, v]) => {
      if (typeof v !== "function") {
        throw new Error(`Missing Firebase global: ${k}`);
      }
    });
    return fb;
  };

  useEffect(() => {
    // Stop any active listener when path changes
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
      setLive(null);
    }
    setError("");
    setStatus("Idle");
    setInfo("");
    setDocExists(false);
    setDocJson({});
    setRows([]);
    setSelected(new Set());
  }, [expandedPath]);

  const readDoc = async () => {
    try {
      setStatus("Loading…");
      setError("");
      const { fbReady, getFirestore, doc, getDoc } = useFb();
      await fbReady?.();
      const db = getFirestore();
      const ref = doc(db, ...segs(expandedPath));
      const snap = await getDoc(ref);
      setDocExists(snap.exists());
      setDocJson(snap.exists() ? snap.data() : {});
      setStatus("Loaded");
      setInfo(`Read: ${nowIso()}`);
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  const listenDoc = async () => {
    try {
      setStatus("Listening…");
      setError("");
      const { fbReady, getFirestore, doc, onSnapshot } = useFb();
      await fbReady?.();
      const db = getFirestore();
      const ref = doc(db, ...segs(expandedPath));
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = onSnapshot(ref, (snap) => {
        setDocExists(snap.exists());
        setDocJson(snap.exists() ? snap.data() : {});
        setLive({ readTime: nowIso() });
      });
      setInfo("Live listener attached. It will update automatically.");
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  const saveDoc = async (merge = true) => {
    try {
      setStatus("Saving…");
      setError("");
      const { fbReady, getFirestore, doc, setDoc } = useFb();
      await fbReady?.();
      const db = getFirestore();
      const ref = doc(db, ...segs(expandedPath));
      await setDoc(ref, docJson, { merge });
      setStatus("Saved");
      setInfo(`Saved (${merge ? "merge" : "replace"}) at ${nowIso()}`);
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  const deleteDocAtPath = async () => {
    try {
      if (!confirm("Delete this document permanently?")) return;
      setStatus("Deleting…");
      setError("");
      const { fbReady, getFirestore, doc, deleteDoc } = useFb();
      await fbReady?.();
      const db = getFirestore();
      const ref = doc(db, ...segs(expandedPath));
      await deleteDoc(ref);
      setDocExists(false);
      setDocJson({});
      setStatus("Deleted");
      setInfo(`Deleted at ${nowIso()}`);
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  const listCollection = async () => {
    try {
      setStatus("Loading…");
      setError("");
      const { fbReady, getFirestore, collection, getDocs } = useFb();
      await fbReady?.();
      const db = getFirestore();
      const cref = collection(db, expandedPath);
      const snap = await getDocs(cref);
      const out = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
      setRows(out);
      setStatus("Loaded");
      setInfo(`Documents: ${out.length}`);
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  const addRow = () => {
    setRows((r) => [{ _id: "", _new: true }, ...r]);
  };

  const toggleSel = (id, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const setCell = (index, key, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const batchSave = async () => {
    try {
      setStatus("Saving…");
      setError("");
      const { fbReady, getFirestore, doc, setDoc, addDoc, collection } = useFb();
      await fbReady?.();
      const db = getFirestore();

      const saved = [];
      for (const row of rows) {
        const { _id, _deleted, _new, ...rest } = row;

        if (_deleted) continue; // skip

        // Coerce primitives from string literals where possible for convenience:
        const clean = JSON.parse(JSON.stringify(rest));

        if (!_id) {
          // create new doc with auto id
          const cref = collection(db, expandedPath);
          const res = await addDoc(cref, clean);
          saved.push(res.id);
        } else {
          const dref = doc(db, ...segs(`${expandedPath}/${_id}`));
          await setDoc(dref, clean, { merge: true });
          saved.push(_id);
        }
      }
      setStatus("Saved");
      setInfo(`Saved ${saved.length} document(s) at ${nowIso()}`);
      await listCollection();
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  const deleteSelected = async () => {
    try {
      if (selected.size === 0) return;
      if (!confirm(`Delete ${selected.size} selected document(s)?`)) return;
      setStatus("Deleting…");
      setError("");
      const { fbReady, getFirestore, doc, deleteDoc } = useFb();
      await fbReady?.();
      const db = getFirestore();
      for (const id of selected) {
        const dref = doc(db, ...segs(`${expandedPath}/${id}`));
        await deleteDoc(dref);
      }
      setSelected(new Set());
      await listCollection();
      setStatus("Deleted");
      setInfo(`Deleted ${selected.size} document(s)`);
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  const exportJSON = () => {
    const blob = new Blob(
      [JSON.stringify(kind === "document" ? docJson : rows, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (kind === "document" ? "document" : "collection") + ".json";
    a.click();
  };

  const exportCSV = () => {
    if (kind !== "collection") return;
    const blob = new Blob([rowsToCSV(rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "collection.csv";
    a.click();
  };

  const importJSON = async (file) => {
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (kind === "document") {
        setDocJson(data);
        setInfo("JSON loaded into editor; click Save to write to Firestore.");
      } else {
        if (Array.isArray(data)) {
          setRows(data.map((r) => (r._id ? r : { _id: "", ...r })));
        } else if (data && typeof data === "object") {
          const arr = Object.entries(data).map(([id, v]) => ({ _id: id, ...v }));
          setRows(arr);
        } else {
          throw new Error("JSON must be an object or array for collections.");
        }
        setInfo("Rows loaded; click Batch Save to write to Firestore.");
      }
    } catch (e) {
      setError("Invalid JSON: " + e.message);
      setStatus("Error");
    }
  };

  const importCSV = async (file) => {
    const text = await file.text();
    try {
      const arr = csvToRows(text);
      setRows(arr.map((r) => (r._id ? r : { _id: "", ...r })));
      setInfo("CSV loaded; click Batch Save to write to Firestore.");
    } catch (e) {
      setError("Invalid CSV: " + e.message);
      setStatus("Error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Admin · Firestore Data Manager</h1>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setPath(p.value)}
            className="px-2 py-1 text-sm rounded border hover:bg-gray-50"
            title={p.value}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Path input */}
      <div className="flex items-center gap-2 mb-2">
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className="flex-1 font-mono px-3 py-2 rounded border"
          placeholder="collection[/doc[/subcollection...]]"
        />
        <button
          className="px-3 py-2 rounded border"
          onClick={() =>
            alert(
              "Path rules:\n- A DOCUMENT path has an EVEN number of segments, e.g. `metadata/config`.\n- A COLLECTION path has an ODD number of segments, e.g. `metadata` or `users/uid/profile`.\n\nExamples:\n• metadata/config  → document\n• metadata         → collection\n• leadership_plan/<uid>/profile/roadmap → document\n"
            )
          }
        >
          Path Help
        </button>
      </div>

      {/* Path meta */}
      <div className="text-sm mb-3">
        <div>
          <span className="font-semibold">Expanded:</span>{" "}
          <span className="font-mono">{expandedPath || "(empty)"}</span>
        </div>
        <div>
          <span className="font-semibold">Path type:</span>{" "}
          {kind === "document" && (
            <span className="text-blue-700">document — You can read, live-listen, edit, replace or delete.</span>
          )}
          {kind === "collection" && (
            <span className="text-green-700">collection — You can list, add, import/export documents.</span>
          )}
          {kind === "invalid" && <span className="text-red-700">invalid — enter a Firestore path.</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {kind === "document" ? (
          <>
            <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={readDoc}>
              Read Doc
            </button>
            <button className="px-3 py-2 rounded bg-gray-700 text-white" onClick={listenDoc}>
              Listen (live)
            </button>
            <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => saveDoc(true)}>
              Save (Merge)
            </button>
            <button className="px-3 py-2 rounded bg-indigo-600 text-white" onClick={() => saveDoc(false)}>
              Replace (Set)
            </button>
            <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={deleteDocAtPath}>
              Delete Doc
            </button>
            <button className="px-3 py-2 rounded border" onClick={exportJSON}>
              Export JSON
            </button>
            <label className="px-3 py-2 rounded border cursor-pointer">
              Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
            </label>
          </>
        ) : kind === "collection" ? (
          <>
            <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={listCollection}>
              List Collection
            </button>
            <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={addRow}>
              + Add Row
            </button>
            <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={batchSave}>
              Batch Save
            </button>
            <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={deleteSelected}>
              Delete Selected
            </button>
            <label className="px-3 py-2 rounded border cursor-pointer">
              Import JSON
              <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
            </label>
            <label className="px-3 py-2 rounded border cursor-pointer">
              Import CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && importCSV(e.target.files[0])} />
            </label>
            <button className="px-3 py-2 rounded border" onClick={exportJSON}>
              Export JSON
            </button>
            <button className="px-3 py-2 rounded border" onClick={exportCSV}>
              Export CSV
            </button>
          </>
        ) : null}
      </div>

      {/* Status */}
      <div className="text-sm mb-4">
        <span className="font-semibold">Status:</span> {status}
        {info && <span className="ml-2 text-gray-600">{info}</span>}
        {error && (
          <div className="mt-2 p-2 rounded bg-red-50 text-red-700 border border-red-200 font-mono text-xs whitespace-pre-wrap">
            {error}
          </div>
        )}
      </div>

      {/* Views */}
      {kind === "document" ? (
        <div>
          <div className="mb-2 text-sm">
            <span className="font-semibold">Doc exists:</span>{" "}
            <span className={docExists ? "text-green-700" : "text-red-700"}>{String(docExists)}</span>
            {live && <span className="ml-2 text-gray-600">[live @ {live.readTime}]</span>}
          </div>
          <textarea
            className="w-full min-h-[360px] font-mono text-sm p-3 border rounded"
            value={JSON.stringify(docJson, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || "{}");
                setDocJson(parsed);
                setError("");
              } catch (err) {
                setError("Invalid JSON in editor: " + err.message);
              }
            }}
          />
        </div>
      ) : kind === "collection" ? (
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 border-b w-10">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) setSelected(new Set(rows.map((r) => r._id).filter(Boolean)));
                      else setSelected(new Set());
                    }}
                    checked={rows.length > 0 && rows.every((r) => r._id && selected.has(r._id))}
                    aria-label="Select all"
                  />
                </th>
                <th className="p-2 border-b w-64">_id (blank = new)</th>
                <th className="p-2 border-b">data (JSON object)</th>
                <th className="p-2 border-b w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500">
                    No documents loaded. Click <b>List Collection</b> or <b>Add Row</b>.
                  </td>
                </tr>
              ) : (
                rows.map((r, idx) => {
                  const { _id, _new, ...rest } = r;
                  const dataOnly = rest;
                  return (
                    <tr key={_id || `new-${idx}`} className="align-top">
                      <td className="p-2 border-b text-center">
                        {_id ? (
                          <input
                            type="checkbox"
                            checked={selected.has(_id)}
                            onChange={(e) => toggleSel(_id, e.target.checked)}
                            aria-label={`Select ${_id}`}
                          />
                        ) : null}
                      </td>
                      <td className="p-2 border-b">
                        <input
                          className="w-full font-mono px-2 py-1 border rounded"
                          placeholder="(auto id if left blank)"
                          value={_id}
                          onChange={(e) => setCell(idx, "_id", e.target.value)}
                        />
                      </td>
                      <td className="p-2 border-b">
                        <textarea
                          className="w-full h-28 font-mono px-2 py-1 border rounded"
                          value={JSON.stringify(dataOnly, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value || "{}");
                              setCell(idx, "_json_valid", true);
                              const withKeys = { _id, ...parsed };
                              setRows((prev) => {
                                const next = [...prev];
                                next[idx] = withKeys;
                                return next;
                              });
                              setError("");
                            } catch (err) {
                              setCell(idx, "_json_valid", false);
                              setError(`Row ${idx + 1} has invalid JSON: ${err.message}`);
                            }
                          }}
                        />
                      </td>
                      <td className="p-2 border-b">
                        <button
                          className="px-2 py-1 text-xs rounded border mr-2"
                          onClick={async () => {
                            // quick save single row
                            const { fbReady, getFirestore, doc, setDoc, addDoc, collection } = useFb();
                            await fbReady?.();
                            const db = getFirestore();
                            const { _id, _json_valid, ...payload } = rows[idx];
                            if (!_id) {
                              const cref = collection(db, expandedPath);
                              const res = await addDoc(cref, payload);
                              setCell(idx, "_id", res.id);
                              setInfo(`Created ${res.id}`);
                            } else {
                              const dref = doc(db, ...segs(`${expandedPath}/${_id}`));
                              await setDoc(dref, payload, { merge: true });
                              setInfo(`Saved ${_id}`);
                            }
                          }}
                        >
                          Save
                        </button>
                        {_id && (
                          <button
                            className="px-2 py-1 text-xs rounded border border-red-400 text-red-700"
                            onClick={async () => {
                              if (!confirm(`Delete ${_id}?`)) return;
                              const { fbReady, getFirestore, doc, deleteDoc } = useFb();
                              await fbReady?.();
                              const db = getFirestore();
                              await deleteDoc(doc(db, ...segs(`${expandedPath}/${_id}`)));
                              setRows((prev) => prev.filter((x) => x._id !== _id));
                              setInfo(`Deleted ${_id}`);
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 rounded border bg-yellow-50 text-yellow-900">
          Enter a valid Firestore path above to begin.
        </div>
      )}
    </div>
  );
}
