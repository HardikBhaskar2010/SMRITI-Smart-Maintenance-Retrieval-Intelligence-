import { Network } from 'lucide-react';
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph';
import { AssetDrawer } from '@/components/asset/AssetDrawer';

export function GraphPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Page header */}
      <div style={{ padding: '20px 32px 16px', borderBottom: '1px solid var(--bg-stroke)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
          <Network size={20} color="var(--accent-teal)" />
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
            3D Knowledge Graph
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
          Click a node to view asset thread · Drag to orbit · Scroll to zoom · CRITICAL nodes pulse red
        </p>
      </div>

      {/* Full-height 3D canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <KnowledgeGraph />
      </div>

      <AssetDrawer />
    </div>
  );
}
