/**
 * WidgetSDK.js
 * 
 * This defines the stable API contract for dynamic widgets.
 * Widgets should prefer using `sdk.*` methods over raw scope variables
 * to ensure long-term compatibility.
 */

export const createWidgetSDK = ({ 
  navigate, 
  user, 
  showToast,
  openModal 
}) => {
  return {
    // --- Navigation ---
    navigation: {
      goTo: (screen, params) => {
        if (typeof navigate === 'function') {
          navigate(screen, params);
        } else {
          console.warn('SDK: navigate is not available');
        }
      },
      openExternal: (url) => window.open(url, '_blank')
    },

    // --- User Context ---
    user: user ? {
      id: user.uid,
      email: user.email,
      name: user.displayName || 'User',
      avatar: user.photoURL
    } : null,

    // --- UI Utilities ---
    ui: {
      toast: (msg, type = 'info') => {
        console.log(`[Toast ${type}]: ${msg}`);
        if (showToast) showToast(msg, type);
      },
      openModal: (modalId, props) => {
        if (openModal) openModal(modalId, props);
      }
    },

    // --- Formatting ---
    format: {
      date: (d) => new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      currency: (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
    }
  };
};
