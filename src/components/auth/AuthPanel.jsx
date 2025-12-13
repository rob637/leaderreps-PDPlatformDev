// src/components/auth/AuthPanel.jsx

import React, { useState, useEffect } from 'react';
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
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { Loader } from 'lucide-react';
import { buildModulePath } from '../../services/pathUtils';

const SECRET_SIGNUP_CODE = '7777';

function AuthPanel({ auth, db, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [mode, setMode] = useState('login');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Invite State
  const [inviteData, setInviteData] = useState(null);
  const [checkingInvite, setCheckingInvite] = useState(true);

  const isReset = mode === 'reset';
  const isSignup = mode === 'signup';

  useEffect(() => {
    const checkInvite = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      
      if (token && db) {
        try {
          const q = query(collection(db, 'invitations'), where('token', '==', token));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const inviteDoc = snapshot.docs[0];
            const data = inviteDoc.data();
            
            if (data.status === 'pending') {
              setInviteData({ id: inviteDoc.id, ...data });
              setEmail(data.email);
              setMode('signup');
              if (data.name) setName(data.name);
            } else {
              setStatusMessage('This invitation has already been used or expired.');
            }
          } else {
            setStatusMessage('Invalid invitation link.');
          }
        } catch (error) {
          console.error("Error checking invite:", error);
          setStatusMessage('Error validating invitation.');
        }
      }
      setCheckingInvite(false);
    };
    
    checkInvite();
  }, [db]);

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
        // Validate Signup
        if (!inviteData) {
            if (secretCode !== SECRET_SIGNUP_CODE)
            throw new Error('Invalid secret sign-up code.');
        }
        
        if (!name) throw new Error('Name is required for signup.');

        // Create User
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        
        // Update Profile
        await updateProfile(userCredential.user, {
          displayName: name
        });

        // Handle Invite Acceptance & Cohort Assignment
        if (inviteData && db) {
            try {
                // 1. Mark invite as accepted
                const inviteRef = doc(db, 'invitations', inviteData.id);
                await updateDoc(inviteRef, {
                    status: 'accepted',
                    acceptedAt: serverTimestamp(),
                    acceptedBy: userCredential.user.uid
                });

                // 2. Assign Cohort to User Profile
                if (inviteData.cohortId) {
                    const userRef = doc(db, 'users', userCredential.user.uid);
                    // We use setDoc with merge because ensureUserDocs might not have run yet
                    await setDoc(userRef, {
                        cohortId: inviteData.cohortId
                    }, { merge: true });

                    // 3. Initialize Development Plan with Cohort Start Date
                    const cohortDoc = await getDoc(doc(db, 'cohorts', inviteData.cohortId));
                    if (cohortDoc.exists()) {
                        const cohortData = cohortDoc.data();
                        const devPlanPath = buildModulePath(userCredential.user.uid, 'development_plan', 'current');
                        
                        // Create the plan with the start date AND default fields
                        // This ensures ensureUserDocs doesn't overwrite or skip it
                        await setDoc(doc(db, devPlanPath), {
                            currentCycle: 1,
                            createdAt: serverTimestamp(),
                            lastAssessmentDate: null,
                            assessmentHistory: [], 
                            planHistory: [],
                            currentPlan: null,
                            startDate: cohortData.startDate
                        });
                    }
                }
            } catch (err) {
                console.error("Error processing invite acceptance:", err);
                // Don't block login if this fails, but log it
            }
        }

        onSuccess();
      }
    } catch (e) {
      console.error('Auth action failed:', e);
      
      // World-class Error Handling
      let message = e.message || 'An unexpected error occurred.';
      
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        message = "Incorrect email or password. If you previously signed in with Google, please try that button instead.";
      } else if (e.code === 'auth/email-already-in-use') {
        message = "This email is already registered. Please log in instead.";
      } else if (e.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      } else if (e.code === 'auth/too-many-requests') {
        message = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or try again later.";
      }

      setStatusMessage(message);
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
      
      let message = 'Google Sign-In failed.';
      if (e.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in cancelled.';
      } else if (e.code === 'auth/popup-blocked') {
        message = 'Sign-in popup was blocked by your browser.';
      }
      
      setStatusMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingInvite) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-corporate-light-gray">
            <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
        </div>
      );
  }

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
        
        {inviteData && isSignup && (
            <div className="mb-6 p-3 bg-teal-50 text-teal-800 rounded-lg text-sm">
                <p className="font-bold">Invitation Accepted!</p>
                <p>{inviteData.customMessage || "Welcome to the team."}</p>
            </div>
        )}

        <p className="text-sm text-gray-600 mb-6">
          {isReset
            ? 'Enter your email to receive a password reset link.'
            : isSignup
            ? (inviteData ? 'Complete your registration below.' : 'Enter your details and the provided code.')
            : 'Enter your email and password to access your account.'}
        </p>

        {statusMessage && (
          <div className={`mb-4 p-3 rounded text-sm ${
            statusMessage.includes('sent') || statusMessage.includes('Welcome') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
          }`}>
            {statusMessage}
          </div>
        )}

        <div className="space-y-4 text-left">
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-corporate-teal"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-corporate-teal disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!inviteData} 
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-corporate-teal"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}

          {isSignup && !inviteData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secret Sign-Up Code
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-corporate-teal"
                placeholder="Enter code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
              />
            </div>
          )}

          <button
            onClick={handleAction}
            disabled={isLoading}
            className={`w-full py-3 rounded font-bold text-white transition-colors flex justify-center items-center ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-corporate-teal hover:bg-teal-700'
            }`}
          >
            {isLoading ? (
              <Loader className="animate-spin h-5 w-5" />
            ) : mode === 'login' ? (
              'Sign In'
            ) : isSignup ? (
              'Create Account'
            ) : (
              'Send Reset Link'
            )}
          </button>

          {!isSignup && !isReset && (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          )}
        </div>

        <div className="mt-6 flex justify-between text-sm text-corporate-teal font-medium">
          {mode === 'login' ? (
            <>
              <button onClick={() => setMode('reset')}>Forgot Password?</button>
              <button onClick={() => setMode('signup')}>Create Account</button>
            </>
          ) : (
            <button
              onClick={() => {
                  setMode('login');
                  setInviteData(null);
                  setEmail('');
                  setName('');
              }}
              className="w-full text-center"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPanel;
