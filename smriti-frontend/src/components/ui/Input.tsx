import type { InputHTMLAttributes } from 'react';
import type { ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {leftIcon && (
          <span style={{
            position: 'absolute', left: '12px',
            color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
          }}>
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={className}
          style={{
            width: '100%',
            background: 'var(--bg-elevated)',
            border: `1px solid ${error ? 'var(--debt-crit)' : 'var(--bg-stroke)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
            padding: `10px ${rightIcon ? '40px' : '14px'} 10px ${leftIcon ? '40px' : '14px'}`,
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-teal)';
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-teal-glow)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--debt-crit)' : 'var(--bg-stroke)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          {...props}
        />
        {rightIcon && (
          <span style={{
            position: 'absolute', right: '12px',
            color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
          }}>
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--debt-crit)' }}>{error}</span>
      )}
    </div>
  );
}
