import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import type { QueryResponse } from '@/api/types';
import { CitationChip } from './CitationChip';
import { formatResponseTime } from '@/utils/formatters';

interface QueryResultProps {
  result: QueryResponse | null;
  loading?: boolean;
}

export function QueryResult({ result, loading }: QueryResultProps) {
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '12px',
        padding: '24px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-stroke)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{
          height: '14px', borderRadius: '6px', width: '60%',
          background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-stroke) 50%, var(--bg-elevated) 75%)',
          backgroundSize: '400px 100%',
          animation: 'shimmer 1.4s ease-in-out infinite',
        }} />
        <div style={{
          height: '14px', borderRadius: '6px', width: '85%',
          background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-stroke) 50%, var(--bg-elevated) 75%)',
          backgroundSize: '400px 100%',
          animation: 'shimmer 1.4s ease-in-out infinite 0.1s',
        }} />
        <div style={{
          height: '14px', borderRadius: '6px', width: '70%',
          background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-stroke) 50%, var(--bg-elevated) 75%)',
          backgroundSize: '400px 100%',
          animation: 'shimmer 1.4s ease-in-out infinite 0.2s',
        }} />
      </div>
    );
  }

  if (!result) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={result.answer.slice(0, 20)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-stroke)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Answer header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--bg-stroke)',
          background: 'var(--bg-elevated)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} color="var(--accent-teal)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-teal)' }}>
              Thread: {result.asset_ids_used.join(', ')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <Clock size={11} />
            {formatResponseTime(result.response_time_ms)} · {result.thread_items_retrieved} items retrieved
          </div>
        </div>

        {/* Answer body */}
        <div style={{ padding: '20px' }}>
          <p style={{
            margin: 0,
            fontSize: '14px', lineHeight: '1.7',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
          }}>
            {result.answer}
          </p>

          {/* Citations */}
          {result.citations.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{
                margin: '0 0 8px',
                fontSize: '11px', fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Sources
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {result.citations.map((c, i) => (
                  <CitationChip key={c.item_id} citation={c} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
