// src/components/screens/AdminDataMaintenance.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  onSnapshot,
  collection,
  getDocs,
  query,
  limit,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

/** Split "a/b/c/d" into ["a","b","c","d"] without empties */
function splitPath(p) {
  return (p || "").trim().split("/").filter(Boolean);
}

/** Firestore rule of thumb: even segments => document path, odd => collection path */
function classifyPath(p) {
  const segs = splitPath(p);
  return { segs, kind: segs.length % 2 === 0 ? "doc" : "coll" };
}

function JsonBlock({ value }) {
  return (
    <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto max-h-96">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function Table({ rows }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div className="text-sm text-gray-500 border rounded p-3 bg-gray-50">
        (No documents)
      </div>
    );
  }
  const columns = Object.keys(rows[0] ?? {}).map((k) => k);
  return (
    <div className="overflow-auto border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c} className="text-left px-3 py-2 font-medium text-gray-600">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id ?? i} className={i % 2 ? "bg-gray-50/40" : ""}>
              {columns.map((c) => (
                <td key={c} className="px-3 py-2 align-top">
                  {typeof r[c] === "object" ? (
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(r[c], null, 0)}
                    </pre>
                  ) : (
                    String(r[c])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDataMaintenance() {
  const auth = useMemo(() => getAuth(), []);
  const db = useMemo(() => getFirestore(), []);
  const [uid, setUid] = useState(() => auth.currentUser?.uid || "");
  const [path, setPath] = useState(""); // user-entered path
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [docSnap, setDocSnap] = useState(null); // { exists, data, readTime }
  const [collRows, setCollRows] = useState([]); // [{id, ...data}]
  const [mode, setMode] = useState(""); // "", "doc-read", "doc-live", "coll-list"
  const liveUnsub = useRef(null);

  // Track auth changes so preset paths can use the current UID
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUid(u?.uid || ""));
    return () => off();
  }, [auth]);

  // Clean up any live listener when mode changes or unmounts
  useEffect(() => {
    return () => {
      if (liveUnsub.current) {
        liveUnsub.current();
        liveUnsub.current = null;
      }
    };
  }, []);

  function clearOutputs() {
    setDocSnap(null);
    setCollRows([]);
    setError("");
    setStatus("");
  }

  async function handleRead() {
    clearOutputs();
    const { segs, kind } = classifyPath(path);
    try {
      if (kind !== "doc") {
        setError("The current path looks like a collection. Use List or add another segment to point to a document.");
        return;
      }
      setMode("doc-read");
      setStatus("Reading document...");
      const ref = doc(db, ...segs);
      const s = await getDoc(ref);
      setDocSnap({
        exists: s.exists(),
        data: s.exists() ? s.data() : null,
        readTime: new Date().toISOString(),
        path,
      });
      setStatus("Done.");
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("");
    }
  }

  async function handleList(limitCount = 100) {
    clearOutputs();
    const { segs, kind } = classifyPath(path);
    try {
      if (kind !== "coll") {
        setError("The current path looks like a document. Remove the last segment to list the collection.");
        return;
      }
      setMode("coll-list");
      setStatus("Listing collection...");
      const collRef = collection(db, ...segs);
      const q = query(collRef, limit(limitCount));
      const snap = await getDocs(q);
      const rows = [];
      snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
      setCollRows(rows);
      setStatus(`Done. ${rows.length} documents.`);
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("");
    }
  }

  function handleListen() {
    clearOutputs();
    const { segs, kind } = classifyPath(path);
    try {
      if (kind !== "doc") {
        setError("Live listen works on a document path. Add/remove a segment so the path points to a single doc.");
        return;
      }
      setMode("doc-live");
      setStatus("Listening...");
      const ref = doc(db, ...segs);
      if (liveUnsub.current) {
        liveUnsub.current();
        liveUnsub.current = null;
      }
      liveUnsub.current = onSnapshot(
        ref,
        (s) => {
          setDocSnap({
            exists: s.exists(),
            data: s.exists() ? s.data() : null,
            readTime: new Date().toISOString(),
            path,
          });
          setStatus("Live update received.");
          // also mirror to console for your debugging flow
          // eslint-disable-next-line no-console
          console.log("[ADMIN LIVE]", path, s.exists(), s.data());
        },
        (err) => {
          setError(String(err?.message || err));
          setStatus("");
        }
      );
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("");
    }
  }

  // Helpful presets based on your logs
  const presets = useMemo(() => {
    const u = uid || "<UID>";
    return [
      { label: "metadata/config (doc)", value: "metadata/config" },
      { label: "metadata/reading_catalog (doc)", value: "metadata/reading_catalog" },
      { label: "leadership_plan/<uid>/profile/roadmap (doc)", value: `leadership_plan/${u}/profile/roadmap` },
      { label: "user_commitments/<uid>/profile/active (doc)", value: `user_commitments/${u}/profile/active` },
      { label: "user_planning/<uid>/profile/drafts (doc)", value: `user_planning/${u}/profile/drafts` },
      { label: "metadata (collection)", value: "metadata" },
      // add more collections if you want to browse
    ];
  }, [uid]);

  return (
    <div className="p-4 space-y-6" data-admin-raw>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Admin · Raw Firestore Viewer</h1>
        <div className="text-xs text-gray-600">
          UID: <span className="font-mono">{uid || "(not signed in)"}</span>
        </div>
      </header>

      <section className="space-y-2">
        <div className="text-sm text-gray-700">Presets</div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
              onClick={() => setPath(p.value)}
              title={p.value}
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <label className="block text-sm font-medium">
          Firestore Path
          <input
            className="mt-1 w-full border rounded px-3 py-2 font-mono text-sm"
            placeholder='e.g. metadata/config  or  leadership_plan/<uid>/profile/roadmap'
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
        </label>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border rounded hover:bg-gray-50" onClick={handleRead}>
            Read Doc
          </button>
          <button className="px-3 py-1.5 border rounded hover:bg-gray-50" onClick={handleListen}>
            Listen Doc (live)
          </button>
          <button className="px-3 py-1.5 border rounded hover:bg-gray-50" onClick={() => handleList(200)}>
            List Collection
          </button>

          <span className="text-xs text-gray-500 ml-2">
            {(() => {
              const { kind } = classifyPath(path);
              return path ? (kind === "doc" ? "Looks like a document path" : "Looks like a collection path") : "";
            })()}
          </span>
        </div>

        {!!status && <div className="text-xs text-blue-700">{status}</div>}
        {!!error && <div className="text-xs text-red-600">{error}</div>}
      </section>

      {/* Results */}
      {mode.startsWith("doc") && (
        <section className="space-y-2">
          <div className="text-sm font-semibold">Document Result</div>
          {!docSnap ? (
            <div className="text-sm text-gray-500">(No document loaded yet)</div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                Path: <span className="font-mono">{docSnap.path}</span> · Exists:{" "}
                <span className="font-mono">{String(docSnap.exists)}</span> · Read:{" "}
                <span className="font-mono">{docSnap.readTime}</span>
              </div>
              <JsonBlock value={docSnap.data} />
            </div>
          )}
        </section>
      )}

      {mode === "coll-list" && (
        <section className="space-y-2">
          <div className="text-sm font-semibold">Collection Result ({collRows.length} docs)</div>
          <Table rows={collRows.map((d) => ({ id: d.id, ...d }))} />
          <div className="text-sm font-semibold mt-4">Raw JSON</div>
          <JsonBlock value={collRows} />
        </section>
      )}

      <footer className="text-xs text-gray-500 pt-4 border-t">
        Tip: You can keep a live listener open on a document and, in another tab/console, write to that path to verify updates appear instantly.
      </footer>
    </div>
  );
}
