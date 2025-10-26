// src/components/screens/AdminDataMaintenance.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';

// ---- helpers ---------------------------------------------------------------
const pathInfo = (p) => {
  const parts = (p || '').split('/').filter(Boolean);
  const isDoc = parts.length % 2 === 0;
  return {
    parts,
    segments: parts.length,
    kind: isDoc ? 'document' : 'collection',
    tip: isDoc
      ? 'Looks like a document path. Use "Read Doc" or "Listen Doc". To list the parent collection, remove the last segment.'
      : 'Looks like a collection path. You can list documents here.',
  };
};

function jsonToRows(input, base = '') {
  const rows = [];
  const push = (path, value) => {
    const type =
      value === null ? 'null' :
      Array.isArray(value) ? 'array' :
      typeof value;
    const preview =
      type === 'object' || type === 'array'
        ? JSON.stringify(value).slice(0, 200)
        : String(value);
    rows.push({ path, type, preview });
  };

  const walk = (val, cur) => {
    if (Array.isArray(val)) {
      if (val.length === 0) push(cur || '(root)', val);
      val.forEach((v, i) => walk(v, cur ? `${cur}[${i}]` : `[${i}]`));
    } else if (val && typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length === 0) push(cur || '(root)', val);
      keys.forEach((k) => walk(val[k], cur ? `${cur}.${k}` : k));
    } else {
      push(cur || '(root)', val);
    }
  };

  walk(input, base);
  return rows;
}
// ---------------------------------------------------------------------------

export default function AdminDataMaintenance() {
  const auth = getAuth();
  const db = getFirestore();
  const uid = auth.currentUser?.uid || '<uid>';

  const [path, setPath] = useState(`leadership_plan/${uid}/profile/roadmap`);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [rows, setRows] = useState([]);
  const [unsub, setUnsub] = useState(null);

  useEffect(() => () => unsub?.(), [unsub]);

  useEffect(() => {
    if (result && typeof result === 'object') setRows(jsonToRows(result));
    else setRows([]);
  }, [result]);

  const presets = useMemo(
    () => [
      { label: 'metadata/config (doc)', value: 'metadata/config' },
      { label: 'metadata/reading_catalog (doc)', value: 'metadata/reading_catalog' },
      { label: 'leadership_plan/<uid>/profile/roadmap (doc)', value: `leadership_plan/${uid}/profile/roadmap` },
      { label: 'user_commitments/<uid>/profile/active (doc)', value: `user_commitments/${uid}/profile/active` },
      { label: 'user_planning/<uid>/profile/drafts (doc)', value: `user_planning/${uid}/profile/drafts` },
      { label: 'metadata (collection)', value: 'metadata' },
    ],
    [uid]
  );

  const info = pathInfo(path);
  const segments = path.split('/').filter(Boolean);

  const readDoc = async () => {
    if (info.kind !== 'document') {
      setStatus('The current path is a collection. Use "List Collection" or switch to a document path.');
      setResult(null);
      return;
    }
    setStatus('Reading…');
    const snap = await getDoc(doc(db, ...segments));
    setStatus(`Path: ${path} · Exists: ${snap.exists()} · Read: ${new Date().toISOString()}`);
    setResult(snap.exists() ? snap.data() : null);
  };

  const listenDoc = () => {
    if (info.kind !== 'document') {
      setStatus('The current path is a collection. Use "List Collection" or switch to a document path.');
      setResult(null);
      return;
    }
    unsub?.();
    const u = onSnapshot(doc(db, ...segments), (s) => {
      console.log('[ADMIN LIVE]', path, s.exists(), s.data());
      setStatus(`LIVE: ${path} · Exists: ${s.exists()} · @ ${new Date().toISOString()}`);
      setResult(s.exists() ? s.data() : null);
    });
    setUnsub(() => u);
  };

  const listCollection = async () => {
    if (info.kind !== 'collection') {
      setStatus('The current path looks like a document. Remove the last segment to list the collection.');
      setResult(null);
      return;
    }
    setStatus('Listing…');
    const snap = await getDocs(collection(db, ...segments));
    const out = {};
    snap.forEach((d) => (out[d.id] = d.data()));
    setStatus(`Collection: ${path} · Count: ${snap.size} · Read: ${new Date().toISOString()}`);
    setResult(out);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin · Raw Firestore Viewer</h1>
      <div className="text-sm text-gray-500">UID: <code>{uid}</code></div>

      <div className="flex flex-wrap gap-2 mt-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setPath(p.value)}
            className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
            title={p.value}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600">Firestore Path</label>
        <input
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className="w-full border rounded px-3 py-2 font-mono text-sm"
          placeholder="collection/doc/collection/doc"
        />
        <div className="text-xs text-gray-500">
          {info.tip} ({info.kind}; segments: {info.segments})
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-gray-900 text-white text-sm" onClick={readDoc}>
            Read Doc
          </button>
          <button className="px-3 py-2 rounded bg-indigo-600 text-white text-sm" onClick={listenDoc}>
            Listen Doc (live)
          </button>
          <button className="px-3 py-2 rounded bg-gray-200 text-gray-900 text-sm" onClick={listCollection}>
            List Collection
          </button>
        </div>

        <div className="text-xs text-gray-500">Status: {status || '—'}</div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium mb-1">Document Result</div>
        <div className="text-xs text-gray-500 mb-2">
          {result ? 'Table view (flattened) and raw JSON below.' : '(No document loaded yet)'}
        </div>

        {result ? (
          <>
            <div className="overflow-auto rounded border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium border-b w-1/2">Path</th>
                    <th className="text-left px-3 py-2 font-medium border-b">Type</th>
                    <th className="text-left px-3 py-2 font-medium border-b">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="odd:bg-white even:bg-gray-50">
                      <td className="px-3 py-2 font-mono">{r.path}</td>
                      <td className="px-3 py-2">{r.type}</td>
                      <td className="px-3 py-2 font-mono">{r.preview}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <pre className="mt-4 p-3 bg-gray-50 rounded border text-xs overflow-auto">
{JSON.stringify(result, null, 2)}
            </pre>
          </>
        ) : (
          <div className="text-sm text-gray-500">Enter a path and click one of the actions above.</div>
        )}
      </div>
    </div>
  );
}
