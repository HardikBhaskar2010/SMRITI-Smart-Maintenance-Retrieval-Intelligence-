import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import '@/styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Placeholder pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
    <h1 className="text-4xl font-bold">{title}</h1>
    <p className="text-textSecondary">Coming soon...</p>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="assets" element={<Placeholder title="Assets Directory" />} />
            <Route path="graph" element={<Placeholder title="Knowledge Graph" />} />
            <Route path="guru" element={<Placeholder title="Guru Mode" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
