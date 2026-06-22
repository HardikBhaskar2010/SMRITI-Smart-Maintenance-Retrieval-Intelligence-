import type { Severity } from '@/api/types';

/** Map severity string → CSS custom property color token */
export function debtColor(severity: Severity): string {
  switch (severity) {
    case 'CRITICAL': return 'var(--debt-crit)';
    case 'WARNING':  return 'var(--debt-warn)';
    case 'OK':       return 'var(--debt-ok)';
    default:         return 'var(--text-secondary)';
  }
}

/** Map debt score → hex color (interpolated for ring) */
export function debtScoreColor(score: number): string {
  if (score <= 40)  return '#22C55E'; // green
  if (score <= 70)  return '#F59E0B'; // amber
  return '#EF4444';                   // red
}

/** Map severity → CSS glow color for CRITICAL pulse */
export function debtGlowColor(severity: Severity): string {
  switch (severity) {
    case 'CRITICAL': return 'rgba(239, 68, 68, 0.3)';
    case 'WARNING':  return 'rgba(245, 158, 11, 0.2)';
    default:         return 'transparent';
  }
}
