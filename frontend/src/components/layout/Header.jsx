import React from 'react'
import {
  Menu,
  LogOut,
  Search,
  Sun,
  Moon,
  Keyboard,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'

export default function Header() {
  const { user, logout } = useAuthStore()
  const { toggleSidebar, theme, toggleTheme, openCommandPalette, openShortcutsModal } = useUIStore()

  const userRole = user?.roleName || user?.role || 'student'

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* Left: Sidebar Toggle & Academic Session Pill */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Sidebar Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-full border border-indigo-100 dark:border-indigo-900/50">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Session 2026 · Term 1</span>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={openCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-slate-400 dark:text-slate-400 rounded-xl text-xs font-medium transition-all shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search students, pages, actions...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Theme Toggle, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Search Icon */}
        <button
          onClick={openCommandPalette}
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Theme Toggle (Light / Dark Mode) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Keyboard Shortcuts (?) */}
        <button
          onClick={openShortcutsModal}
          className="hidden sm:flex p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* User Account Capsule */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200/80 dark:border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden lg:block text-left leading-none">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">{user?.username}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 capitalize mt-0.5">
              {userRole.replace('_', ' ')}
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
