import { motion } from 'framer-motion';
import { FileText, User, Clock, Brain } from 'lucide-react';
import type { AssetSummary } from '@/api/types';
import { DebtRing } from '@/components/debt/DebtRing';
import { DebtBadge } from '@/components/debt/DebtBadge';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/uiStore';
import { formatRelativeTime, formatAssetType } from '@/utils/formatters';

interface AssetCardProps {
  asset: AssetSummary;
  index?: number;
  onInterviewExpert?: (assetId: string) => void;
}

export function AssetCard({ asset, index = 0, onInterviewExpert }: AssetCardProps) {
  const openAssetDrawer = useUIStore((s) => s.openAssetDrawer);
  const isCritical = asset.severity === 'CRITICAL';
  const isWarning  = asset.severity === 'WARNING';

  const borderColor = isCritical ? 'var(--debt-crit)' : isWarning ? 'var(--debt-warn)' : 'var(--bg-stroke)';
  const borderLeft  = (isCritical || isWarning) ? `3px solid ${borderColor}` : `1px solid var(--bg-stroke)`;

  return (
    <motion.div
      custom={index}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2, ease: 'easeOut' }}
      style={{
        background: isCritical
          ? 'linear-gradient(135deg, var(--bg-surface) 0%, rgba(239,68,68,0.04) 100%)'
          : 'var(--bg-surface)',
        border: `1px solid ${borderColor}`,
        borderLeft,
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        cursor: 'default',
        animation: isCritical ? 'criticalPulse 1.5s ease-in-out infinite' : undefined,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{
            margin: 0,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '16px', fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            {asset.asset_id}
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {formatAssetType(asset.asset_type)}
          </p>
        </div>
        <DebtBadge severity={asset.severity} />
      </div>

      {/* Score + Ring */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <DebtRing score={asset.debt_score} severity={asset.severity} size="sm" />
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Knowledge Debt
          </p>
          {/* Mini progress bar */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              width: `${asset.debt_score}%`, height: '100%',
              background: isCritical ? 'var(--debt-crit)' : isWarning ? 'var(--debt-warn)' : 'var(--debt-ok)',
              borderRadius: '4px',
              transition: 'width 0.6s ease-out',
            }} />
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: isCritical ? 'var(--debt-crit)' : isWarning ? 'var(--debt-warn)' : 'var(--debt-ok)' }}>
            {asset.debt_score} / 100
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div style={{
        display: 'flex', gap: '16px', flexWrap: 'wrap',
        fontSize: '12px', color: 'var(--text-secondary)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FileText size={12} /> {asset.item_count} items
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <User size={12} /> {asset.expert_count} expert{asset.expert_count !== 1 ? 's' : ''}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> {formatRelativeTime(asset.last_updated)}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <Button
          variant="secondary"
          size="sm"
          icon={<FileText size={12} />}
          onClick={() => openAssetDrawer(asset.asset_id)}
          style={{ flex: 1 }}
        >
          View Thread
        </Button>
        {onInterviewExpert && (
          <Button
            variant={isCritical ? 'primary' : 'ghost'}
            size="sm"
            icon={<Brain size={12} />}
            onClick={() => onInterviewExpert(asset.asset_id)}
            style={{ flex: 1 }}
          >
            Interview
          </Button>
        )}
      </div>
    </motion.div>
  );
}
