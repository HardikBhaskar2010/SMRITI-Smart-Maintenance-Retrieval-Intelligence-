import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';
import { ToastContainer } from '@/components/ui/Toast';
import { Dashboard } from '@/pages/Dashboard';          // ← immersive hero UI (restored)
import { DashboardPage } from '@/pages/DashboardPage';  // ← full asset management view
import { QueryPage } from '@/pages/QueryPage';
import { GraphPage } from '@/pages/GraphPage';
import { GuruPage } from '@/pages/GuruPage';
import { UploadPage } from '@/pages/UploadPage';
import '@/styles/globals.css';
import '@/styles/animations.css';
import '@/styles/typography.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Desktop sidebar — hidden on mobile via CSS */}
      <div className="sidebar-wrapper">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Mobile top bar — hidden on desktop via CSS */}
        <div className="topbar-wrapper">
          <TopBar />
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — hidden on desktop via CSS */}
      <div className="bottomnav-wrapper">
        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/"          element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />        {/* ← immersive hero UI */}
            <Route path="/assets"    element={<DashboardPage />} />    {/* ← full asset table/grid */}
            <Route path="/query"     element={<QueryPage />} />
            <Route path="/graph"     element={<GraphPage />} />
            <Route path="/guru"      element={<GuruPage />} />
            <Route path="/upload"    element={<UploadPage />} />
          </Routes>
        </AppLayout>
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
