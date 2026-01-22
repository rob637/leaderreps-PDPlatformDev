// Simple access code configuration for demo protection
const VALID_CODES = ['Leader', 'leader', 'LEADER'];
const SESSION_KEY = 'leaderreps_demo_access';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const validateAccessCode = (code) => {
  const isValid = VALID_CODES.includes(code);
  if (isValid) {
    const session = {
      timestamp: Date.now(),
      expires: Date.now() + SESSION_DURATION
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return isValid;
};

export const hasValidSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (session && session.expires > Date.now()) {
      return true;
    }
    localStorage.removeItem(SESSION_KEY);
    return false;
  } catch {
    return false;
  }
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};
