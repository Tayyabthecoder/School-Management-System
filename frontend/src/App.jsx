import React from 'react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import AppRoutes from './routes'
import { queryClient } from './lib/queryClient'
import ToastContainer from './components/ui/ToastContainer'
import ConfirmDialog from './components/ui/ConfirmDialog'
import { registerNavigator } from './lib/navigation'

// Gives the axios interceptor access to the router (see lib/navigation.js).
function NavigatorBridge() {
  const navigate = useNavigate()
  React.useEffect(() => {
    registerNavigator(navigate)
    return () => registerNavigator(null)
  }, [navigate])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NavigatorBridge />
        <AppRoutes />
        <ToastContainer />
        <ConfirmDialog />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
