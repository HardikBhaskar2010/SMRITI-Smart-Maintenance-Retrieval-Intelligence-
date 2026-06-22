import { Line } from '@react-three/drei';
import type { GraphEdge } from '@/api/types';

interface AssetEdgeProps {
  edge: GraphEdge;
  sourcePosition: [number, number, number];
  targetPosition: [number, number, number];
}

export function AssetEdge({ sourcePosition, targetPosition }: AssetEdgeProps) {
  return (
    <Line
      points={[sourcePosition, targetPosition]}
      color="#252A38"
      lineWidth={1}
      transparent
      opacity={0.6}
    />
  );
}
