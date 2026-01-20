// src/components/auth/AuthPanel.jsx

import React, { useState, useEffect } from 'react';
import {
  setPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  // signInWithPopup
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { 
  doc, 
  updateDoc, 
  setDoc, 
  serverTimestamp,
  getDoc,
  increment
} from 'firebase/firestore';
import { Loader } from 'lucide-react';
import { buildModulePath } from '../../services/pathUtils';
import { ACTIVITY_TYPES, logActivity } from '../../services/activityLogger';

const SECRET_SIGNUP_CODE = '7777';

function AuthPanel({ auth, db, functions, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
      // Check for both 'token' (new) and 'invite' (legacy/test)
      // Also check sessionStorage for token saved by App.jsx when signing out logged-in users
      let token = params.get('token') || params.get('invite');
      
      // If no token in URL, check sessionStorage (used when logged-in user clicked invite link)
      if (!token) {
        token = sessionStorage.getItem('pendingInviteToken');
        if (token) {
          console.log("AuthPanel: Found pending invite token in sessionStorage");
          sessionStorage.removeItem('pendingInviteToken'); // Clear it after reading
        }
      }
      
      // No token found - immediately show login form (don't wait for functions)
      if (!token) {
        setCheckingInvite(false);
        return;
      }

      console.log("AuthPanel: Checking token:", token, "Functions available:", !!functions);

      // Token found but functions not ready yet - keep waiting
      if (!functions) {
        console.log("AuthPanel: Waiting for functions...");
        return;
      }

      try {
        setStatusMessage('Validating invitation...');
        const validateInvitation = httpsCallable(functions, 'validateInvitation');
        const result = await validateInvitation({ token });
        const data = result.data;
        console.log("AuthPanel: Validation result:", data);
        
        // Accept invites that are 'pending' (just created) or 'sent' (email was delivered)
        if (data.status === 'pending' || data.status === 'sent') {
          setInviteData(data);
          setEmail(data.email);
          setMode('signup');
          setStatusMessage('');
          // Set first and last name from invite data
          if (data.firstName) setFirstName(data.firstName);
          if (data.lastName) setLastName(data.lastName);
        } else {
          console.warn("AuthPanel: Invite status not valid for signup:", data.status);
          setStatusMessage('This invitation has already been used or expired.');
          // Clear the token from URL so user can log in normally without being signed out
          window.history.replaceState({}, document.title, window.location.pathname);
          // Also ensure sessionStorage is cleared
          sessionStorage.removeItem('pendingInviteToken');
        }
      } catch (error) {
        console.error("Error checking invite:", error);
        setStatusMessage(`Error validating invitation: ${error.message}`);
        // Clear the token from URL on error too, so user can log in
        window.history.replaceState({}, document.title, window.location.pathname);
        sessionStorage.removeItem('pendingInviteToken');
      } finally {
        setCheckingInvite(false);
      }
    };
    
    checkInvite();
  }, [functions]);

  const handleAction = async () => {
    setIsLoading(true);
    setStatusMessage('');
    try {
      // Use indexedDBLocalPersistence for better PWA support, fallback to browserLocalPersistence
      // This keeps users logged in across browser sessions and app restarts
      try {
        await setPersistence(auth, indexedDBLocalPersistence);
      } catch {
        // Fallback for browsers that don't support IndexedDB
        await setPersistence(auth, browserLocalPersistence);
      }

      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Clear lastScreen so user always starts at dashboard on fresh login
        localStorage.removeItem('lastScreen');
        localStorage.removeItem('lastNavParams');
        // Update lastLogin timestamp in user document
        try {
          const userRef = doc(db, 'users', userCredential.user.uid);
          await updateDoc(userRef, {
            lastLogin: serverTimestamp()
          });
        } catch (e) {
          console.warn('Could not update lastLogin:', e);
        }
        // Log login activity
        await logActivity(db, ACTIVITY_TYPES.USER_LOGIN, {
          action: 'User Login',
          userEmail: userCredential.user.email,
          userId: userCredential.user.uid,
          details: 'Successful login'
        }).catch(err => console.warn('Activity log failed:', err));
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
        
        if (!firstName.trim()) throw new Error('First name is required for signup.');
        if (!lastName.trim()) throw new Error('Last name is required for signup.');

        // FIRST: Clear token from URL BEFORE creating user to prevent sign-out loop
        // (App.jsx signs out users who have invite tokens in URL)
        if (window.location.search.includes('token=') || window.location.search.includes('invite=')) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Create User (this also logs them in automatically)
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        
        // Update Profile - combine first and last name for displayName
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        await updateProfile(userCredential.user, {
          displayName: fullName
        });

        // Handle Invite Acceptance & Cohort Assignment
        if (inviteData && db) {
            try {
                console.log("[AuthPanel] Processing invite acceptance, inviteData:", inviteData);
                
                // Log signup activity (await to ensure it completes)
                await logActivity(db, ACTIVITY_TYPES.USER_SIGNUP, {
                  action: 'New User Sign-up',
                  userEmail: userCredential.user.email,
                  userId: userCredential.user.uid,
                  details: inviteData.cohortId ? `Cohort: ${inviteData.cohortId}` : 'Invite signup'
                }).catch(err => console.warn('Activity log failed:', err));
                
                let cloudFunctionSucceeded = false;
                
                // Call Cloud Function to accept invite
                // The function handles: marking accepted, adding admin email, and saving user profile
                if (functions) {
                    try {
                        console.log("[AuthPanel] Calling acceptInvitation function...");
                        const acceptInvitation = httpsCallable(functions, 'acceptInvitation');
                        const result = await acceptInvitation({ inviteId: inviteData.id });
                        console.log("[AuthPanel] acceptInvitation succeeded:", result.data);
                        cloudFunctionSucceeded = true;
                    } catch (fnErr) {
                        console.error("[AuthPanel] acceptInvitation function failed:", fnErr);
                        // Continue - we'll handle this with direct writes below
                    }
                }

                // FALLBACK: If cloud function failed or wasn't available, write user profile directly
                // This ensures cohortId and role are always set correctly
                if (!cloudFunctionSucceeded) {
                    console.log("[AuthPanel] Cloud function failed/unavailable, writing user profile directly...");
                    try {
                        const userRef = doc(db, 'users', userCredential.user.uid);
                        const userProfileData = {
                            role: inviteData.role || 'user',
                            email: inviteData.email,
                            displayName: fullName,
                            arenaEntryDate: serverTimestamp()
                        };
                        if (inviteData.cohortId) {
                            userProfileData.cohortId = inviteData.cohortId;
                        }
                        await setDoc(userRef, userProfileData, { merge: true });
                        console.log("[AuthPanel] User profile written directly with cohortId:", inviteData.cohortId);
                        
                        // Also mark invitation as accepted
                        if (inviteData.id) {
                            const inviteRef = doc(db, 'invitations', inviteData.id);
                            await updateDoc(inviteRef, {
                                status: 'accepted',
                                acceptedAt: serverTimestamp(),
                                acceptedBy: userCredential.user.uid
                            });
                            console.log("[AuthPanel] Invitation marked as accepted");
                        }
                    } catch (directWriteErr) {
                        console.error("[AuthPanel] Direct user profile write failed:", directWriteErr);
                    }
                }

                // Initialize Development Plan with Cohort Start Date (if cohort assigned)
                if (inviteData.cohortId) {
                    console.log("[AuthPanel] Fetching cohort data for start date...");
                    const cohortDoc = await getDoc(doc(db, 'cohorts', inviteData.cohortId));
                    if (cohortDoc.exists()) {
                        const cohortData = cohortDoc.data();
                        console.log("[AuthPanel] Cohort data:", cohortData);
                        const devPlanPath = buildModulePath(userCredential.user.uid, 'development_plan', 'current');
                        console.log("[AuthPanel] Creating dev plan at:", devPlanPath);
                        
                        // Create the plan with the start date, cohortId, AND default fields
                        await setDoc(doc(db, devPlanPath), {
                            currentCycle: 1,
                            createdAt: serverTimestamp(),
                            lastAssessmentDate: null,
                            assessmentHistory: [], 
                            planHistory: [],
                            currentPlan: null,
                            startDate: cohortData.startDate,
                            cohortId: inviteData.cohortId
                        });
                        console.log("[AuthPanel] Dev plan created with cohort start date and cohortId:", inviteData.cohortId);
                    } else {
                        console.warn("[AuthPanel] Cohort document not found:", inviteData.cohortId);
                    }

                    // Increment cohort member count
                    try {
                        const cohortRef = doc(db, 'cohorts', inviteData.cohortId);
                        await updateDoc(cohortRef, {
                            memberCount: increment(1)
                        });
                        console.log("[AuthPanel] Cohort member count incremented");
                    } catch (countErr) {
                        console.warn("Failed to increment cohort member count:", countErr);
                    }
                } else {
                    console.log("[AuthPanel] No cohortId in inviteData");
                }
            } catch (err) {
                console.error("Error processing invite acceptance:", err);
                // Don't block login if this fails, but log it
            }
        } else if (db) {
            // Log signup for non-invite users (await to ensure it completes)
            await logActivity(db, ACTIVITY_TYPES.USER_SIGNUP, {
              action: 'New User Sign-up',
              userEmail: userCredential.user.email,
              userId: userCredential.user.uid,
              details: 'Direct signup with secret code'
            }).catch(err => console.warn('Activity log failed:', err));
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

  /*
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setStatusMessage('');
    try {
      // Use indexedDBLocalPersistence for better PWA support
      try {
        await setPersistence(auth, indexedDBLocalPersistence);
      } catch {
        await setPersistence(auth, browserLocalPersistence);
      }
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Ensure user docs exist for Google users
      if (result.user && db) {
        // We import ensureUserDocs dynamically to avoid circular deps if any, 
        // or just assume it's available via a service. 
        // But since we don't have it imported, let's do a basic check/create here
        // similar to what ensureUserDocs does, or just rely on the App to call it.
        // However, the App might fail if data is missing immediately.
        
        // Let's manually ensure the user profile exists at minimum
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            await setDoc(userRef, {
                userId: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                arenaEntryDate: serverTimestamp(), // When user first entered the arena
                role: 'user' // Default role
            });
            
            // Also initialize dev plan to prevent "undefined" errors
            const devPlanPath = buildModulePath(result.user.uid, 'development_plan', 'current');
            const devPlanRef = doc(db, devPlanPath);
            const devPlanSnap = await getDoc(devPlanRef);
            
            if (!devPlanSnap.exists()) {
                 await setDoc(devPlanRef, {
                    currentCycle: 1,
                    createdAt: serverTimestamp(),
                    lastAssessmentDate: null,
                    assessmentHistory: [], 
                    planHistory: [],
                    currentPlan: null
                });
            }
        } else {
            // Existing user - update lastLogin
            await updateDoc(userRef, {
              lastLogin: serverTimestamp()
            });
        }
      }

      onSuccess();
    } catch (e) {
      console.error('Google Auth failed:', e);
      
      let message = 'Google Sign-In failed.';
      if (e.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in cancelled.';
      } else if (e.code === 'auth/popup-blocked') {
        message = 'Sign-in popup was blocked by your browser.';
      } else if (e.code === 'auth/account-exists-with-different-credential') {
        message = 'An account already exists with this email using a different sign-in method. Try email/password instead.';
      } else if (e.code === 'auth/cancelled-popup-request') {
        message = 'Sign-in cancelled.';
      } else if (e.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      }
      
      setStatusMessage(message);
    } finally {
      setIsLoading(false);
    }
  };
  */

  if (checkingInvite) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-corporate-navy via-[#003a59] to-corporate-navy gap-4">
            <img src="/icons/icon-192x192.png" alt="LeaderReps" className="w-16 h-16 rounded-2xl shadow-lg mb-2" />
            <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
            <p className="text-white/80 text-sm">Validating your invitation...</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-corporate-navy via-[#003a59] to-corporate-navy">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-corporate-teal/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-corporate-orange/10 rounded-full blur-3xl"></div>
      </div>
      
      <div
        className="relative p-8 sm:p-10 bg-white rounded-2xl shadow-2xl text-center w-full max-w-md border-0"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/icons/icon-192x192.png" alt="LeaderReps" className="w-16 h-16 rounded-2xl shadow-lg" />
        </div>
        
        <h2
          className="text-2xl font-semibold mb-2 text-corporate-navy tracking-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {mode === 'login'
            ? 'Welcome Back'
            : isSignup
            ? 'Create Account'
            : 'Reset Password'}
        </h2>
        
        {inviteData && isSignup && (
            <div className="mb-6 p-4 bg-corporate-teal/5 text-corporate-navy rounded-xl text-sm border border-corporate-teal/20">
                <p className="font-semibold text-corporate-teal">Invitation Accepted!</p>
                <p className="text-slate-600 mt-1">{inviteData.customMessage || "Welcome to the team."}</p>
            </div>
        )}

        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
          {isReset
            ? 'Enter your email to receive a password reset link.'
            : isSignup
            ? (inviteData ? 'Complete your registration below.' : 'Enter your details and the provided code.')
            : 'Sign in to access the Arena.'}
        </p>

        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl text-sm ${
            statusMessage.includes('sent') || statusMessage.includes('Welcome') 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                : 'bg-red-50 text-red-800 border border-red-100'
          }`}>
            {statusMessage}
          </div>
        )}

        <div className="space-y-5 text-left">
          {isSignup && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  autoComplete="given-name"
                  className="w-full p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 focus:border-corporate-teal transition-all duration-200 hover:border-slate-300 text-slate-800 placeholder:text-slate-400"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  autoComplete="family-name"
                  className="w-full p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 focus:border-corporate-teal transition-all duration-200 hover:border-slate-300 text-slate-800 placeholder:text-slate-400"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              autoComplete="username"
              className="w-full p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 focus:border-corporate-teal disabled:bg-slate-50 disabled:text-slate-500 transition-all duration-200 hover:border-slate-300 text-slate-800 placeholder:text-slate-400"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!inviteData}
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="w-full p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 focus:border-corporate-teal transition-all duration-200 hover:border-slate-300 text-slate-800 placeholder:text-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>
          )}

          {isSignup && !inviteData && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Secret Sign-Up Code
              </label>
              <input
                type="text"
                autoComplete="off"
                className="w-full p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 focus:border-corporate-teal transition-all duration-200 hover:border-slate-300 text-slate-800 placeholder:text-slate-400"
                placeholder="Enter code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>
          )}

          <button
            onClick={handleAction}
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 flex justify-center items-center shadow-md ${
              isLoading
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-corporate-teal hover:bg-teal-600 hover:shadow-lg hover:shadow-corporate-teal/25 active:scale-[0.98]'
            }`}
            style={{ fontFamily: 'var(--font-body)' }}
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

          {/* Google login disabled - uncomment to re-enable
          {!isSignup && !isReset && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-slate-400">or continue with</span>
                </div>
              </div>
              
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </>
          )}
          */}
        </div>

        <div className="mt-8 flex justify-center gap-1 text-sm">
          {mode === 'login' ? (
            <>
              <button 
                onClick={() => setMode('reset')}
                className="text-slate-500 hover:text-corporate-teal transition-colors"
              >
                Forgot Password?
              </button>
              <span className="text-slate-300 mx-2">·</span>
              <button 
                onClick={() => setMode('signup')}
                className="text-corporate-teal font-medium hover:text-teal-600 transition-colors"
              >
                Create Account
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                  setMode('login');
                  setInviteData(null);
                  setEmail('');
                  setFirstName('');
                  setLastName('');
              }}
              className="text-slate-500 hover:text-corporate-teal transition-colors"
            >
              ← Back to Sign In
            </button>
          )}
        </div>
        
        {/* Footer branding */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Powered by <span className="font-medium text-corporate-navy">LeaderReps</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPanel;
