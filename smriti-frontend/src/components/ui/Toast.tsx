import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';
import { useUIStore, type Toast as ToastType } from '@/stores/uiStore';

const ICONS = {
  success: <CheckCircle size={16} />,
  error:   <AlertOctagon size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info size={16} />,
};

const COLORS = {
  success: 'var(--debt-ok)',
  error:   'var(--debt-crit)',
  warning: 'var(--debt-warn)',
  info:    'var(--accent-teal)',
};

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUIStore((s) => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        background: 'var(--bg-elevated)',
        border: `1px solid var(--bg-stroke)`,
        borderLeft: `3px solid ${COLORS[toast.variant]}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        minWidth: '280px',
        maxWidth: '380px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        pointerEvents: 'all',
      }}
    >
      <span style={{ color: COLORS[toast.variant], marginTop: '1px', flexShrink: 0 }}>
        {ICONS[toast.variant]}
      </span>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', flex: 1, lineHeight: 1.5 }}>
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        aria-label="Dismiss"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: '2px', flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div
      style={{
        position: 'fixed', top: '20px', right: '20px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        zIndex: 2000, pointerEvents: 'none',
      }}
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
      </AnimatePresence>
    </div>
  );
}
