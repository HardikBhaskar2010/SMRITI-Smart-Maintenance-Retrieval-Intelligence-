import { useState, useRef, useCallback } from 'react';
import type { QueryRequest } from '@/api/types';

interface StreamingState {
  text: string;
  isStreaming: boolean;
  isDone: boolean;
  error: string | null;
}

export function useStreamingQuery() {
  const [state, setState] = useState<StreamingState>({
    text: '',
    isStreaming: false,
    isDone: false,
    error: null,
  });
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const cancel = useCallback(() => {
    readerRef.current?.cancel();
    setState((s) => ({ ...s, isStreaming: false }));
  }, []);

  const streamQuery = useCallback(async (req: QueryRequest) => {
    setState({ text: '', isStreaming: true, isDone: false, error: null });
    try {
      const response = await fetch('/api/query/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') {
            setState((s) => ({ ...s, isStreaming: false, isDone: true }));
            return;
          }
          if (data.startsWith('[ERROR]')) {
            setState((s) => ({ ...s, isStreaming: false, error: data.slice(7).trim() }));
            return;
          }
          // Unescape newlines
          const token = data.replace(/\\n/g, '\n');
          setState((s) => ({ ...s, text: s.text + token }));
        }
      }
      setState((s) => ({ ...s, isStreaming: false, isDone: true }));
    } catch (err: any) {
      setState((s) => ({
        ...s, isStreaming: false, error: err.message ?? 'Stream failed',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({ text: '', isStreaming: false, isDone: false, error: null });
  }, [cancel]);

  return { ...state, streamQuery, cancel, reset };
}
