import { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { Severity } from '@/api/types';
import { useGraphData } from '@/hooks/useGraphData';
import { useUIStore } from '@/stores/uiStore';
import { AssetNode } from './AssetNode';
import { AssetEdge } from './AssetEdge';
import { NodeTooltip } from './NodeTooltip';
import { GraphControls } from './GraphControls';
import { Spinner } from '@/components/ui/Spinner';

/** Distribute nodes in a sphere layout */
function sphereLayout(count: number, radius: number = 6): Array<[number, number, number]> {
  const positions: Array<[number, number, number]> = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < count; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    positions.push([
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
    ]);
  }
  return positions;
}

export function KnowledgeGraph() {
  const { data, isLoading } = useGraphData();
  const [filter, setFilter] = useState<Severity | 'ALL'>('ALL');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const openAssetDrawer = useUIStore((s) => s.openAssetDrawer);
  const orbitRef = useRef<any>(null);

  if (isLoading) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '12px',
      }}>
        <Spinner size={32} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading knowledge graph...</p>
      </div>
    );
  }

  const nodes = data?.nodes ?? [];
  const edges = data?.edges ?? [];

  const filteredNodes = filter === 'ALL' ? nodes : nodes.filter((n) => n.severity === filter);
  const positions = sphereLayout(filteredNodes.length);
  const positionMap = new Map(filteredNodes.map((n, i) => [n.id, positions[i]]));

  const hoveredNode = filteredNodes.find((n) => n.id === hoveredId);
  const hoveredPos = hoveredId ? positionMap.get(hoveredId) : undefined;

  const handleReset = () => {
    orbitRef.current?.reset();
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 14], fov: 55 }}
        gl={{ antialias: true }}
        style={{ background: '#0D0F14' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00C9A7" />
        <Stars radius={60} depth={50} count={2000} factor={4} saturation={0} fade />

        <OrbitControls
          ref={orbitRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={5}
          maxDistance={30}
        />

        <Suspense fallback={null}>
          {/* Edges */}
          {edges.map((edge) => {
            const sp = positionMap.get(edge.source);
            const tp = positionMap.get(edge.target);
            if (!sp || !tp) return null;
            return (
              <AssetEdge
                key={`${edge.source}-${edge.target}`}
                edge={edge}
                sourcePosition={sp}
                targetPosition={tp}
              />
            );
          })}

          {/* Nodes */}
          {filteredNodes.map((node) => {
            const pos = positionMap.get(node.id);
            if (!pos) return null;
            return (
              <AssetNode
                key={node.id}
                node={node}
                position={pos}
                onHover={setHoveredId}
                onClick={openAssetDrawer}
                isHovered={hoveredId === node.id}
              />
            );
          })}

          {/* Tooltip */}
          {hoveredNode && hoveredPos && (
            <NodeTooltip
              node={hoveredNode}
              position={[hoveredPos[0], hoveredPos[1] + 1.5, hoveredPos[2]]}
            />
          )}
        </Suspense>
      </Canvas>

      <GraphControls
        currentFilter={filter}
        onFilterChange={setFilter}
        onReset={handleReset}
      />

      {/* Empty state */}
      {filteredNodes.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          color: 'var(--text-muted)', gap: '8px',
        }}>
          <p style={{ fontSize: '16px', fontWeight: 500 }}>No assets in graph yet</p>
          <p style={{ fontSize: '13px' }}>Upload documents to populate the knowledge graph</p>
        </div>
      )}
    </div>
  );
}
