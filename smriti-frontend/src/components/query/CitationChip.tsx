import { ExternalLink } from 'lucide-react';
import type { Citation } from '@/api/types';

interface CitationChipProps {
  citation: Citation;
  index: number;
}

export function CitationChip({ citation, index }: CitationChipProps) {
  const label = `${citation.source_document.split('/').pop()}${citation.source_page != null ? ` p.${citation.source_page}` : ''}`;
  return (
    <span
      title={`${citation.source_document} ${citation.source_section ?? ''}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-stroke)',
        borderRadius: '999px',
        padding: '3px 10px',
        fontSize: '11px', fontWeight: 500,
        color: 'var(--accent-teal)',
        cursor: 'default',
        transition: 'background 0.12s ease',
        maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--accent-teal-dim)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
      }}
    >
      [{index + 1}] {label}
      <ExternalLink size={10} style={{ flexShrink: 0 }} />
    </span>
  );
}
