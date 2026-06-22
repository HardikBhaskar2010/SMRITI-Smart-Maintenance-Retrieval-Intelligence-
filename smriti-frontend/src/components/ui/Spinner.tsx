import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 20, color = 'var(--accent-teal)' }: SpinnerProps) {
  return (
    <Loader2
      size={size}
      color={color}
      style={{ animation: 'spin 0.8s linear infinite' }}
    />
  );
}
