import { useContext } from 'react';
import AppServiceContext from '../services/AppServiceContext';

export const useAuth = () => {
  const context = useContext(AppServiceContext);
  if (!context) {
    // If context is null, we might be outside the provider, or it hasn't initialized.
    // However, for safety in this specific app structure where DataProvider wraps everything,
    // we can return a default safe object or throw.
    // Given the build error, let's try to be safe but informative.
    console.warn('useAuth called outside of AppServiceContext provider');
    return { user: null, loading: true, signOut: () => {}, isAdmin: false };
  }
  
  return {
    user: context.user,
    loading: !context.isAuthReady,
    signOut: context.logout,
    auth: context.auth,
    isAdmin: context.isAdmin
  };
};
