import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { useGuruSession } from '@/hooks/useGuruSession';
import { GuruMessage } from './GuruMessage';
import { GuruProgress } from './GuruProgress';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

function getSeverity(score: number) {
  if (score <= 40) return 'OK' as const;
  if (score <= 70) return 'WARNING' as const;
  return 'CRITICAL' as const;
}

export function GuruPanel() {
  const {
    session, isSubmitting, expertAnswer, setExpertAnswer,
    displayedDebtScore, submitAnswer, endSession,
  } = useGuruSession();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages?.length]);

  if (!session) return null;

  const lastMessage = session.messages[session.messages.length - 1];
  const isWaitingForExpert = lastMessage?.role === 'interviewer';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 600,
          padding: '16px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            width: '100%', maxWidth: '700px',
            maxHeight: '90vh',
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-stroke)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--bg-stroke)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Guru Mode
                <span style={{ color: 'var(--accent-teal)', marginLeft: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }}>
                  {session.asset_id}
                </span>
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Expert: {session.expert_name}
              </p>
            </div>
            <button
              onClick={endSession}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: '6px',
                borderRadius: '6px', display: 'flex', alignItems: 'center',
              }}
              aria-label="End Guru Mode session"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--bg-stroke)', flexShrink: 0 }}>
            <GuruProgress
              questionsAsked={session.questions_asked}
              initialScore={session.initial_debt_score}
              currentScore={displayedDebtScore}
              severity={getSeverity(displayedDebtScore)}
              knowledgeAdded={session.knowledge_added}
            />
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {session.messages.map((msg, i) => (
              <GuruMessage key={i} message={msg} index={i} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Answer input */}
          {isWaitingForExpert && session.status === 'active' && (
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--bg-stroke)',
              flexShrink: 0,
            }}>
              <textarea
                value={expertAnswer}
                onChange={(e) => setExpertAnswer(e.target.value)}
                placeholder="Share your expertise... (Press Ctrl+Enter to submit)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) submitAnswer();
                }}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-stroke)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  padding: '12px 14px',
                  outline: 'none',
                  resize: 'none',
                  minHeight: '100px',
                  lineHeight: '1.6',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <Button
                  variant="primary"
                  onClick={submitAnswer}
                  loading={isSubmitting}
                  disabled={!expertAnswer.trim()}
                  icon={<Send size={14} />}
                >
                  Submit Answer
                </Button>
              </div>
            </div>
          )}

          {session.status === 'completed' && (
            <div style={{
              padding: '20px 24px', textAlign: 'center',
              borderTop: '1px solid var(--bg-stroke)',
              flexShrink: 0,
            }}>
              <p style={{ margin: '0 0 12px', color: 'var(--debt-ok)', fontSize: '15px', fontWeight: 600 }}>
                ✓ Session Complete — Knowledge preserved!
              </p>
              <Button variant="secondary" onClick={endSession}>Close</Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
