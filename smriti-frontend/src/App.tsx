import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { BottomNav } from '@/components/layout/BottomNav';
import { ToastContainer } from '@/components/ui/Toast';
import { AlertBell } from '@/components/alerts/AlertBell';
import { Dashboard } from '@/pages/Dashboard';          // immersive hero UI (from remote)
import { DashboardPage } from '@/pages/DashboardPage';  // full asset management view
import { QueryPage } from '@/pages/QueryPage';
import { GraphPage } from '@/pages/GraphPage';
import { GuruPage } from '@/pages/GuruPage';
import { UploadPage } from '@/pages/UploadPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';  // Phase 2
import { LoginPage } from '@/pages/LoginPage';           // Phase 2
import { useAuthStore } from '@/stores/authStore';       // Phase 2
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

      {/* Floating alert bell (Phase 2) */}
      <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 150 }}>
        <AlertBell />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes — wrapped in layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/"           element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard"  element={<Dashboard />} />       {/* hero UI */}
                    <Route path="/assets"     element={<DashboardPage />} />   {/* asset table/grid */}
                    <Route path="/query"      element={<QueryPage />} />
                    <Route path="/graph"      element={<GraphPage />} />
                    <Route path="/guru"       element={<GuruPage />} />
                    <Route path="/upload"     element={<UploadPage />} />
                    <Route path="/analytics"  element={<AnalyticsPage />} />   {/* Phase 2 */}
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
