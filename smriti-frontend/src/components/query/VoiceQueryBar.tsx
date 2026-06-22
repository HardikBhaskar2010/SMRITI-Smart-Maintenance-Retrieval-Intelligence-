import { useRef, useState, type FormEvent } from 'react';
import { Mic, MicOff, Send, X } from 'lucide-react';
import { useVoice } from '@/hooks/useVoice';

interface VoiceQueryBarProps {
  onSubmit: (query: string) => void;
  loading?: boolean;
}

export function VoiceQueryBar({ onSubmit, loading }: VoiceQueryBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');

  const { status, transcript, startListening, stopListening, isSupported } =
    useVoice({
      language: 'hi-IN',
      silenceMs: 1500,
      onResult: (t) => {
        setInputValue(t);
        onSubmit(t);
      },
    });

  const isListening = status === 'listening';

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const q = inputValue.trim();
    if (!q || loading) return;
    onSubmit(q);
  };

  const handleMic = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const placeholderText =
    status === 'listening' ? 'Listening...' :
    status === 'error'     ? 'Microphone error. Type your query.' :
    'Ask anything about any asset... (try "UPS-01 mein last month kya issues aaye?")';

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', width: '100%' }}>
      {/* Main input */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
        {/* Waveform bars when listening */}
        {isListening && (
          <div style={{
            position: 'absolute', left: '14px',
            display: 'flex', alignItems: 'center', gap: '3px', zIndex: 1,
          }}>
            {[1,2,3,4,5].map((i) => (
              <div key={i} style={{
                width: '3px', borderRadius: '2px',
                background: 'var(--debt-crit)',
                animation: `waveBar${i} 0.6s ease-in-out infinite`,
                animationDelay: `${(i - 1) * 0.08}s`,
                height: '12px',
              }} />
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(); }}
          placeholder={placeholderText}
          disabled={loading}
          aria-label="Query input"
          style={{
            flex: 1, width: '100%',
            background: 'var(--bg-elevated)',
            border: `1px solid ${isListening ? 'var(--debt-crit)' : 'var(--bg-stroke)'}`,
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '15px',
            fontFamily: 'Inter, sans-serif',
            padding: `14px ${inputValue ? '42px' : '14px'} 14px ${isListening ? '60px' : '14px'}`,
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            boxShadow: isListening ? '0 0 0 3px rgba(239,68,68,0.15)' : undefined,
          }}
          onFocus={(e) => {
            if (!isListening) {
              e.currentTarget.style.borderColor = 'var(--accent-teal)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-teal-glow)';
            }
          }}
          onBlur={(e) => {
            if (!isListening) {
              e.currentTarget.style.borderColor = 'var(--bg-stroke)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        />

        {inputValue && (
          <button type="button" onClick={() => setInputValue('')} style={{
            position: 'absolute', right: '12px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '4px',
            display: 'flex', alignItems: 'center',
          }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Mic button */}
      {isSupported && (
        <button
          type="button"
          onClick={handleMic}
          aria-label={isListening ? 'Recording in progress' : 'Start voice input'}
          style={{
            width: '48px', height: '48px',
            borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
            background: isListening ? 'var(--debt-crit)' : 'var(--bg-elevated)',
            color: isListening ? '#fff' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s ease, color 0.2s ease',
            flexShrink: 0,
            animation: isListening ? 'micPulse 0.8s ease-in-out infinite' : undefined,
          }}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!inputValue.trim() || loading}
        aria-label="Submit query"
        style={{
          width: '48px', height: '48px',
          borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
          background: 'var(--accent-teal)', color: '#0D0F14',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s ease, opacity 0.15s ease',
          flexShrink: 0,
          opacity: (!inputValue.trim() || loading) ? 0.45 : 1,
        }}
      >
        <Send size={18} />
      </button>
    </form>
  );
}
