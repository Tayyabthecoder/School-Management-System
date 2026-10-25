import React, { Suspense, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import PageLoader from '../ui/PageLoader'
import CommandPalette from '../ui/CommandPalette'
import KeyboardShortcutsModal from '../ui/KeyboardShortcutsModal'
import ErrorBoundary from '../ui/ErrorBoundary'
import { useUIStore } from '../../store/uiStore'

export default function AppShell() {
  const { isSidebarOpen, closeSidebar, toggleCommandPalette, toggleShortcutsModal } = useUIStore()
  const navigate = useNavigate()

  // Global keyboard shortcuts (Ctrl+K, ?, and G -> navigation chords)
  useEffect(() => {
    let lastKey = ''
    let keyTimeout = null

    const handleKeyDown = (e) => {
      // Ignore shortcut if user is typing in an input, textarea, select, or contenteditable element
      const activeTag = document.activeElement?.tagName?.toLowerCase()
      const isInput =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        document.activeElement?.isContentEditable

      // Global Spotlight Search (Ctrl+K or Cmd+K)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggleCommandPalette()
        return
      }

      // If user is currently typing in an input field, do not trigger single-key or sequence shortcuts
      if (isInput) return

      // Keyboard Shortcuts Help Modal (?)
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        toggleShortcutsModal()
        return
      }

      // Two-key chord navigation: G then D, S, A, F, G, P
      if (lastKey === 'g' || lastKey === 'G') {
        const nextKey = e.key.toLowerCase()
        if (nextKey === 'd') {
          e.preventDefault()
          navigate('/dashboard')
        } else if (nextKey === 's') {
          e.preventDefault()
          navigate('/students')
        } else if (nextKey === 'a') {
          e.preventDefault()
          navigate('/attendance')
        } else if (nextKey === 'f') {
          e.preventDefault()
          navigate('/finance')
        } else if (nextKey === 'g') {
          e.preventDefault()
          navigate('/grades')
        } else if (nextKey === 'p') {
          e.preventDefault()
          navigate('/settings')
        }
        lastKey = ''
        if (keyTimeout) clearTimeout(keyTimeout)
        return
      }

      if (e.key.toLowerCase() === 'g') {
        lastKey = 'g'
        if (keyTimeout) clearTimeout(keyTimeout)
        keyTimeout = setTimeout(() => {
          lastKey = ''
        }, 1200)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (keyTimeout) clearTimeout(keyTimeout)
    }
  }, [toggleCommandPalette, toggleShortcutsModal, navigate])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Mobile overlay backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 z-30 lg:hidden backdrop-blur-xs"
          onClick={closeSidebar}
        />
      )}

      {/* Primary Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        } ml-0`}
      >
        <Header />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Spotlight Command Palette Modal */}
      <CommandPalette />

      {/* Power-User Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal />
    </div>
  )
}
