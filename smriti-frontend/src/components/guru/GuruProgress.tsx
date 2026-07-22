import { DebtRing } from '@/components/debt/DebtRing';
import type { Severity } from '@/api/types';

interface GuruProgressProps {
  questionsAsked: number;
  totalQuestions?: number;
  initialScore: number;
  currentScore: number;
  knowledgeAdded: number;
}

function getSeverity(score: number): Severity {
  if (score <= 40) return 'OK';
  if (score <= 70) return 'WARNING';
  return 'CRITICAL';
}

export function GuruProgress({
  questionsAsked,
  totalQuestions = 8,
  initialScore,
  currentScore,
  knowledgeAdded,
}: GuruProgressProps) {
  const progress = Math.min(questionsAsked / totalQuestions, 1);
  const delta = initialScore - currentScore;
  const currentSeverity = getSeverity(currentScore);

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--bg-stroke)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      {/* Score transition */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Before</p>
            <DebtRing score={initialScore} severity={getSeverity(initialScore)} size="sm" animate={false} />
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '18px' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '10px', color: 'var(--debt-ok)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Now</p>
            <DebtRing score={currentScore} severity={currentSeverity} size="sm" />
          </div>
        </div>

        {/* Delta */}
        {delta > 0 && (
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            textAlign: 'center',
          }}>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '20px', fontWeight: 700,
              color: 'var(--debt-ok)',
            }}>
              -{delta}
            </span>
            <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--debt-ok)' }}>pts reduced</p>
          </div>
        )}
      </div>

      {/* Q&A progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Question {Math.min(questionsAsked, totalQuestions)} of {totalQuestions}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--accent-teal)' }}>
            {knowledgeAdded} items added
          </span>
        </div>
        <div style={{ background: 'var(--bg-surface)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
          <div style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent-teal), #6366F1)',
            borderRadius: '4px',
            transition: 'width 0.4s ease-out',
          }} />
        </div>
      </div>
    </div>
  );
}
