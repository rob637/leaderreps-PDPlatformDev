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
      console.error('Auth error:', err);
      if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account already exists with this email.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-reppy-cream to-reppy-teal-light flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8 text-center">
          <img 
            src="/lr_logo_teal__1_.png" 
            alt="LeaderReps" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-reppy-navy">Reppy</h1>
          <p className="text-reppy-navy/60 mt-1">Your Leadership Growth Partner</p>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
          {mode === 'reset' && resetSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-reppy-teal-light rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-reppy-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-reppy-navy mb-2">Check your email</h2>
              <p className="text-reppy-navy/60 text-sm mb-4">
                We sent password reset instructions to {email}
              </p>
              <button
                onClick={() => { setMode('signin'); setResetSent(false); }}
                className="text-reppy-teal font-medium"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-reppy-navy mb-1 text-center">
                {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
              </h2>
              <p className="text-reppy-navy/60 text-sm mb-6 text-center">
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
                    className="input-journal"
                    required
                  />
                </div>

                {mode !== 'reset' && (
                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="input-journal"
                      required
                      minLength={6}
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center space-y-2">
                {mode === 'signin' && (
                  <>
                    <button
                      onClick={() => setMode('reset')}
                      className="text-sm text-reppy-navy/60 hover:text-reppy-teal"
                    >
                      Forgot password?
                    </button>
                    <div className="text-sm text-reppy-navy/60">
                      Don't have an account?{' '}
                      <button
                        onClick={() => setMode('signup')}
                        className="text-reppy-teal font-medium"
                      >
                        Sign up
                      </button>
                    </div>
                  </>
                )}
                {mode === 'signup' && (
                  <div className="text-sm text-reppy-navy/60">
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('signin')}
                      className="text-reppy-teal font-medium"
                    >
                      Sign in
                    </button>
                  </div>
                )}
                {mode === 'reset' && (
                  <button
                    onClick={() => setMode('signin')}
                    className="text-sm text-reppy-teal font-medium"
                  >
                    Back to sign in
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 text-center">
        <img 
          src="/leaderreps-logo.svg" 
          alt="LeaderReps" 
          className="h-6 mx-auto mb-2 opacity-40"
        />
        <p className="text-xs text-reppy-navy/40">
          By continuing, you agree to LeaderReps Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
