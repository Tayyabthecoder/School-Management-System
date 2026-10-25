import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function RoleRoute({ allowedRoles }) {
  const { user } = useAuthStore()

  const userRole = user?.roleName || (typeof user?.role === 'object' ? user?.role?.name : user?.role)

  if (!user || (!allowedRoles.includes(userRole) && userRole !== 'super_admin')) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
