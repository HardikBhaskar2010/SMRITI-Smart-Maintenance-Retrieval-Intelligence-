import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAssetDetail } from '@/hooks/useAssets';
import { DebtRing } from '@/components/debt/DebtRing';
import { DebtBadge } from '@/components/debt/DebtBadge';
import { ThreadList } from './ThreadList';
import { Button } from '@/components/ui/Button';
import { formatAssetType, formatRelativeTime } from '@/utils/formatters';

export function AssetDrawer() {
  const selectedAssetId = useUIStore((s) => s.selectedAssetId);
  const closeAssetDrawer = useUIStore((s) => s.closeAssetDrawer);
  const { data: asset, isLoading, refetch } = useAssetDetail(selectedAssetId);

  return (
    <AnimatePresence>
      {selectedAssetId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAssetDrawer}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(2px)',
              zIndex: 500,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed', right: 0, top: 0, bottom: 0,
              width: 'min(440px, 100vw)',
              background: 'var(--bg-surface)',
              borderLeft: '1px solid var(--bg-stroke)',
              zIndex: 501,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
            role="dialog"
            aria-label={`Asset thread: ${selectedAssetId}`}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--bg-stroke)',
              display: 'flex', alignItems: 'center', gap: '16px',
              flexShrink: 0,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{
                  margin: 0, fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)',
                }}>
                  {selectedAssetId}
                </h2>
                {asset && (
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {formatAssetType(asset.asset_type ?? '')} · {asset.item_count} items · Updated {formatRelativeTime(asset.last_updated)}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={() => refetch()}>
                Refresh
              </Button>
              <button
                onClick={closeAssetDrawer}
                aria-label="Close asset drawer"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '6px',
                  borderRadius: '6px', display: 'flex', alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Debt score hero */}
            {asset && !isLoading && (
              <div style={{
                padding: '24px',
                borderBottom: '1px solid var(--bg-stroke)',
                display: 'flex', alignItems: 'center', gap: '24px',
                flexShrink: 0,
              }}>
                <DebtRing score={asset.debt_score} severity={asset.severity} size="md" />
                <div>
                  <DebtBadge severity={asset.severity} size="md" />
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Knowledge Debt Score: <strong style={{ color: 'var(--text-primary)' }}>{asset.debt_score}/100</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Thread items */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
              <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Knowledge Thread
              </p>
              <ThreadList
                items={asset?.thread_items ?? []}
                loading={isLoading}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
