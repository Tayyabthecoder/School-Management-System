import { create } from 'zustand'

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem('sms_theme')
    if (stored === 'dark' || stored === 'light') return stored
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  } catch {
    // Fallback
  }
  return 'light'
}

const applyThemeToDOM = (theme) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('sms_theme', theme)
  }
}

// Apply theme on initial load
const initialTheme = getInitialTheme()
applyThemeToDOM(initialTheme)

export const useUIStore = create((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  openSidebar: () => set({ isSidebarOpen: true }),

  // Theme Management
  theme: initialTheme,
  setTheme: (theme) => {
    applyThemeToDOM(theme)
    set({ theme })
  },
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark'
      applyThemeToDOM(nextTheme)
      return { theme: nextTheme }
    }),

  // Global Command Palette (Ctrl+K)
  isCommandPaletteOpen: false,
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

  // Keyboard Shortcuts Modal (?)
  isShortcutsModalOpen: false,
  openShortcutsModal: () => set({ isShortcutsModalOpen: true }),
  closeShortcutsModal: () => set({ isShortcutsModalOpen: false }),
  toggleShortcutsModal: () => set((state) => ({ isShortcutsModalOpen: !state.isShortcutsModalOpen })),
}))
