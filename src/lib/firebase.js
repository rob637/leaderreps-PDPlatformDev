import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

function requireEnv(name) {
  const v = import.meta.env[name];
  if (!v) throw new Error(`Missing ${name}. Did you set it in .env.local and Netlify env?`);
  return v;
}

const firebaseConfig = {
  apiKey: requireEnv('VITE_FIREBASE_API_KEY'),
  authDomain: requireEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Optional: offline cache (ignore errors on Safari/3rd-party cookies)
enableIndexedDbPersistence(db).catch(() => { /* no-op */ });

// Simple helper to ensure we’re authenticated (anon)
export async function ensureAnonAuth() {
  if (!auth.currentUser) await signInAnonymously(auth);
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => { if (u) { unsub(); resolve(u); } });
  });
}
4) Use it in your app (and smoke test)
In src/App.jsx:

jsx
Copy code
import { useEffect, useState } from 'react';
import { db, ensureAnonAuth } from './lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const [ok, setOk] = useState(false);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    (async () => {
      await ensureAnonAuth(); // sign in anonymously
      // write a test doc
      await addDoc(collection(db, 'tests'), { createdAt: serverTimestamp() });
      // read them back
      const snap = await getDocs(collection(db, 'tests'));
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setOk(true);
    })().catch((e) => {
      console.error(e);
      setOk(false);
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Firestore test: {ok ? '✅' : '❌'}</h1>
      <pre className="mt-4">{JSON.stringify(docs, null, 2)}</pre>
    </div>
  );
}