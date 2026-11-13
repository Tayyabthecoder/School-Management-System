/** Normalises the several shapes `user.role` can take into one role-name string. */
export const resolveRole = (user) => {
  if (!user) return ''
  if (user.roleName) return user.roleName
  if (user.role && typeof user.role === 'object') return user.role.name || ''
  return user.role || ''
}
