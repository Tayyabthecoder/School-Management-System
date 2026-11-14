import React from 'react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppRoutes from './routes'
import ToastContainer from './components/ui/ToastContainer'
import ConfirmDialog from './components/ui/ConfirmDialog'
import { registerNavigator } from './lib/navigation'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

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
