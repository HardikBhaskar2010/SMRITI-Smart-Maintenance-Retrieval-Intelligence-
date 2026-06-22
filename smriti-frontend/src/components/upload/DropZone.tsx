import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { useIngestion } from '@/hooks/useIngestion';
import { TagChip } from './TagChip';
import { useUIStore } from '@/stores/uiStore';

const ACCEPTED = ['.pdf', '.docx', '.png', '.jpg', '.jpeg'];

export function DropZone() {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { progress, result, isUploading, error, uploadFile, reset } = useIngestion();
  const addToast = useUIStore((s) => s.addToast);

  const handleFile = useCallback(async (file: File) => {
    setSelectedFile(file);
    try {
      await uploadFile(file);
      addToast({ variant: 'success', message: `Document ingested successfully: ${file.name}` });
    } catch {
      addToast({ variant: 'error', message: error ?? 'Ingestion failed.' });
    }
  }, [uploadFile, addToast, error]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const stageLabel: Record<string, string> = {
    extracting: 'Extracting text from document...',
    tagging:    'Identifying equipment tags with AI...',
    embedding:  'Embedding knowledge into asset threads...',
    done:       'Ingestion complete!',
    error:      'Error during ingestion',
  };

  const showProgress = isUploading || (progress && progress.stage !== 'done');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Drop zone */}
      {!showProgress && !result && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent-teal)' : 'var(--bg-stroke)'}`,
            borderRadius: 'var(--radius-xl)',
            padding: '48px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
            cursor: 'pointer',
            background: dragging ? 'var(--accent-teal-dim)' : 'var(--bg-surface)',
            transition: 'border-color 0.2s ease, background 0.2s ease',
          }}
        >
          <Upload size={36} color={dragging ? 'var(--accent-teal)' : 'var(--text-muted)'} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Drop document here, or click to browse
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Supports PDF, DOCX, PNG, JPG · Max 50MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(',')}
            onChange={onInputChange}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {/* Progress panel */}
      <AnimatePresence>
        {showProgress && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-stroke)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <FileText size={20} color="var(--accent-teal)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile?.name}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--accent-teal)' }}>
                  {progress ? stageLabel[progress.stage] ?? progress.stage : 'Processing...'}
                </p>
              </div>
            </div>

            {/* Indeterminate progress bar */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'var(--accent-teal)',
                borderRadius: '4px',
                animation: 'shimmer 1.4s ease-in-out infinite',
                backgroundSize: '400px 100%',
                background: 'linear-gradient(90deg, var(--accent-teal-dim) 25%, var(--accent-teal) 50%, var(--accent-teal-dim) 75%)',
              }} />
            </div>

            {/* Detected tags */}
            {progress?.tags_found && progress.tags_found.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Equipment tags detected
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {progress.tags_found.map((tag) => (
                    <TagChip key={tag} tag={tag} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result panel */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={20} color="var(--debt-ok)" />
                <div>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Ingestion Complete
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {result.total_items_added} items added · {result.duration_seconds}s
                  </p>
                </div>
              </div>
              <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
              {result.tags_created.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>New threads</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {result.tags_created.map((t) => <TagChip key={t} tag={t} variant="new" />)}
                  </div>
                </div>
              )}
              {result.tags_updated.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Updated threads</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {result.tags_updated.map((t) => <TagChip key={t} tag={t} />)}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
