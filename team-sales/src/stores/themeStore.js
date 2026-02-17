import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      // Theme: 'light' | 'dark'
      theme: 'light',
      
      // Toggle between light and dark
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        applyTheme(newTheme);
      },
      
      // Set specific theme
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      
      // Initialize theme on app load
      initTheme: () => {
        const theme = get().theme;
        applyTheme(theme);
      },
    }),
    {
      name: 'team-sales-theme',
    }
  )
);

// Apply theme class to document
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
