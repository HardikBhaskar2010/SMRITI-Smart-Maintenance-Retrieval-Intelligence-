import { Search } from 'lucide-react';
import { VoiceQueryBar } from '@/components/query/VoiceQueryBar';
import { QueryResult } from '@/components/query/QueryResult';
import { useQueryStore } from '@/stores/queryStore';
import { submitQuery } from '@/api/query';
import { useUIStore } from '@/stores/uiStore';

const SAMPLE_QUERIES = [
  'UPS-01 mein last month kya issues aaye?',
  'T-101 ka maintenance history kya hai?',
  'Which assets have single expert dependency?',
  'What was the last incident on Pump P-207?',
];

export function QueryPage() {
  const { lastResult, isQuerying, setLastResult, setIsQuerying, pushHistory, history } = useQueryStore();
  const addToast = useUIStore((s) => s.addToast);

  const handleQuery = async (query: string) => {
    if (!query.trim()) return;
    setIsQuerying(true);
    pushHistory(query);
    try {
      const result = await submitQuery({ query });
      setLastResult(result);
    } catch (err: any) {
      addToast({ variant: 'error', message: err?.message ?? 'Query failed. Is the backend running?' });
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Search size={20} color="var(--accent-teal)" />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Asset Query
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Ask anything in English, Hindi, or Hinglish — voice or text
        </p>
      </div>

      {/* Query bar */}
      <div style={{ marginBottom: '24px' }}>
        <VoiceQueryBar onSubmit={handleQuery} loading={isQuerying} />
      </div>

      {/* Sample queries */}
      {!lastResult && !isQuerying && (
        <div style={{ marginBottom: '28px' }}>
          <p style={{
            margin: '0 0 10px',
            fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Try these queries
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {SAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => handleQuery(q)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-stroke)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 14px',
                  fontSize: '13px', color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease, color 0.12s ease, border-color 0.12s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = 'var(--accent-teal-dim)';
                  el.style.color = 'var(--accent-teal)';
                  el.style.borderColor = 'var(--accent-teal)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = 'var(--bg-elevated)';
                  el.style.color = 'var(--text-secondary)';
                  el.style.borderColor = 'var(--bg-stroke)';
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent queries */}
      {history.length > 0 && !lastResult && !isQuerying && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{
            margin: '0 0 10px',
            fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Recent
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {history.slice(0, 5).map((q) => (
              <button
                key={q}
                onClick={() => handleQuery(q)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', padding: '6px 4px',
                  fontSize: '13px', color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--bg-stroke)',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      <QueryResult result={lastResult} loading={isQuerying} />
    </div>
  );
}
