import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut 
} from 'firebase/auth';

const AuthContext = createContext(null);

// Allowed email domains for corporate access
const ALLOWED_DOMAINS = ['leaderreps.com', 'sagecg.com'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      if (firebaseUser) {
        // Check if email domain is allowed
        const emailDomain = firebaseUser.email?.split('@')[1];
        const domainAllowed = ALLOWED_DOMAINS.includes(emailDomain);
        
        console.log('Domain check:', emailDomain, domainAllowed);

        if (domainAllowed) {
          setUser(firebaseUser);
          setIsAuthorized(true);
          setError(null);
        } else {
          setUser(firebaseUser);
          setIsAuthorized(false);
          setError('Access restricted to LeaderReps employees');
        }
      } else {
        setUser(null);
        setIsAuthorized(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setError(null); // Clear any previous errors
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      // Provide friendlier error messages
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message);
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, isAuthorized, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
