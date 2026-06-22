import { useState } from 'react';
import type { Severity } from '@/api/types';

interface GraphControlsProps {
  onFilterChange: (filter: Severity | 'ALL') => void;
  onReset: () => void;
  currentFilter: Severity | 'ALL';
}

export function GraphControls({ onFilterChange, onReset, currentFilter }: GraphControlsProps) {
  const filters: Array<{ value: Severity | 'ALL'; label: string; color: string }> = [
    { value: 'ALL', label: 'All', color: 'var(--text-secondary)' },
    { value: 'CRITICAL', label: 'Critical', color: 'var(--debt-crit)' },
    { value: 'WARNING', label: 'Warning', color: 'var(--debt-warn)' },
    { value: 'OK', label: 'OK', color: 'var(--debt-ok)' },
  ];

  return (
    <div style={{
      position: 'absolute', bottom: '24px', left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: '8px',
      background: 'rgba(19,22,30,0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--bg-stroke)',
      borderRadius: '999px',
      padding: '8px 16px',
      zIndex: 10,
    }}>
      {/* Filter buttons */}
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilterChange(f.value)}
          style={{
            background: currentFilter === f.value ? `${f.color}20` : 'transparent',
            border: `1px solid ${currentFilter === f.value ? f.color : 'transparent'}`,
            borderRadius: '999px',
            padding: '4px 12px',
            fontSize: '12px', fontWeight: 600,
            color: currentFilter === f.value ? f.color : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {f.label}
        </button>
      ))}

      {/* Divider */}
      <div style={{ width: '1px', height: '16px', background: 'var(--bg-stroke)' }} />

      {/* Legend */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {[
          { color: 'var(--debt-crit)', label: 'CRITICAL' },
          { color: 'var(--debt-warn)', label: 'WARNING' },
          { color: 'var(--debt-ok)',   label: 'OK' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '16px', background: 'var(--bg-stroke)' }} />

      {/* Reset */}
      <button
        onClick={onReset}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500,
          padding: '4px 8px',
        }}
      >
        Reset View
      </button>
    </div>
  );
}
