import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  addDoc,
  deleteDoc,
  writeBatch,
  query,
  limit as qLimit,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

/** ---------- tiny helpers ---------- */

const pretty = (obj) => JSON.stringify(obj ?? {}, null, 2);
const tryParse = (txt, fallback = {}) => {
  try { return JSON.parse(txt); } catch { return fallback; }
};

const pathKind = (path) => {
  const count = path.trim().split("/").filter(Boolean).length;
  if (!count) return "invalid";
  return count % 2 === 0 ? "document" : "collection";
};

const explainPath = (path) => {
  const kind = pathKind(path);
  if (kind === "document") {
    return "Path type: document — You can read, listen, edit, replace or delete.";
  }
  if (kind === "collection") {
    return "Path type: collection — You can list, add, import documents here.";
  }
  return "Enter a Firestore path.";
};

const flatten = (obj, prefix = "", out = {}) => {
  Object.entries(obj || {}).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out[key] = Array.isArray(v) || typeof v === "object" ? JSON.stringify(v) : v;
    }
  });
  return out;
};

const unflattenOneLevel = (obj) => {
  // Converts dot.notation back one level deep (simple & good enough for admin)
  const out = {};
  Object.entries(obj).forEach(([k, v]) => {
    const parts = k.split(".");
    if (parts.length === 1) {
      out[k] = v;
    } else {
      const [head, ...rest] = parts;
      out[head] = out[head] || {};
      // shove the rest back as a nested object literal
      let cursor = out[head];
      while (rest.length > 1) {
        const p = rest.shift();
        cursor[p] = cursor[p] || {};
        cursor = cursor[p];
      }
      cursor[rest[0]] = v;
    }
  });
  return out;
};

const inferColumns = (rows) => {
  const keys = new Set(["_id"]);
  rows.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
  return Array.from(keys);
};

const nowIso = () => new Date().toISOString();

/** CSV helpers (simple: header + comma separated; quotes preserved if present) */
const toCSV = (rows) => {
  if (!rows.length) return "";
  const cols = inferColumns(rows);
  const esc = (v) => {
    const s = v === undefined || v === null ? "" : String(v);
    // naive CSV escaping
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(",");
  const body = rows
    .map((r) => cols.map((c) => esc(r[c])).join(","))
    .join("\n");
  return `${header}\n${body}`;
};

const fromCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",");
  const parseCell = (cell) => {
    const unq = cell.replace(/^"(.*)"$/, (_, p1) => p1.replace(/""/g, '"'));
    // try simple JSON-ish parse
    try { return JSON.parse(unq); } catch { return unq; }
  };
  return lines.slice(1).map((line) => {
    const parts = line.match(/("([^"]|"")*"|[^,]+)/g) || [];
    const row = {};
    headers.forEach((h, i) => (row[h] = parseCell(parts[i] ?? "")));
    return row;
  });
};

/** ---------- Component ---------- */

