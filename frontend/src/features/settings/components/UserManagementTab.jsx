import React from 'react'
import {
  Users,
  RefreshCw,
  Plus,
  Key,
} from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { SkeletonTable } from '../../../components/ui/Skeleton'

export default function UserManagementTab({
  users,
  loadingUsers,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  onRefreshUsers,
  onOpenCreateUser,
  onSelectUserForReset,
  ROLE_COLORS,
}) {
  const filteredUsers = (Array.isArray(users) ? users : []).filter((u) => {
    const q = (userSearch || '').toLowerCase()
    const matchesSearch =
      (u?.username || '').toLowerCase().includes(q) ||
      (u?.roleName || '').toLowerCase().includes(q)
    const matchesRole = userRoleFilter === 'all' || u?.roleName === userRoleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              System Users & Role-Based Access
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Manage login credentials and granular permissions across modules.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshUsers}
              className="p-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300"
              title="Refresh Users"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Button
              type="button"
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={onOpenCreateUser}
            >
              Add User Account
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by username or role…"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg text-sm w-64"
          />
          <div className="flex flex-wrap gap-1">
            {['all', 'super_admin', 'teacher', 'accountant', 'hr_manager', 'student'].map((r) => (
              <button
                key={r}
                onClick={() => setUserRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  userRoleFilter === r
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {loadingUsers ? (
          <SkeletonTable rows={6} />
        ) : (
          <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 bg-gray-50 dark:bg-slate-800/50 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
              <div className="col-span-4">User Account</div>
              <div className="col-span-3">Assigned Role</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredUsers.map((u) => {
                const rName = u.roleName || u.role?.name || 'user'
                return (
                  <div key={u._id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {u.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{u.username}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">ID: {u._id?.slice(-6)}</p>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <Badge variant={ROLE_COLORS[rName] || 'primary'}>
                        {rName.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                      </span>
                    </div>
                    <div className="col-span-3 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        icon={<Key className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                        onClick={() => onSelectUserForReset(u)}
                        className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                      >
                        Reset Password
                      </Button>
                    </div>
                  </div>
                )
              })}
              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400 dark:text-slate-500">No users match criteria</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
