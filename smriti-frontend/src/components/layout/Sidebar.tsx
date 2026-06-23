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
      background: 'rgba(10, 10, 15, 0.4)', // Glassmorphic background
      backdropFilter: 'blur(16px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      overflow: 'hidden',
      zIndex: 100,
      boxShadow: '1px 0 20px rgba(0,0,0,0.2)',
    }}>
      {/* Logo */}
      <div style={{
        padding: sidebarOpen ? '28px 24px 24px' : '28px 16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
        display: 'flex', alignItems: 'center', gap: '12px',
        transition: 'padding 0.3s ease',
      }}>
        <div style={{
          width: '32px', height: '32px', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--accent-teal), #4F46E5)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: 800, color: '#fff',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}>
          S
        </div>
        {sidebarOpen && (
          <div style={{ opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.3s ease 0.1s', whiteSpace: 'nowrap' }}>
            <div style={{ fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '0.04em' }}>
              SMRITI
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', fontWeight: 500 }}>
              Smart Maintenance AI
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 14px',
              borderRadius: '12px',
              textDecoration: 'none',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
              background: isActive ? 'linear-gradient(90deg, rgba(20,184,166,0.15) 0%, rgba(99,102,241,0.05) 100%)' : 'transparent',
              border: isActive ? '1px solid rgba(20,184,166,0.2)' : '1px solid transparent',
              boxShadow: isActive ? 'inset 0 0 20px rgba(20,184,166,0.05)' : 'none',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'rgba(255,255,255,0.03)';
                el.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              if (!el.getAttribute('aria-current')) {
                el.style.background = 'transparent';
                el.style.color = 'rgba(255,255,255,0.6)';
              }
            }}
          >
            {({ isActive }) => (
              <>
                {/* Active Indicator Glow */}
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: '3px', height: '18px', background: 'var(--accent-teal)',
                    borderRadius: '0 4px 4px 0',
                    boxShadow: '0 0 10px var(--accent-teal)',
                  }} />
                )}
                <Icon size={18} style={{ 
                  flexShrink: 0, 
                  color: isActive ? 'var(--accent-teal)' : 'inherit',
                  filter: isActive ? 'drop-shadow(0 0 8px rgba(20,184,166,0.5))' : 'none'
                }} />
                <span style={{ opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s ease' }}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Version footer */}
      <div style={{ 
        padding: '24px', 
        borderTop: '1px solid rgba(255, 255, 255, 0.03)',
        opacity: sidebarOpen ? 1 : 0,
        transition: 'opacity 0.3s ease',
        whiteSpace: 'nowrap'
      }}>
        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
          SMRITI v1.0 · Hackathon 2026
        </p>
      </div>
    </aside>
  );
}
