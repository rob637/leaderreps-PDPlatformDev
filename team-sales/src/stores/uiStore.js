import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // Command palette
  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set(state => ({ 
    commandPaletteOpen: !state.commandPaletteOpen 
  })),

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set(state => ({ 
    sidebarCollapsed: !state.sidebarCollapsed 
  })),

  // Modals
  activeModal: null, // 'addProspect' | 'editProspect' | null
  modalData: null,
  openModal: (modal, data = null) => set({ 
    activeModal: modal, 
    modalData: data 
  }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // Detail panel
  detailPanelOpen: false,
  openDetailPanel: () => set({ detailPanelOpen: true }),
  closeDetailPanel: () => set({ detailPanelOpen: false }),

  // Toast notifications (handled by react-hot-toast mostly, but track state)
  toasts: [],
  addToast: (toast) => set(state => ({ 
    toasts: [...state.toasts, { id: Date.now(), ...toast }] 
  })),
  removeToast: (id) => set(state => ({ 
    toasts: state.toasts.filter(t => t.id !== id) 
  })),

  // Theme
  theme: 'light', // 'light' | 'dark'
  toggleTheme: () => set(state => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
}));
