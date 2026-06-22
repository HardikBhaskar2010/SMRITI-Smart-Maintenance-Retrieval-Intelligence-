interface TagChipProps {
  tag: string;
  variant?: 'default' | 'new';
}

export function TagChip({ tag, variant = 'default' }: TagChipProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: variant === 'new' ? 'rgba(0,201,167,0.12)' : 'var(--bg-elevated)',
      border: `1px solid ${variant === 'new' ? 'var(--accent-teal)' : 'var(--bg-stroke)'}`,
      borderRadius: '999px',
      padding: '3px 10px',
      fontSize: '12px', fontWeight: 500,
      fontFamily: 'JetBrains Mono, monospace',
      color: variant === 'new' ? 'var(--accent-teal)' : 'var(--text-secondary)',
    }}>
      {tag}
    </span>
  );
}
