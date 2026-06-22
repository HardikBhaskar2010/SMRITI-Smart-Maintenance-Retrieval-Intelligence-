import { useAssetStore } from '@/stores/assetStore';

export function DebtSummaryBar() {
  const critCount = useAssetStore((s) => s.getCriticalCount());
  const warnCount = useAssetStore((s) => s.getWarningCount());
  const okCount   = useAssetStore((s) => s.getOkCount());

  const stat = (count: number, label: string, color: string, bg: string) => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '4px', padding: '16px 24px',
      background: bg, borderRadius: 'var(--radius-lg)',
      border: `1px solid ${color}30`,
      minWidth: '100px', flex: 1,
    }}>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '36px', fontWeight: 700,
        color, lineHeight: 1,
      }}>
        {count}
      </span>
      <span style={{
        fontSize: '11px', fontWeight: 600, color,
        letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {stat(critCount, 'Critical', 'var(--debt-crit)', 'rgba(239,68,68,0.08)')}
      {stat(warnCount, 'Warning',  'var(--debt-warn)', 'rgba(245,158,11,0.08)')}
      {stat(okCount,   'OK',       'var(--debt-ok)',   'rgba(34,197,94,0.08)')}
    </div>
  );
}
