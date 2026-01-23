import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

// Theme options
export const THEME_OPTIONS = {
  AUTO: 'auto',
  LIGHT: 'light',
  DARK: 'dark',
};

export function ThemeProvider({ children, preference = 'auto' }) {
  const [themePreference, setThemePreference] = useState(preference);
  const [activeTheme, setActiveTheme] = useState('dark');

  // Calculate active theme based on preference and time
  useEffect(() => {
    const calculateTheme = () => {
      if (themePreference === 'light') return 'light';
      if (themePreference === 'dark') return 'dark';
      
      // Auto mode - light from 6am to 6pm
      const hour = new Date().getHours();
      return (hour >= 6 && hour < 18) ? 'light' : 'dark';
    };

    setActiveTheme(calculateTheme());

    // Update every minute for auto mode
    if (themePreference === 'auto') {
      const interval = setInterval(() => {
        setActiveTheme(calculateTheme());
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [themePreference]);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(`theme-${activeTheme}`);
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ 
      themePreference, 
      setThemePreference, 
      activeTheme,
      isDark: activeTheme === 'dark',
      isLight: activeTheme === 'light',
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
