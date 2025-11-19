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

const SECRET_SIGNUP_CODE = '7777';

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
          displayName: name
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

          {statusMessage && (
            <p
              className={`text-sm p-3 rounded-lg ${
                statusMessage.includes('sent')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {statusMessage}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-corporate-teal text-white p-3 rounded-lg font-bold hover:bg-corporate-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-corporate-teal disabled:bg-gray-400 transition-colors duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="animate-spin mx-auto" />
            ) : isReset ? (
              'Send Reset Link'
            ) : isSignup ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-sm">
          {mode === 'login' ? (
            <>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('reset');
                  setStatusMessage('');
                }}
                className="font-medium text-corporate-teal hover:text-corporate-teal-dark"
              >
                Forgot password?
              </a>
              <span className="text-gray-500 mx-2">|</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('signup');
                  setStatusMessage('');
                }}
                className="font-medium text-corporate-teal hover:text-corporate-teal-dark"
              >
                Sign Up
              </a>
            </>
          ) : (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMode('login');
                setStatusMessage('');
              }}
              className="font-medium text-corporate-teal hover:text-corporate-teal-dark"
            >
              Back to Sign In
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPanel;
