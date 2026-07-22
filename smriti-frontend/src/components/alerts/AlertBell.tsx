import { useState } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlerts } from '@/hooks/useAlerts';
import { AlertPanel } from './AlertPanel';

export function AlertBell() {
  const { alerts, unreadCount, markRead } = useAlerts();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    // Mark all as read when panel opens
    const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (unreadIds.length) markRead(unreadIds);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label={`Alerts (${unreadCount} unread)`}
        style={{
          position: 'relative',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', padding: '8px',
          borderRadius: '8px', display: 'flex', alignItems: 'center',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <Bell size={20} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '16px', height: '16px',
                background: 'var(--debt-crit)',
                borderRadius: '50%',
                fontSize: '9px', fontWeight: 700,
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg-surface)',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AlertPanel open={open} onClose={() => setOpen(false)} alerts={alerts} />
    </>
  );
}
