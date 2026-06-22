import { useState } from 'react';
import { Brain } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAssetStore } from '@/stores/assetStore';

interface GuruStartModalProps {
  open: boolean;
  onClose: () => void;
  onStart: (assetId: string, expertName: string) => void;
  loading?: boolean;
  preSelectedAssetId?: string;
}

export function GuruStartModal({ open, onClose, onStart, loading, preSelectedAssetId }: GuruStartModalProps) {
  const [assetId, setAssetId] = useState(preSelectedAssetId ?? '');
  const [expertName, setExpertName] = useState('');
  const assets = useAssetStore((s) => s.assets);
  const criticalAssets = assets.filter((a) => a.severity === 'CRITICAL' || a.severity === 'WARNING');

  const handleStart = () => {
    if (!assetId.trim() || !expertName.trim()) return;
    onStart(assetId.trim(), expertName.trim());
  };

  return (
    <Modal open={open} onClose={onClose} title="Start Guru Mode Interview">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 16px',
          background: 'rgba(0,201,167,0.06)',
          border: '1px solid rgba(0,201,167,0.2)',
          borderRadius: 'var(--radius-md)',
        }}>
          <Brain size={20} color="var(--accent-teal)" />
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            SMRITI will conduct a structured AI interview to capture tacit knowledge and reduce the Knowledge Debt Score for the selected asset.
          </p>
        </div>

        {/* Asset ID */}
        <div>
          <Input
            label="Asset ID"
            id="guru-asset-id"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="e.g. T-101"
          />
          {/* Quick-select critical assets */}
          {criticalAssets.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                High-risk assets
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {criticalAssets.map((a) => (
                  <button
                    key={a.asset_id}
                    onClick={() => setAssetId(a.asset_id)}
                    style={{
                      background: assetId === a.asset_id ? 'var(--accent-teal-dim)' : 'var(--bg-elevated)',
                      border: `1px solid ${assetId === a.asset_id ? 'var(--accent-teal)' : 'var(--bg-stroke)'}`,
                      borderRadius: '999px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono, monospace',
                      color: assetId === a.asset_id ? 'var(--accent-teal)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {a.asset_id} ({a.debt_score})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expert name */}
        <Input
          label="Expert Name"
          id="guru-expert-name"
          value={expertName}
          onChange={(e) => setExpertName(e.target.value)}
          placeholder="e.g. Ramesh Kumar"
        />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleStart}
            loading={loading}
            disabled={!assetId.trim() || !expertName.trim()}
            icon={<Brain size={14} />}
          >
            Start Interview
          </Button>
        </div>
      </div>
    </Modal>
  );
}
