import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

export default function AuthScreen() {
  const [mode, setMode] = useState('signin'); // signin, signup, reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setResetSent(true);
      }
    } catch (err) {
      console.error('Auth error:', err.code, err.message);
      
      // Handle different error codes
      if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Try signing up instead.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/invalid-credential') {
        // Firebase's email enumeration protection returns this for both wrong password and user not found
        if (mode === 'signin') {
          setError('Invalid email or password. If you don\'t have an account, try signing up.');
        } else {
          setError('Unable to create account. Please check your details and try again.');
        }
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account already exists with this email. Try signing in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError(`Something went wrong. Please try again. (${err.code || 'unknown'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-focus flex flex-col safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-72 h-72 bg-gradient-to-br from-violet-600/30 to-indigo-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 -right-20 w-60 h-60 bg-gradient-to-br from-indigo-600/20 to-purple-600/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-teal-600/10 to-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-teal-500/30">
            <img 
              src="/icon-192x192.png" 
              alt="LeaderReps" 
              className="h-16 w-16 rounded-xl"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Reppy</h1>
          <p className="text-gray-400 text-lg">Your Leadership Coach</p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-sm glass-card p-8">
          {mode === 'reset' && resetSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-3">Check your email</h2>
              <p className="text-gray-400 text-sm mb-6">
                We sent password reset instructions to {email}
              </p>
              <button
                onClick={() => { setMode('signin'); setResetSent(false); }}
                className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2 text-center">
                {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
              </h2>
              <p className="text-gray-400 text-sm mb-8 text-center">
                {mode === 'signin' ? 'Continue your leadership journey' : 
                 mode === 'signup' ? 'Start your leadership journey' : 
                 'Enter your email to reset'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="input-glass"
                    autoComplete="email"
                  />
                </div>

                {mode !== 'reset' && (
                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="input-glass"
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    />
                  </div>
                )}

                {error && (
                  <div className="text-rose-400 text-sm text-center py-2 px-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Loading...</span>
                    </span>
                  ) : (
                    mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
                  )}
                </button>
              </form>

              {/* Mode switches */}
              <div className="mt-6 text-center space-y-3">
                {mode === 'signin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-gray-500 text-sm hover:text-gray-400 transition-colors"
                    >
                      Forgot password?
                    </button>
                    <p className="text-gray-500 text-sm">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                      >
                        Sign up
                      </button>
                    </p>
                  </>
                )}
                {mode === 'signup' && (
                  <p className="text-gray-500 text-sm">
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('signin')}
                      className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                )}
                {mode === 'reset' && (
                  <button
                    onClick={() => setMode('signin')}
                    className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
                  >
                    Back to sign in
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-gray-600 text-xs text-center">
          By LeaderReps • Leadership development made simple
        </p>
      </div>
    </div>
  );
}
