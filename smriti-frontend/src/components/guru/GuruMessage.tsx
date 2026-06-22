import type { GuruMessage as GuruMessageType } from '@/api/types';

interface GuruMessageProps {
  message: GuruMessageType;
  index?: number;
}

const ROLE_CONFIG = {
  interviewer: {
    label: 'SMRITI',
    bg: 'var(--bg-elevated)',
    border: 'var(--accent-teal)',
    nameColor: 'var(--accent-teal)',
    align: 'flex-start' as const,
  },
  expert: {
    label: 'Expert',
    bg: 'rgba(99,102,241,0.08)',
    border: '#6366F1',
    nameColor: '#6366F1',
    align: 'flex-end' as const,
  },
  system: {
    label: 'System',
    bg: 'transparent',
    border: 'var(--bg-stroke)',
    nameColor: 'var(--text-muted)',
    align: 'center' as const,
  },
};

export function GuruMessage({ message, index = 0 }: GuruMessageProps) {
  const config = ROLE_CONFIG[message.role] ?? ROLE_CONFIG.system;

  if (message.role === 'system') {
    return (
      <div style={{ textAlign: 'center', padding: '8px', animation: `fadeIn 0.2s ease-out ${index * 40}ms both` }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: config.align,
        animation: `fadeInUp 0.2s ease-out ${index * 40}ms both`,
      }}
    >
      <div style={{ maxWidth: '80%' }}>
        <p style={{
          margin: '0 0 4px',
          fontSize: '11px', fontWeight: 600,
          color: config.nameColor,
          textAlign: message.role === 'expert' ? 'right' : 'left',
        }}>
          {config.label}
        </p>
        <div style={{
          background: config.bg,
          border: `1px solid ${config.border}30`,
          borderRadius: message.role === 'expert' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
          padding: '12px 16px',
        }}>
          <p style={{
            margin: 0, fontSize: '14px', lineHeight: '1.6',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
          }}>
            {message.content}
          </p>
        </div>
        {message.embedded && (
          <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'var(--debt-ok)', textAlign: message.role === 'expert' ? 'right' : 'left' }}>
            ✓ Knowledge embedded
          </p>
        )}
      </div>
    </div>
  );
}