export default function AdminDataMaintenance() {
  const db = getFirestore();
  const auth = getAuth();
  const uid = auth.currentUser?.uid || "<uid>";
  const [path, setPath] = useState(`metadata/reading_catalog`);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [docJson, setDocJson] = useState("{}");
  const [docExists, setDocExists] = useState(false);
  const [liveUnsub, setLiveUnsub] = useState(null);

  // collection state
  const [rows, setRows] = useState([]);              // flattened rows
  const [selectedIds, setSelectedIds] = useState({});
  const [pending, setPending] = useState(false);

  // document array editor
  const docObj = useMemo(() => tryParse(docJson, {}), [docJson]);
  const arrayFields = useMemo(
    () => Object.entries(docObj)
      .filter(([, v]) => Array.isArray(v) && v.every((x) => typeof x === "object"))
      .map(([k]) => k),
    [docObj]
  );
  const [arrayField, setArrayField] = useState("");
  const arrayRows = useMemo(() => {
    const arr = Array.isArray(docObj?.[arrayField]) ? docObj[arrayField] : [];
    return arr.map((o, i) => ({ _id: String(i), ...flatten(o) }));
  }, [docObj, arrayField]);

  useEffect(() => {
    if (!arrayField && arrayFields.length) setArrayField(arrayFields[0]);
  }, [arrayFields, arrayField]);

  const kind = pathKind(path);

  /** ------- Document actions ------- */

  const readDoc = async () => {
    setStatus("Reading…");
    setError("");
    try {
      const ref = doc(db, ...path.split("/"));
      const snap = await getDoc(ref);
      setDocExists(snap.exists());
      setDocJson(pretty(snap.exists() ? snap.data() : {}));
      setStatus("Done");
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  const listenDoc = () => {
    setStatus("Listening…");
    setError("");
    try {
      liveUnsub && liveUnsub();
      const ref = doc(db, ...path.split("/"));
      const unsub = onSnapshot(
        ref,
        (snap) => {
          setDocExists(snap.exists());
          setDocJson(pretty(snap.exists() ? snap.data() : {}));
          setStatus("Live");
        },
        (e) => {
          setStatus("Error");
          setError(String(e));
        }
      );
      setLiveUnsub(() => unsub);
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  const saveMerge = async () => {
    setStatus("Saving (merge) …");
    setError("");
    try {
      const data = tryParse(docJson, null);
      if (data === null) throw new Error("Invalid JSON.");
      const ref = doc(db, ...path.split("/"));
      await setDoc(ref, data, { merge: true });
      setStatus("Saved (merge).");
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  const replaceSet = async () => {
    setStatus("Replacing (set) …");
    setError("");
    try {
      const data = tryParse(docJson, null);
      if (data === null) throw new Error("Invalid JSON.");
      const ref = doc(db, ...path.split("/"));
      await setDoc(ref, data);
      setStatus("Replaced (set).");
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  const deleteTheDoc = async () => {
    setStatus("Deleting …");
    setError("");
    try {
      const ref = doc(db, ...path.split("/"));
      await deleteDoc(ref);
      setDocExists(false);
      setDocJson("{}");
      setStatus("Deleted.");
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  /** Save the array-field table back into the document */
  const saveArrayField = async () => {
    if (!arrayField) return;
    setStatus(`Saving array "${arrayField}" …`);
    setError("");
    try {
      // convert flattened table back to array of objects
      const toWrite = arrayRows
        .map(({ _id, ...rest }) => unflattenOneLevel(rest));
      const ref = doc(db, ...path.split("/"));
      await setDoc(ref, { [arrayField]: toWrite, _lastEdited: nowIso() }, { merge: true });
      setStatus(`Saved "${arrayField}".`);
      // refresh doc
      await readDoc();
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    }
  };

  /** ------- Collection actions ------- */

  const listCollection = async () => {
    setPending(true);
    setError("");
    setStatus("Listing …");
    setRows([]);
    setSelectedIds({});
    try {
      const ref = collection(db, ...path.split("/"));
      const q = query(ref, qLimit(200));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => {
        const flat = flatten(d.data());
        list.push({ _id: d.id, ...flat });
      });
      setRows(list);
      setStatus(`Listed ${list.length} docs.`);
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    } finally {
      setPending(false);
    }
  };

  const addRow = () => {
    const tempId = "__new__" + Math.random().toString(36).slice(2, 8);
    setRows((r) => [{ _id: tempId }, ...r]);
  };

  const updateCell = (rowId, key, value) => {
    setRows((prev) =>
      prev.map((r) => (r._id === rowId ? { ...r, [key]: value } : r))
    );
  };

  const toggleSelect = (rowId) => {
    setSelectedIds((s) => ({ ...s, [rowId]: !s[rowId] }));
  };

  const batchSave = async () => {
    setPending(true);
    setError("");
    setStatus("Batch saving …");
    try {
      const colRef = collection(db, ...path.split("/"));
      const batch = writeBatch(db);
      const createdIds = [];

      for (const r of rows) {
        const { _id, ...flatRest } = r;
        const toWrite = unflattenOneLevel(flatRest);

        if (_id.startsWith("__new__")) {
          // allocate an id first so we can use batch
          const newRef = doc(colRef);
          batch.set(newRef, toWrite, { merge: true });
          createdIds.push({ temp: _id, real: newRef.id });
        } else {
          const ref = doc(colRef, _id);
          batch.set(ref, toWrite, { merge: true });
        }
      }

      await batch.commit();
      // swap temp ids with real ones
      if (createdIds.length) {
        setRows((prev) =>
          prev.map((r) => {
            const found = createdIds.find((x) => x.temp === r._id);
            return found ? { ...r, _id: found.real } : r;
          })
        );
      }
      setStatus("Batch saved.");
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    } finally {
      setPending(false);
    }
  };

  const deleteSelected = async () => {
    const ids = Object.keys(selectedIds).filter((k) => selectedIds[k]);
    if (!ids.length) return;
    setPending(true);
    setError("");
    setStatus("Deleting selected …");
    try {
      const colRef = collection(db, ...path.split("/"));
      const batch = writeBatch(db);
      ids.forEach((id) => {
        if (!id.startsWith("__new__")) {
          batch.delete(doc(colRef, id));
        }
      });
      await batch.commit();
      setRows((prev) => prev.filter((r) => !ids.includes(r._id)));
      setSelectedIds({});
      setStatus("Deleted.");
    } catch (e) {
      setStatus("Error");
      setError(String(e));
    } finally {
      setPending(false);
    }
  };

  /** ------- Import / Export ------- */

  const exportJSON = () => {
    const blob = new Blob([docJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (path.replace(/\//g, "_") || "export") + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result || "");
      if (kind === "document") setDocJson(txt);
      else {
        const arr = tryParse(txt, []);
        if (!Array.isArray(arr)) {
          setError("JSON must be an array of documents for collection import.");
          return;
        }
        // normalize each row to flattened view
        setRows(
          arr.map((o) => {
            const id = o._id || "__new__" + Math.random().toString(36).slice(2, 8);
            const { _id, ...rest } = o;
            return { _id: id, ...flatten(rest) };
          })
        );
      }
    };
    reader.readAsText(file);
    evt.target.value = "";
  };

  const exportCSV = () => {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (path.replace(/\//g, "_") || "export") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const txt = String(reader.result || "");
      const arr = fromCSV(txt);
      setRows(
        arr.map((r) => {
          const id = r._id || "__new__" + Math.random().toString(36).slice(2, 8);
          const { _id, ...rest } = r;
          return { _id: id, ...rest };
        })
      );
    };
    reader.readAsText(file);
    evt.target.value = "";
  };

  /** ------- UI helpers ------- */
  const presets = [
    { label: "metadata/config (doc)", value: "metadata/config" },
    { label: "metadata/reading_catalog (doc)", value: "metadata/reading_catalog" },
    { label: "leadership_plan/<uid>/profile/roadmap (doc)", value: `leadership_plan/${uid}/profile/roadmap` },
    { label: "user_commitments/<uid>/profile/active (doc)", value: `user_commitments/${uid}/profile/active` },
    { label: "user_planning/<uid>/profile/drafts (doc)", value: `user_planning/${uid}/profile/drafts` },
    { label: "metadata (collection)", value: "metadata" },
  ];

  const cols = useMemo(() => inferColumns(rows), [rows]);

  /** ------- Render ------- */
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin · Firestore Data Manager</h1>

      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map((p) => (
          <button
            key={p.value}
            className="px-2 py-1 rounded border text-sm hover:bg-gray-50"
            onClick={() => setPath(p.value)}
            title={p.value}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          placeholder="collection or document path…"
        />
        <button
          className="px-3 py-2 border rounded"
          onClick={() => alert(
            "Rule of thumb:\n• Collection path = odd number of segments (e.g., `metadata` or `users/<uid>/posts`)\n• Document path = even number of segments (e.g., `metadata/config`)\n\n" + explainPath(path)
          )}
        >
          Path Help
        </button>
      </div>
      <div className="text-sm text-gray-600 mb-3">{explainPath(path)}</div>

      {/* Action bar */}
      {kind === "document" ? (
        <div className="flex flex-wrap gap-2 mb-3">
          <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={readDoc}>Read Doc</button>
          <button className="px-3 py-2 rounded border" onClick={listenDoc}>Listen (live)</button>
          <button className="px-3 py-2 rounded border" onClick={saveMerge}>Save (Merge)</button>
          <button className="px-3 py-2 rounded border" onClick={replaceSet}>Replace (Set)</button>
          <button className="px-3 py-2 rounded border text-red-600" onClick={deleteTheDoc}>Delete Doc</button>
          <button className="px-3 py-2 rounded border" onClick={exportJSON}>Export JSON</button>
          <label className="px-3 py-2 rounded border cursor-pointer">
            Import JSON
            <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
          </label>
          <div className="ml-auto text-sm">
            Doc exists: <span className={docExists ? "text-green-700" : "text-red-700"}>{String(docExists)}</span>
          </div>
        </div>
      ) : kind === "collection" ? (
        <div className="flex flex-wrap gap-2 mb-3">
          <button className="px-3 py-2 rounded bg-gray-800 text-white" onClick={listCollection} disabled={pending}>
            List Collection
          </button>
          <button className="px-3 py-2 rounded border" onClick={addRow}>Add Row</button>
          <button className="px-3 py-2 rounded border" onClick={batchSave} disabled={!rows.length || pending}>
            Batch Save
          </button>
          <button className="px-3 py-2 rounded border text-red-600" onClick={deleteSelected} disabled={!Object.values(selectedIds).some(Boolean) || pending}>
            Delete Selected
          </button>
          <button className="px-3 py-2 rounded border" onClick={exportCSV} disabled={!rows.length}>Export CSV</button>
          <label className="px-3 py-2 rounded border cursor-pointer">
            Import JSON
            <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
          </label>
          <label className="px-3 py-2 rounded border cursor-pointer">
            Import CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={importCSV} />
          </label>
        </div>
      ) : null}

      {/* Status / Error */}
      <div className="mb-3 text-sm">
        <span className="font-medium">Status:</span>{" "}
        <span>{status}</span>
      </div>
      {error && (
        <div className="mb-3 p-3 border rounded bg-red-50 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {/* Document editor */}
      {kind === "document" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-1">Document JSON</div>
            <textarea
              className="w-full min-h-[420px] font-mono border rounded p-3"
              spellCheck={false}
              value={docJson}
              onChange={(e) => setDocJson(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Array Field Table Editor</div>
              <div className="flex items-center gap-2">
                <select
                  className="border rounded px-2 py-1"
                  value={arrayField}
                  onChange={(e) => setArrayField(e.target.value)}
                >
                  {arrayFields.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <button className="px-3 py-1.5 rounded border" onClick={saveArrayField} disabled={!arrayField}>
                  Save {arrayField || "array"}
                </button>
              </div>
            </div>

            {!arrayField ? (
              <div className="text-sm text-gray-600">
                No array-of-objects fields detected. When your document contains arrays like
                <code className="mx-1">"Strategy &amp; Execution": [ &#123;…&#125; ]</code>,
                they’ll show here for row-by-row editing.
              </div>
            ) : (
              <div className="overflow-auto border rounded">
                <DocArrayTable
                  rows={arrayRows}
                  onChange={(next) => {
                    // reflect changes back into docJson for accuracy
                    const arr = next.map(({ _id, ...rest }) => unflattenOneLevel(rest));
                    const updated = { ...docObj, [arrayField]: arr };
                    setDocJson(pretty(updated));
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collection table */}
      {kind === "collection" && (
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 border-b w-10"></th>
                {cols.map((c) => (
                  <th key={c} className="p-2 border-b text-left">{c}</th>
                ))}
                <th className="p-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!rows.length ? (
                <tr>
                  <td colSpan={cols.length + 2} className="p-6 text-center text-gray-500">
                    No documents loaded. Click <span className="font-medium">List Collection</span> or <span className="font-medium">Add Row</span>.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 border-b align-top">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[r._id]}
                        onChange={() => toggleSelect(r._id)}
                      />
                    </td>
                    {cols.map((c) => (
                      <td key={c} className="p-1.5 border-b align-top">
                        {c === "_id" ? (
                          <div className="px-2 py-1 rounded bg-gray-100 font-mono">{r._id}</div>
                        ) : (
                          <input
                            className="w-full border rounded px-2 py-1 font-mono"
                            value={r[c] ?? ""}
                            onChange={(e) => updateCell(r._id, c, e.target.value)}
                            placeholder=""
                          />
                        )}
                      </td>
                    ))}
                    <td className="p-2 border-b">
                      {r._id.startsWith("__new__") ? (
                        <span className="text-xs text-gray-500">new</span>
                      ) : (
                        <button
                          className="text-xs text-red-600 underline"
                          onClick={async () => {
                            try {
                              const colRef = collection(db, ...path.split("/"));
                              await deleteDoc(doc(colRef, r._id));
                              setRows((prev) => prev.filter((x) => x._id !== r._id));
                            } catch (e) {
                              setError(String(e));
                            }
                          }}
                        >
                          delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Row editor for array field inside a single document */
function DocArrayTable({ rows, onChange }) {
  const [local, setLocal] = useState(rows);

  useEffect(() => setLocal(rows), [rows]);

  const cols = useMemo(() => inferColumns(local), [local]);

  const edit = (rowId, key, value) => {
    const next = local.map((r) => (r._id === rowId ? { ...r, [key]: value } : r));
    setLocal(next);
    onChange(next);
  };

  const add = () => {
    const next = [{ _id: String(Date.now()), /* empty row */ }, ...local];
    setLocal(next);
    onChange(next);
  };

  const remove = (rowId) => {
    const next = local.filter((r) => r._id !== rowId);
    setLocal(next);
    onChange(next);
  };

  return (
    <div className="overflow-auto">
      <div className="p-2">
        <button className="px-2 py-1 rounded border" onClick={add}>Add Row</button>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {cols.map((c) => (
              <th key={c} className="p-2 border-b text-left">{c}</th>
            ))}
            <th className="p-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {!local.length ? (
            <tr>
              <td colSpan={cols.length + 1} className="p-6 text-center text-gray-500">
                No rows. Click <span className="font-medium">Add Row</span>.
              </td>
            </tr>
          ) : (
            local.map((r) => (
              <tr key={r._id} className="odd:bg-white even:bg-gray-50">
                {cols.map((c) => (
                  <td key={c} className="p-1.5 border-b align-top">
                    {c === "_id" ? (
                      <div className="px-2 py-1 rounded bg-gray-100 font-mono">{r._id}</div>
                    ) : (
                      <input
                        className="w-full border rounded px-2 py-1 font-mono"
                        value={r[c] ?? ""}
                        onChange={(e) => edit(r._id, c, e.target.value)}
                      />
                    )}
                  </td>
                ))}
                <td className="p-2 border-b">
                  <button className="text-xs text-red-600 underline" onClick={() => remove(r._id)}>
                    delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
