import { create } from 'zustand'

let toastId = 0

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 3500) => {
    const id = ++toastId
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  // Shortcut helpers
  success: (msg) => useToastStore.getState().addToast(msg, 'success'),
  error: (msg) => useToastStore.getState().addToast(msg, 'error'),
  info: (msg) => useToastStore.getState().addToast(msg, 'info'),
  warning: (msg) => useToastStore.getState().addToast(msg, 'warning'),
}))

/**
 * Referentially stable toast helpers for components.
 *
 * `useToastStore()` without a selector returns the whole store state, which is a new
 * object every time a toast is added or removed. Pages that listed that object as a
 * hook dependency re-ran their data loaders on every toast, and a failing request
 * (whose error toast changed the store) refetched in an endless loop.
 */
const toastActions = Object.freeze({
  success: (msg) => useToastStore.getState().success(msg),
  error: (msg) => useToastStore.getState().error(msg),
  info: (msg) => useToastStore.getState().info(msg),
  warning: (msg) => useToastStore.getState().warning(msg),
})

export const useToast = () => toastActions
