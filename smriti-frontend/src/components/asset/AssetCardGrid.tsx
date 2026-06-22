import type { AssetSummary } from '@/api/types';
import { AssetCard } from './AssetCard';

interface AssetCardGridProps {
  assets: AssetSummary[];
  onInterviewExpert?: (assetId: string) => void;
}

export function AssetCardGrid({ assets, onInterviewExpert }: AssetCardGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '16px',
    }}>
      {assets.map((asset, i) => (
        <AssetCard
          key={asset.asset_id}
          asset={asset}
          index={i}
          onInterviewExpert={onInterviewExpert}
        />
      ))}
    </div>
  );
}
