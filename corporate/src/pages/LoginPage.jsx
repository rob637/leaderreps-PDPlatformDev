import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { signIn, error, user, isAuthorized, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in and authorized, redirect to dashboard
  if (!loading && user && isAuthorized) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await signIn(email, password);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-corporate-navy to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-corporate-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-corporate-navy">LeaderReps</h1>
          <p className="text-slate-500 mt-1">Corporate Hub</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 text-sm font-medium">Access Denied</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Unauthorized but logged in */}
        {user && !isAuthorized && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-700 text-sm">
              You're signed in as <strong>{user.email}</strong>, but this email doesn't have access to the Corporate Hub.
            </p>
            <p className="text-amber-600 text-sm mt-2">
              Please sign in with a @leaderreps.com or @sagecg.com email address.
            </p>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@sagecg.com"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:border-transparent pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-corporate-navy hover:bg-corporate-navy/90 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Access restricted to LeaderReps employees
          </p>
        </div>

        {/* Software We're Replacing */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center mb-3">
            Tools we're building to replace:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Sales Navigator', 'LinkedIn Helper', 'Calendly', 'Amplify'].map((tool) => (
              <span
                key={tool}
                className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
