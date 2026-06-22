import { useState } from 'react';
import { ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react';
import type { AssetSummary } from '@/api/types';
import { DebtBadge } from './DebtBadge';
import { useUIStore } from '@/stores/uiStore';
import { formatRelativeTime } from '@/utils/formatters';
import { formatAssetType } from '@/utils/formatters';

type SortField = 'debt_score' | 'asset_id' | 'asset_type' | 'item_count' | 'expert_count';
type SortDir = 'asc' | 'desc';

interface DebtTableProps {
  assets: AssetSummary[];
}

export function DebtTable({ assets }: DebtTableProps) {
  const [sortField, setSortField] = useState<SortField>('debt_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const openAssetDrawer = useUIStore((s) => s.openAssetDrawer);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = [...assets].sort((a, b) => {
    let av: string | number = a[sortField] as string | number;
    let bv: string | number = b[sortField] as string | number;
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return <ChevronUp size={12} style={{ opacity: 0.2 }} />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} />
      : <ChevronDown size={12} />;
  };

  const Th = ({ label, field }: { label: string; field: SortField }) => (
    <th
      onClick={() => handleSort(field)}
      style={{
        padding: '10px 14px', textAlign: 'left', cursor: 'pointer',
        fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: 'var(--text-secondary)',
        borderBottom: '1px solid var(--bg-stroke)',
        whiteSpace: 'nowrap', userSelect: 'none',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {label} <SortIcon field={field} />
      </span>
    </th>
  );

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--bg-stroke)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--bg-elevated)' }}>
            <Th label="Asset" field="asset_id" />
            <Th label="Type" field="asset_type" />
            <Th label="Score" field="debt_score" />
            <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--text-secondary)', borderBottom: '1px solid var(--bg-stroke)' }}>
              Severity
            </th>
            <Th label="Experts" field="expert_count" />
            <Th label="Items" field="item_count" />
            <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'var(--text-secondary)', borderBottom: '1px solid var(--bg-stroke)' }}>
              Last Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((asset) => (
            <tr
              key={asset.asset_id}
              onClick={() => openAssetDrawer(asset.asset_id)}
              style={{
                cursor: 'pointer',
                borderBottom: '1px solid var(--bg-stroke)',
                transition: 'background 0.12s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <td style={{ padding: '12px 14px' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px', fontWeight: 500,
                  color: 'var(--text-primary)',
                }}>
                  {asset.asset_id}
                </span>
              </td>
              <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {formatAssetType(asset.asset_type)}
              </td>
              <td style={{ padding: '12px 14px' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '15px', fontWeight: 700,
                  color: asset.severity === 'CRITICAL' ? 'var(--debt-crit)'
                       : asset.severity === 'WARNING'  ? 'var(--debt-warn)'
                       : 'var(--debt-ok)',
                }}>
                  {asset.debt_score}
                </span>
              </td>
              <td style={{ padding: '12px 14px' }}>
                <DebtBadge severity={asset.severity} />
              </td>
              <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {asset.expert_count}
                  {asset.expert_count === 1 && (
                    <AlertTriangle size={12} color="var(--debt-warn)" />
                  )}
                </span>
              </td>
              <td style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                {asset.item_count}
              </td>
              <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                {formatRelativeTime(asset.last_updated)}
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={7} style={{
                padding: '48px', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '14px',
              }}>
                No assets found. Upload documents to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
