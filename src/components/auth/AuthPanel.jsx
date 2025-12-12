// src/components/auth/AuthPanel.jsx

import React, { useState } from 'react';
import {
  setPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setStatusMessage('');
    try {
      await setPersistence(auth, browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (e) {
      console.error('Google Auth failed:', e);
      setStatusMessage(e.message || 'Google Sign-In failed.');
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
            ? 'Sign In to Dashboard'
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

        {mode === 'login' && (
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="mt-4 w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-300 p-3 rounded-lg font-bold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        )}

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
