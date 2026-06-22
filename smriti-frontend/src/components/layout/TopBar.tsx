import { Menu } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 150,
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--bg-stroke)',
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '0 16px',
      height: '56px',
    }}>
      <button
        onClick={toggleSidebar}
        aria-label="Toggle navigation"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', padding: '8px',
          borderRadius: '6px', display: 'flex', alignItems: 'center',
        }}
      >
        <Menu size={20} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '26px', height: '26px',
          background: 'linear-gradient(135deg, var(--accent-teal), #6366F1)',
          borderRadius: '6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700, color: '#fff',
        }}>
          S
        </div>
        <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
          SMRITI
        </span>
      </div>
    </header>
  );
}
