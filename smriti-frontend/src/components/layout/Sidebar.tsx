import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Network, Brain, Upload } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/query',     icon: Search,          label: 'Query'     },
  { to: '/graph',     icon: Network,         label: 'Graph (3D)'},
  { to: '/guru',      icon: Brain,           label: 'Guru Mode' },
  { to: '/upload',    icon: Upload,          label: 'Upload Docs'},
];

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <aside style={{
      width: sidebarOpen ? '240px' : '64px',
      minWidth: sidebarOpen ? '240px' : '64px',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--bg-stroke)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      transition: 'width 0.2s ease, min-width 0.2s ease',
      overflow: 'hidden',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: sidebarOpen ? '24px 20px 20px' : '24px 16px 20px',
        borderBottom: '1px solid var(--bg-stroke)',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{
          width: '32px', height: '32px', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent-teal), #6366F1)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: 700, color: '#fff',
        }}>
          S
        </div>
        {sidebarOpen && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
              SMRITI
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px' }}>
              Smart Maintenance AI
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-teal-dim)' : 'transparent',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              transition: 'background 0.12s ease, color 0.12s ease',
              marginBottom: '2px',
              whiteSpace: 'nowrap',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'var(--bg-elevated)';
                el.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'transparent';
                el.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && label}
          </NavLink>
        ))}
      </nav>

      {/* Version footer */}
      {sidebarOpen && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--bg-stroke)' }}>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
            SMRITI v1.0 · ET AI Hackathon 2026
          </p>
        </div>
      )}
    </aside>
  );
}
