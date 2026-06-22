import { useEffect, useRef } from 'react';
import type { Severity } from '@/api/types';
import { debtScoreColor } from '@/utils/debtColor';

interface DebtRingProps {
  score: number;
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const SIZES = {
  sm: { r: 22, cx: 28, viewBox: '0 0 56 56', strokeWidth: 4, fontSize: '13px', labelSize: '9px' },
  md: { r: 40, cx: 48, viewBox: '0 0 96 96', strokeWidth: 6, fontSize: '22px', labelSize: '10px' },
  lg: { r: 60, cx: 72, viewBox: '0 0 144 144', strokeWidth: 8, fontSize: '32px', labelSize: '12px' },
};

export function DebtRing({ score, severity, size = 'md', animate = true }: DebtRingProps) {
  const { r, cx, viewBox, strokeWidth, fontSize, labelSize } = SIZES[size];
  const circumference = 2 * Math.PI * r;
  const targetOffset = circumference - (score / 100) * circumference;
  const color = debtScoreColor(score);
  const pathRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (!animate || !pathRef.current) return;
    const el = pathRef.current;
    el.style.strokeDashoffset = String(circumference);
    const raf = requestAnimationFrame(() => {
      el.style.transition = 'stroke-dashoffset 0.6s ease-out';
      el.style.strokeDashoffset = String(targetOffset);
    });
    return () => cancelAnimationFrame(raf);
  }, [score, circumference, targetOffset, animate]);

  const isPulsing = severity === 'CRITICAL';

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      aria-label={`Knowledge Debt Score: ${score} out of 100, ${severity}`}
      role="img"
    >
      <svg viewBox={viewBox} width={cx * 2} height={cx * 2} style={{ display: 'block' }}>
        {/* Track */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="var(--bg-stroke)"
          strokeWidth={strokeWidth}
        />
        {/* Arc */}
        <circle
          ref={pathRef}
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : targetOffset}
          transform={`rotate(-90 ${cx} ${cx})`}
          style={
            isPulsing ? {
              animation: 'nodePulse 1.5s ease-in-out infinite',
              filter: `drop-shadow(0 0 6px ${color})`,
            } : {
              filter: `drop-shadow(0 0 3px ${color}40)`,
            }
          }
        />
      </svg>
      {/* Center text */}
      <div style={{
        position: 'absolute',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
        textAlign: 'center',
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize, fontWeight: 700,
          color,
          lineHeight: 1,
        }}>
          {score}
        </span>
        <span style={{
          fontSize: labelSize,
          fontWeight: 600,
          color,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {severity}
        </span>
      </div>
    </div>
  );
}
