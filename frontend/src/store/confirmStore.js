import { create } from 'zustand'

let pendingResolve = null

export const useConfirmStore = create((set) => ({
  request: null,
  close: (result) => {
    const resolve = pendingResolve
    pendingResolve = null
    set({ request: null })
    if (resolve) resolve(result)
  },
}))

/**
 * Promise-based replacement for window.confirm:
 *   if (!(await confirmAction({ title, message, confirmLabel, danger }))) return
 */
export const confirmAction = (options = {}) =>
  new Promise((resolve) => {
    // A newer request supersedes (cancels) an unanswered one.
    if (pendingResolve) pendingResolve(false)
    pendingResolve = resolve
    useConfirmStore.setState({ request: { title: 'Please confirm', confirmLabel: 'Confirm', cancelLabel: 'Cancel', danger: false, ...options } })
  })
