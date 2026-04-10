import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';

export default function LoginScreen() {
  const { login, signup, resetPassword } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isReset) {
        await resetPassword(email);
        setSuccess('Password reset email sent! Check your inbox.');
        setLoading(false);
        return;
      }
      if (isSignup) {
        await signup(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-lab-navy">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Leadership Lab</h1>
          <p className="text-stone-400 text-sm">See yourself. Change yourself.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && !isReset && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-stone-400 focus:outline-none focus:border-lab-teal"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-stone-400 focus:outline-none focus:border-lab-teal"
          />
          {!isReset && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-stone-400 focus:outline-none focus:border-lab-teal"
            />
          )}

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          {success && (
            <p className="text-green-400 text-sm text-center">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-lab-teal text-white font-semibold rounded-xl hover:bg-lab-teal-dark transition-colors disabled:opacity-50"
          >
            {loading ? '...' : isReset ? 'Send Reset Link' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {!isReset && !isSignup && (
          <button
            onClick={() => { setIsReset(true); setError(''); setSuccess(''); }}
            className="w-full mt-3 text-sm text-stone-500 hover:text-stone-300 transition-colors text-center"
          >
            Forgot password?
          </button>
        )}

        <button
          onClick={() => { setIsSignup(!isSignup); setIsReset(false); setError(''); setSuccess(''); }}
          className="w-full mt-4 text-sm text-stone-400 hover:text-white transition-colors text-center"
        >
          {isReset ? 'Back to sign in' : isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      </div>
    </div>
  );
}
