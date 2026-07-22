import type { LucideIcon } from 'lucide-react';
import { FileSearch } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = FileSearch, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center',
      padding: '64px 32px', gap: '16px',
    }}>
      <div style={{
        width: '72px', height: '72px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--bg-stroke)',
        borderRadius: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={32} color="var(--text-muted)" />
      </div>
      <div>
        <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {title}
        </p>
        {description && (
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '320px' }}>
            {description}
          </p>
        )}
      </div>
      {action && action}
    </div>
  );
}
