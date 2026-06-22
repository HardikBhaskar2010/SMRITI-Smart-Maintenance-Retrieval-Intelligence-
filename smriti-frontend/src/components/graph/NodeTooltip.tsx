import { Html } from '@react-three/drei';
import type { GraphNode } from '@/api/types';
import { DebtBadge } from '@/components/debt/DebtBadge';
import { debtScoreColor } from '@/utils/debtColor';

interface NodeTooltipProps {
  node: GraphNode;
  position: [number, number, number];
}

export function NodeTooltip({ node, position }: NodeTooltipProps) {
  const color = debtScoreColor(node.debt_score);

  return (
    <Html
      position={position}
      center
      distanceFactor={8}
      style={{ pointerEvents: 'none' }}
    >
      <div style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${color}50`,
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        minWidth: '160px',
        boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 0 1px ${color}20`,
        backdropFilter: 'blur(8px)',
        pointerEvents: 'none',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
          {node.label}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          {node.asset_type.replace(/_/g, ' ')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '20px', fontWeight: 700, color }}>
            {node.debt_score}
          </span>
          <DebtBadge severity={node.severity} size="sm" />
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {node.item_count} knowledge items
        </div>
      </div>
    </Html>
  );
}
