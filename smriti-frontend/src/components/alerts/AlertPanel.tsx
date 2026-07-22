import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, AlertCircle, Info, Cpu } from 'lucide-react';
import type { AlertItem } from '@/hooks/useAlerts';

interface AlertPanelProps {
  open: boolean;
  onClose: () => void;
  alerts: AlertItem[];
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'CRITICAL') return <AlertCircle size={16} color="var(--debt-crit)" />;
  if (severity === 'WARNING')  return <AlertTriangle size={16} color="var(--debt-warn)" />;
  return <Info size={16} color="var(--accent-teal)" />;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso.slice(0, 16);
  }
}

export function AlertPanel({ open, onClose, alerts }: AlertPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 200, backdropFilter: 'blur(2px)',
            }}
          />

          {/* Slide-in panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '380px', maxWidth: '100vw',
              background: 'var(--bg-surface)',
              borderLeft: '1px solid var(--bg-stroke)',
              zIndex: 201, overflowY: 'auto',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 20px 16px',
              borderBottom: '1px solid var(--bg-stroke)',
              position: 'sticky', top: 0,
              background: 'var(--bg-surface)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="var(--accent-teal)" />
                <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                  System Alerts
                </span>
                <span style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--bg-stroke)',
                  borderRadius: '10px', padding: '1px 8px',
                  fontSize: '11px', color: 'var(--text-secondary)',
                }}>
                  {alerts.length}
                </span>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Alert list */}
            <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                  No alerts. All systems nominal.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      background: alert.is_read ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                      border: `1px solid ${alert.severity === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : alert.severity === 'WARNING' ? 'rgba(245,158,11,0.3)' : 'var(--bg-stroke)'}`,
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex', flexDirection: 'column', gap: '6px',
                      opacity: alert.is_read ? 0.7 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <SeverityIcon severity={alert.severity} />
                      <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
                        {alert.asset_id}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {formatTime(alert.created_at)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
