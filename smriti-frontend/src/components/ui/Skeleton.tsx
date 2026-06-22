interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '16px', radius = '6px', className = '' }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-stroke) 50%, var(--bg-elevated) 75%)',
        backgroundSize: '400px 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--bg-stroke)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton width={120} height={18} />
        <Skeleton width={70} height={22} radius="999px" />
      </div>
      <Skeleton width="80%" height={14} />
      <Skeleton width="100%" height={8} radius="4px" />
      <div style={{ display: 'flex', gap: '8px' }}>
        <Skeleton width={80} height={12} />
        <Skeleton width={80} height={12} />
        <Skeleton width={80} height={12} />
      </div>
    </div>
  );
}
