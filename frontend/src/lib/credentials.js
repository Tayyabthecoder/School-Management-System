import { useToastStore } from '../store/toastStore'

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

/**
 * New accounts get a random one-time password that the server returns exactly once.
 * One account: show it in a long-lived toast. Many (bulk import): offer a CSV download,
 * since it cannot be retrieved again. Every account must change it on first login.
 */
export function announceCredentials(credentials) {
  const list = Array.isArray(credentials) ? credentials : credentials ? [credentials] : []
  if (list.length === 0) return

  if (list.length === 1) {
    const { username, password } = list[0]
    useToastStore.getState().addToast(
      `Login created — username: ${username}  |  temporary password: ${password}  (shown once; change required at first login)`,
      'info',
      60000
    )
    return
  }

  const csv = ['username,temporaryPassword', ...list.map((c) => `${csvCell(c.username)},${csvCell(c.password)}`)].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'new-account-credentials.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  useToastStore.getState().addToast(
    `${list.length} accounts created. Temporary passwords were saved to new-account-credentials.csv — store it securely and delete it after distributing.`,
    'warning',
    20000
  )
}
