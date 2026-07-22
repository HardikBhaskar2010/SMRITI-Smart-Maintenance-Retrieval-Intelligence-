import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useGraphData } from '@/hooks/useGraphData'

function GraphNodes({ data }: { data: any }) {
  const group = useRef<THREE.Group>(null)

  // Memoize geometry and materials for performance
  const { nodeGeo, criticalMat, warningMat, okMat, lineMat } = useMemo(() => {
    return {
      nodeGeo: new THREE.SphereGeometry(1, 32, 32),
      criticalMat: new THREE.MeshStandardMaterial({ color: '#F74F4F', emissive: '#F74F4F', emissiveIntensity: 0.8, roughness: 0.2 }),
      warningMat: new THREE.MeshStandardMaterial({ color: '#F7A84F', emissive: '#F7A84F', emissiveIntensity: 0.5, roughness: 0.2 }),
      okMat: new THREE.MeshStandardMaterial({ color: '#4FF7A0', emissive: '#4FF7A0', emissiveIntensity: 0.2, roughness: 0.2 }),
      lineMat: new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 }),
    }
  }, [])

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  if (!data || !data.nodes) return null

  // Process nodes to 3D positions (simple sphere packing/random layout for demo)
  const nodes = data.nodes.map((n: any, i: number) => {
    const phi = Math.acos(-1 + (2 * i) / data.nodes.length)
    const theta = Math.sqrt(data.nodes.length * Math.PI) * phi
    const r = 15 // radius
    
    return {
      ...n,
      position: new THREE.Vector3(
        r * Math.cos(theta) * Math.sin(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(phi)
      )
    }
  })

  return (
    <group ref={group}>
      {nodes.map((node: any) => {
        const mat = node.severity === 'CRITICAL' ? criticalMat : node.severity === 'WARNING' ? warningMat : okMat
        const scale = node.severity === 'CRITICAL' ? 1.5 : 1
        
        return (
          <mesh key={node.id} position={node.position} geometry={nodeGeo} material={mat} scale={scale}>
            <Html distanceFactor={25} center className="pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-mono whitespace-nowrap text-white">
                {node.id}
              </div>
            </Html>
          </mesh>
        )
      })}

      {(data.links || []).map((link: any, i: number) => {
        const sourceNode = nodes.find((n: any) => n.id === link.source)
        const targetNode = nodes.find((n: any) => n.id === link.target)
        
        if (!sourceNode || !targetNode) return null

        const points = [sourceNode.position, targetNode.position]
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points)

        return (
          // @ts-ignore
          <line key={i} geometry={lineGeo} material={lineMat} />
        )
      })}
    </group>
  )
}

export function KnowledgeGraph() {
  const { data, isLoading } = useGraphData()

  return (
    <div className="w-full h-full min-h-[600px] rounded-[2rem] overflow-hidden bg-black/40 border border-white/10 relative shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center text-accent animate-pulse">
          Loading spatial data...
        </div>
      ) : (
        <>
          <div className="absolute top-6 left-6 z-10 bg-black/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <h3 className="font-bold text-lg mb-2">Network Topology</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-critical" /> Critical Hubs</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-warning" /> At Risk</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-ok" /> Healthy</div>
            </div>
          </div>
          <Canvas camera={{ position: [0, 0, 35], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#4F8EF7" />
            <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} maxDistance={60} minDistance={10} />
            <GraphNodes data={data} />
          </Canvas>
        </>
      )}
    </div>
  )
}
