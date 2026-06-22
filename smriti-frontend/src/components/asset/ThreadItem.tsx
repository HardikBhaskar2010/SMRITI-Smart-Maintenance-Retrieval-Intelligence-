import { FileText, ExternalLink } from 'lucide-react';
import type { ThreadItem as ThreadItemType } from '@/api/types';
import { formatDate, truncate } from '@/utils/formatters';

interface ThreadItemProps {
  item: ThreadItemType;
  index?: number;
}

export function ThreadItem({ item, index = 0 }: ThreadItemProps) {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-stroke)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        animation: `fadeInUp 0.2s ease-out ${index * 40}ms both`,
      }}
    >
      {/* Source header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <FileText size={13} color="var(--accent-teal)" style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.source_document}
            {item.source_page != null ? ` · p.${item.source_page}` : ''}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
          {formatDate(item.added_at)}
        </span>
      </div>

      {/* Section */}
      {item.source_section && (
        <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'var(--accent-teal)', fontWeight: 500 }}>
          {item.source_section}
        </p>
      )}

      {/* Content */}
      <p style={{
        margin: 0, fontSize: '13px', color: 'var(--text-primary)',
        lineHeight: '1.6',
      }}>
        {truncate(item.content, 200)}
      </p>

      {/* Footer tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        {item.expert_attributed && (
          <span style={{
            fontSize: '10px', fontWeight: 600, color: 'var(--accent-teal)',
            background: 'var(--accent-teal-dim)', borderRadius: '4px', padding: '2px 6px',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Expert
          </span>
        )}
        <span style={{
          fontSize: '10px', color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}>
          {item.added_by.replace(/_/g, ' ')}
        </span>
      </div>
    </div>
  );
}
