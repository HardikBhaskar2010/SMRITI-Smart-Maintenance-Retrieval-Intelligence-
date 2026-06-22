import { Upload } from 'lucide-react';
import { DropZone } from '@/components/upload/DropZone';

const TIPS = [
  'PDF, DOCX, PNG, JPG supported',
  'AI extracts equipment tags automatically (UPS-01, T-101, etc.)',
  'Duplicate content is detected and skipped',
  'Knowledge threads update in real-time during upload',
];

export function UploadPage() {
  return (
    <div style={{ padding: '28px 32px', maxWidth: '800px', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Upload size={20} color="var(--accent-teal)" />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Upload Documents
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Drop maintenance manuals, work orders, inspection reports, and incident logs
        </p>
      </div>

      {/* Main drop zone */}
      <DropZone />

      {/* Tips */}
      <div style={{ marginTop: '32px' }}>
        <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          How it works
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {TIPS.map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{
                width: '20px', height: '20px', borderRadius: '50%',
                background: 'var(--accent-teal-dim)',
                border: '1px solid var(--accent-teal)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontSize: '11px', fontWeight: 700, color: 'var(--accent-teal)',
              }}>
                {i + 1}
              </span>
              <p style={{ margin: '1px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
