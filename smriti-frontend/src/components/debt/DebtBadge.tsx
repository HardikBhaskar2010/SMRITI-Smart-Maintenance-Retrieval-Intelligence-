import { AlertOctagon, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Severity } from '@/api/types';

interface DebtBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
}

const CONFIG = {
  CRITICAL: {
    icon: AlertOctagon,
    color: 'var(--debt-crit)',
    bg:   'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
  },
  WARNING: {
    icon: AlertTriangle,
    color: 'var(--debt-warn)',
    bg:   'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.3)',
  },
  OK: {
    icon: CheckCircle,
    color: 'var(--debt-ok)',
    bg:   'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.3)',
  },
};

export function DebtBadge({ severity, size = 'sm' }: DebtBadgeProps) {
  const { icon: Icon, color, bg, border } = CONFIG[severity] ?? CONFIG.OK;
  const iconSize = size === 'sm' ? 11 : 13;
  const fontSize = size === 'sm' ? '10px' : '11px';
  const padding  = size === 'sm' ? '3px 8px' : '4px 10px';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: '999px', padding,
      fontSize, fontWeight: 600,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      fontFamily: 'Inter, sans-serif',
      whiteSpace: 'nowrap',
    }}>
      <Icon size={iconSize} />
      {severity}
    </span>
  );
}
