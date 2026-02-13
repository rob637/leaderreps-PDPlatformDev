/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // LeaderReps brand colors
        'brand': {
          navy: '#002E47',
          teal: '#47A88D',
          orange: '#E04E1B',
        },
        // Semantic colors for CRM
        'crm': {
          new: '#3B82F6',        // Blue - New leads
          contacted: '#8B5CF6',  // Purple - In progress
          qualified: '#F59E0B',  // Amber - Qualified
          demo: '#10B981',       // Emerald - Demo scheduled
          proposal: '#6366F1',   // Indigo - Proposal sent
          negotiation: '#EC4899', // Pink - Negotiation
          won: '#22C55E',        // Green - Won
          lost: '#EF4444',       // Red - Lost
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'elevated': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
};
