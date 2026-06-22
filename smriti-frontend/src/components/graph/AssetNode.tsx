import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import type { Mesh } from 'three';
import * as THREE from 'three';
import type { GraphNode } from '@/api/types';
import { debtScoreColor } from '@/utils/debtColor';

interface AssetNodeProps {
  node: GraphNode;
  position: [number, number, number];
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  isHovered: boolean;
}

export function AssetNode({ node, position, onHover, onClick, isHovered }: AssetNodeProps) {
  const meshRef = useRef<Mesh>(null);
  const isCritical = node.severity === 'CRITICAL';
  const color = debtScoreColor(node.debt_score);

  // Size: scale by item count (min 0.3, max 1.2)
  const size = 0.3 + Math.min(node.item_count / 150, 1) * 0.9;

  // Pulsing animation for CRITICAL nodes
  useFrame((state) => {
    if (!meshRef.current) return;
    const targetScale = isHovered ? 1.25 : 1.0;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    );
    if (isCritical) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.06 + 1;
      meshRef.current.scale.multiplyScalar(pulse);
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[size, 24, 24]}
        onClick={() => onClick(node.id)}
        onPointerEnter={() => onHover(node.id)}
        onPointerLeave={() => onHover(null)}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isCritical ? 0.6 : isHovered ? 0.4 : 0.2}
          roughness={0.3}
          metalness={0.2}
        />
      </Sphere>

      {/* Glow ring for CRITICAL */}
      {isCritical && (
        <Sphere args={[size * 1.4, 16, 16]}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </Sphere>
      )}
    </group>
  );
}
