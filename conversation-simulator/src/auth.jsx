import { useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { LogOut, LogIn, Loader2, ShieldAlert } from 'lucide-react';
import { auth, functions, isFirebaseConfigured } from './lib/firebase.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!auth) { setReady(true); return; }
    return onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); });
  }, []);
  return { user, ready };
}

export async function signIn() {
  if (!auth) throw new Error('Firebase Auth not configured');
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}

export async function signOutUser() {
  if (auth) await signOut(auth);
}

/**
 * Calls the `mintSimulatorToken` Cloud Function. Throws if not admin.
 * Returns { token, expiresAt, sessionStartBy }.
 */
export async function mintSimulatorToken() {
  if (!functions) throw new Error('Firebase Functions not configured');
  const fn = httpsCallable(functions, 'mintSimulatorToken');
  const res = await fn();
  return res.data;
}

export function AuthGate({ children }) {
  const { user, ready } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);

  if (!isFirebaseConfigured) {
    // Local-dev fallback: skip auth, run with VITE_GEMINI_API_KEY only.
    return children({ user: null, mode: 'local' });
  }

  if (!ready) {
    return (
      <FullScreenStatus icon={Loader2} spin>
        Loading…
      </FullScreenStatus>
    );
  }

  if (!user) {
    return (
      <FullScreenStatus icon={LogIn}>
        <div className="space-y-4 max-w-sm">
          <p className="text-sm text-slate-300">
            Conversation Simulator is admin-only. Sign in with your LeaderReps
            Google account to continue.
          </p>
          {error && (
            <div className="text-xs text-red-300 bg-red-900/30 rounded p-2">
              {error}
            </div>
          )}
          <button
            disabled={signingIn}
            onClick={async () => {
              setError(null);
              setSigningIn(true);
              try { await signIn(); } catch (e) { setError(e.message); }
              finally { setSigningIn(false); }
            }}
            className="w-full bg-corporate-teal hover:bg-emerald-600 disabled:bg-slate-600 text-white font-semibold rounded-xl px-6 py-3 inline-flex items-center justify-center gap-2"
          >
            {signingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Sign in with Google
          </button>
        </div>
      </FullScreenStatus>
    );
  }

  return children({ user, mode: 'auth' });
}

function FullScreenStatus({ icon: Icon, spin, children }) {
  return (
    <div className="min-h-screen bg-corporate-navy text-white flex items-center justify-center px-6">
      <div className="text-center space-y-4">
        {Icon && <Icon className={`w-10 h-10 mx-auto text-corporate-teal ${spin ? 'animate-spin' : ''}`} />}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function SignedInBar({ user }) {
  if (!user) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-white/70">
      <span>{user.email}</span>
      <button
        onClick={() => signOutUser()}
        className="inline-flex items-center gap-1 hover:text-white"
        title="Sign out"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function AccessDenied({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-2">
      <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>
        <div className="font-semibold">Admin access required</div>
        <div className="text-xs mt-1">{message}</div>
      </div>
    </div>
  );
}
