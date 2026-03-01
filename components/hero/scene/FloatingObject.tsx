'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec2 } from '@/hooks/useMouseParallax'

interface Props {
  mouseRef: React.MutableRefObject<Vec2>
  detail: number
  enableShaders: boolean
  isMobile: boolean
}

export function FloatingObject({ mouseRef, detail, enableShaders, isMobile }: Props) {
  const meshRef  = useRef<THREE.Mesh>(null!)
  const groupRef = useRef<THREE.Group>(null!)
  const targetRot = useRef({ x: 0, y: 0 })
  const intro = useRef({ started: false, startTime: 0 })

  useFrame(({ clock }) => {
    if (!meshRef.current || !groupRef.current) return
    const t = clock.elapsedTime

    // Entrance animation — smooth scale + slide over 2s
    if (!intro.current.started) {
      intro.current.started = true
      intro.current.startTime = t
      groupRef.current.scale.set(0.01, 0.01, 0.01)
    }
    const elapsed = t - intro.current.startTime
    const introDur = 2.0
    const p = Math.min(elapsed / introDur, 1)
    // Smooth ease-out quint for buttery feel
    const ease = 1 - Math.pow(1 - p, 5)

    // Scale: 0.01 → 1
    const s = 0.01 + ease * 0.99
    groupRef.current.scale.set(s, s, s)

    // Idle rotation (runs from start, scaled by ease so it ramps in gently)
    meshRef.current.rotation.x += 0.0018 * ease
    meshRef.current.rotation.y += 0.0025 * ease

    // Mouse/touch parallax (ramps in with intro)
    targetRot.current.x = mouseRef.current.y * 0.28 * ease
    targetRot.current.y = mouseRef.current.x * 0.28 * ease

    groupRef.current.rotation.x +=
      (targetRot.current.x - groupRef.current.rotation.x) * 0.045
    groupRef.current.rotation.y +=
      (targetRot.current.y - groupRef.current.rotation.y) * 0.045

    // Position: slide up from -2.2 → -0.7, then bob gently
    const slideOffset = -1.5 * (1 - ease)
    const bob = Math.sin(t * 0.45) * 0.1 * ease
    groupRef.current.position.y = -0.7 + slideOffset + bob
  })

  return (
    <group ref={groupRef} position={[0, -0.7, 0]}>

      {/* Solid core */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.1, detail]} />
        {enableShaders ? (
          <meshStandardMaterial
            color="#09090f"
            emissive="#1D4ED8"
            emissiveIntensity={0.2}
            metalness={0.92}
            roughness={0.12}
          />
        ) : (
          <meshBasicMaterial color="#1a1a3e" transparent opacity={0.7} />
        )}
      </mesh>

      {/* Wireframe shell - slightly larger */}
      <mesh>
        <icosahedronGeometry args={[1.14, detail]} />
        <meshBasicMaterial
          color="#51A2FF"
          wireframe
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Orbit ring - desktop only */}
      {!isMobile && enableShaders && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.85, 0.007, 6, 80]} />
            <meshBasicMaterial color="#51A2FF" transparent opacity={0.22} />
          </mesh>
          <mesh rotation={[Math.PI / 3, Math.PI / 5, 0]}>
            <torusGeometry args={[2.1, 0.005, 4, 80]} />
            <meshBasicMaterial color="#B795FF" transparent opacity={0.12} />
          </mesh>
        </>
      )}

      {/* Scene lighting for metallic reflections */}
      <pointLight color="#1D4ED8" intensity={enableShaders ? 3 : 1.5} distance={7} />
      <pointLight
        color="#D946EF"
        intensity={enableShaders ? 1.5 : 0.8}
        distance={9}
        position={[-2, 2, -1]}
      />
    </group>
  )
}
