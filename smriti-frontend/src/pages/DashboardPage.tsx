import { useState } from 'react';
import { LayoutDashboard, Table2, LayoutGrid } from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { DebtSummaryBar } from '@/components/debt/DebtSummaryBar';
import { DebtTable } from '@/components/debt/DebtTable';
import { AssetCardGrid } from '@/components/asset/AssetCardGrid';
import { AssetDrawer } from '@/components/asset/AssetDrawer';
import { GuruPanel } from '@/components/guru/GuruPanel';
import { GuruStartModal } from '@/components/guru/GuruStartModal';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useGuruSession } from '@/hooks/useGuruSession';

type ViewMode = 'grid' | 'table';

export function DashboardPage() {
  const { data: assets = [], isLoading } = useAssets();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [guruModalOpen, setGuruModalOpen] = useState(false);
  const [selectedForGuru, setSelectedForGuru] = useState<string | undefined>();
  const { session, isStarting, startSession } = useGuruSession();

  const handleInterviewExpert = (assetId: string) => {
    setSelectedForGuru(assetId);
    setGuruModalOpen(true);
  };

  const handleGuruStart = async (assetId: string, expertName: string) => {
    await startSession(assetId, expertName);
    setGuruModalOpen(false);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', width: '100%' }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <LayoutDashboard size={20} color="var(--accent-teal)" />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Knowledge Debt Dashboard
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Real-time per-asset knowledge risk assessment
        </p>
      </div>

      {/* Summary counts */}
      <div style={{ marginBottom: '28px' }}>
        <DebtSummaryBar />
      </div>

      {/* View toggle + controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          {assets.length} assets · sorted by debt score
        </p>
        <div style={{
          display: 'flex', gap: '4px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-stroke)',
          borderRadius: 'var(--radius-md)',
          padding: '3px',
        }}>
          {([['grid', LayoutGrid, 'Switch to grid view'], ['table', Table2, 'Switch to table view']] as const).map(([mode, Icon, label]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              aria-label={label}
              style={{
                background: viewMode === mode ? 'var(--bg-surface)' : 'transparent',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                padding: '6px 10px', display: 'flex', alignItems: 'center',
                color: viewMode === mode ? 'var(--accent-teal)' : 'var(--text-muted)',
                transition: 'background 0.12s ease, color 0.12s ease',
              }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : viewMode === 'grid' ? (
        <AssetCardGrid assets={assets} onInterviewExpert={handleInterviewExpert} />
      ) : (
        <DebtTable assets={assets} />
      )}

      {/* Asset detail drawer */}
      <AssetDrawer />

      {/* Guru Mode */}
      <GuruStartModal
        open={guruModalOpen}
        onClose={() => setGuruModalOpen(false)}
        onStart={handleGuruStart}
        loading={isStarting}
        preSelectedAssetId={selectedForGuru}
      />
      {session && <GuruPanel />}
    </div>
  );
}
