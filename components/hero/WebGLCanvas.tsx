'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, Preload } from '@react-three/drei'
import type { DeviceCapability } from '@/hooks/useDeviceCapability'
import type { Vec2 } from '@/hooks/useMouseParallax'
import { ParticleField } from './scene/ParticleField'
import { FloatingObject } from './scene/FloatingObject'
import { CameraRig } from './scene/CameraRig'

interface Props {
  capability: DeviceCapability
  mouseRef: React.MutableRefObject<Vec2>
  scrollRef: React.MutableRefObject<number>
}

export function WebGLCanvas({ capability, mouseRef, scrollRef }: Props) {
  return (
    <Canvas
      dpr={[1, capability.dpr]}
      gl={{
        antialias: capability.tier !== 'low',
        powerPreference: 'high-performance',
        alpha: true,
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 100 }}
      style={{ position: 'absolute', inset: 0 }}
      frameloop="always"
    >
      <ambientLight intensity={0.25} color="#0a0a1e" />
      <directionalLight position={[4, 6, 4]} intensity={0.6} color="#ffffff" />

      <Suspense fallback={null}>
        {capability.enableParticles && (
          <ParticleField count={capability.particleCount} />
        )}

        {capability.tier !== 'low' && (
          <FloatingObject
            mouseRef={mouseRef}
            detail={capability.geoDetail}
            enableShaders={capability.enableShaders}
            isMobile={capability.isMobile}
          />
        )}
      </Suspense>

      <CameraRig
        scrollRef={scrollRef}
        mouseRef={mouseRef}
        isMobile={capability.isMobile}
      />

      {/* Adaptive DPR: auto-reduces pixel ratio when FPS drops */}
      <AdaptiveDpr pixelated />
      <Preload all />
    </Canvas>
  )
}
