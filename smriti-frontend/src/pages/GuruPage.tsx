import { useState } from 'react';
import { Brain } from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { DebtTable } from '@/components/debt/DebtTable';
import { GuruPanel } from '@/components/guru/GuruPanel';
import { GuruStartModal } from '@/components/guru/GuruStartModal';
import { Button } from '@/components/ui/Button';
import { useGuruSession } from '@/hooks/useGuruSession';
import { SkeletonCard } from '@/components/ui/Skeleton';

export function GuruPage() {
  const { data: assets = [], isLoading } = useAssets();
  const [guruModalOpen, setGuruModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>();
  const { session, isStarting, startSession } = useGuruSession();

  const riskAssets = [...assets].sort((a, b) => b.debt_score - a.debt_score);

  const handleGuruStart = async (assetId: string, expertName: string) => {
    await startSession(assetId, expertName);
    setGuruModalOpen(false);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px', width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: '28px', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Brain size={20} color="var(--accent-teal)" />
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Guru Mode
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            AI-powered structured knowledge capture before experts leave
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Brain size={14} />}
          onClick={() => { setSelectedAssetId(undefined); setGuruModalOpen(true); }}
          size="md"
        >
          Start Interview
        </Button>
      </div>

      {/* Explainer banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,201,167,0.06), rgba(99,102,241,0.06))',
        border: '1px solid rgba(0,201,167,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex', gap: '16px', alignItems: 'flex-start',
      }}>
        <Brain size={24} color="var(--accent-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            How Guru Mode works
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Select a high-risk asset below. SMRITI generates 8 targeted interview questions based on knowledge gaps in that asset's thread.
            As the expert answers, each response is embedded into the knowledge thread — and the Debt Score updates live.
          </p>
        </div>
      </div>

      {/* Asset risk table */}
      <h2 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
        Select asset to interview
      </h2>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <DebtTable assets={riskAssets} />
          {/* Overlay click on table rows → open guru modal */}
        </div>
      )}

      {/* Guru Mode Session */}
      <GuruStartModal
        open={guruModalOpen}
        onClose={() => setGuruModalOpen(false)}
        onStart={handleGuruStart}
        loading={isStarting}
        preSelectedAssetId={selectedAssetId}
      />
      {session && <GuruPanel />}
    </div>
  );
}
