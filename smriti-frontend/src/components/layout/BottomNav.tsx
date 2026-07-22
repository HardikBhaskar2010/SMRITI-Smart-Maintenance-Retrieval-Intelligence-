import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Network, Brain, Upload } from 'lucide-react';

const TAB_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home'  },
  { to: '/query',     icon: Search,          label: 'Query' },
  { to: '/graph',     icon: Network,         label: 'Graph' },
  { to: '/guru',      icon: Brain,           label: 'Guru'  },
  { to: '/upload',    icon: Upload,          label: 'Upload'},
];

export function BottomNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--bg-stroke)',
      display: 'flex',
      zIndex: 200,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TAB_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            padding: '10px 4px',
            textDecoration: 'none',
            color: isActive ? 'var(--accent-teal)' : 'var(--text-muted)',
            fontSize: '10px', fontWeight: isActive ? 600 : 400,
            transition: 'color 0.12s ease',
            minHeight: '52px',
          })}
        >
          {() => (
            <>
              <Icon size={20} />
              <span style={{ lineHeight: 1 }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
