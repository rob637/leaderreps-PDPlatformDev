// src/components/auth/AuthPanel.jsx

import React, { useState } from 'react';
import {
  setPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { Loader } from 'lucide-react';

const SECRET_SIGNUP_CODE = 'mock-code-123';

function AuthPanel({ auth, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [mode, setMode] = useState('login');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isReset = mode === 'reset';
  const isSignup = mode === 'signup';

  const handleAction = async () => {
    setIsLoading(true);
    setStatusMessage('');
    try {
      await setPersistence(auth, browserSessionPersistence);

      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      } else if (mode === 'reset') {
        if (!email) throw new Error('Email is required for password reset.');
        await sendPasswordResetEmail(auth, email);
        setStatusMessage('Password reset email sent. Check your inbox.');
      } else if (mode === 'signup') {
        if (secretCode !== SECRET_SIGNUP_CODE)
          throw new Error('Invalid secret sign-up code.');
        if (!name) throw new Error('Name is required for signup.');

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await updateProfile(userCredential.user, {
          displayName: name,
        });
        onSuccess();
      }
    } catch (e) {
      console.error('Auth action failed:', e);
      setStatusMessage(e.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-corporate-light-gray">
      <div
        className={`p-8 bg-white rounded-xl shadow-2xl text-center w-full max-w-sm border-t-4 border-corporate-teal`}
      >
        <h2
          className={`text-2xl font-extrabold mb-4 text-corporate-navy`}
        >
          {mode === 'login'
            ? 'Sign In to The Arena'
            : isSignup
            ? 'Create Your Account'
            : 'Reset Password'}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {isReset
            ? 'Enter your email to receive a password reset link.'
            : isSignup
            ? 'Enter your details and the provided code.'
            : 'Access your LeaderReps development platform.'}
        </p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleAction();
          }}
        >
          {isSignup && (
            <input
              type="text"
              placeholder="Your Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal"
              disabled={isLoading}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal"
            disabled={isLoading}
            autoComplete="email"
            required
          />
          {!isReset && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal"
              disabled={isLoading}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required={!isReset}
            />
          )}
          {isSignup && (
            <input
              type="text"
              placeholder="Secret Sign-up Code"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal"
              disabled={isLoading}
              required
            />
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full p-3 text-white rounded-lg font-semibold transition-colors focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-corporate-teal focus:ring-corporate-teal`}
          >
            {isLoading ? (
              <Loader className="animate-spin h-5 w-5 mx-auto" />
            ) : mode === 'login' ? (
              'Sign In'
            ) : isSignup ? (
              'Create Account'
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {statusMessage && (
          <p
            className={`text-sm text-center font-medium mt-4 ${
              statusMessage.includes('sent')
                ? `text-corporate-green`
                : `text-corporate-red`
            }`}
          >
            {statusMessage}
          </p>
        )}

        <div className="mt-6 border-t pt-4 border-gray-200 space-y-2 text-sm">
          {mode !== 'signup' && (
            <button
              onClick={() => {
                setMode('signup');
                setStatusMessage('');
              }}
              className={`font-semibold hover:underline block w-full text-corporate-teal`}
            >
              Need an account? Sign up
            </button>
          )}
          {mode !== 'login' && (
            <button
              onClick={() => {
                setMode('login');
                setStatusMessage('');
              }}
              className={`text-gray-500 hover:underline block w-full`}
            >
              Already have an account? Sign In
            </button>
          )}
          {mode === 'login' && (
            <button
              onClick={() => {
                setMode('reset');
                setStatusMessage('');
              }}
              className={`text-gray-500 hover:underline block w-full`}
            >
              Forgot Password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPanel;
