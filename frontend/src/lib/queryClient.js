import { QueryClient } from '@tanstack/react-query'

// Shared by the QueryClientProvider in App and by plain helpers such as loadClasses().
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
