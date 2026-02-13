import { create } from 'zustand';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

// Team members who have access to Team Sales Hub
const AUTHORIZED_EMAILS = [
  'rob@leaderreps.com',
  'rob@sagecg.com',
  'ryan@leaderreps.com',
  'jeff@leaderreps.com',
  'cristina@leaderreps.com',
  // Add more team members as needed
];

export const useAuthStore = create((set) => ({
  // State
  user: null,
  loading: true,
  error: null,
  isAuthorized: false,

  // Initialize auth listener
  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email?.toLowerCase();
        const isAuthorized = AUTHORIZED_EMAILS.some(
          e => e.toLowerCase() === email
        );
        
        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            photoURL: firebaseUser.photoURL
          },
          isAuthorized,
          loading: false,
          error: isAuthorized ? null : 'Access restricted to authorized team members'
        });
      } else {
        set({
          user: null,
          isAuthorized: false,
          loading: false,
          error: null
        });
      }
    });

    return unsubscribe;
  },

  // Actions
  signIn: async (email, password) => {
    set({ error: null, loading: true });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change will update the store
    } catch (err) {
      let errorMessage = 'An error occurred';
      if (err.code === 'auth/user-not-found' || 
          err.code === 'auth/wrong-password' || 
          err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null, isAuthorized: false });
    } catch (err) {
      console.error('Sign out error:', err);
      set({ error: err.message });
    }
  },

  clearError: () => set({ error: null }),
}));
