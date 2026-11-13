import { useAuthStore } from '../store/authStore'
import { resolveRole } from '../lib/role'

export { resolveRole }

/** The signed-in user's role name ('' when signed out). Use this instead of ad-hoc lookups. */
export function useRole() {
  return useAuthStore((state) => resolveRole(state.user))
}
