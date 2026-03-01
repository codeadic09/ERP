'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Vec2 } from '@/hooks/useMouseParallax'

interface Props {
  scrollRef: React.MutableRefObject<number>
  mouseRef: React.MutableRefObject<Vec2>
  isMobile: boolean
}

export function CameraRig({ scrollRef, mouseRef, isMobile }: Props) {
  const { camera } = useThree()
  const pos = useRef({ x: 0, y: 0, z: 6 })

  useFrame(() => {
    const s = scrollRef.current

    // Scroll → camera pulls back and rises
    const tZ = 6 + s * 4
    const tY = s * 1.2

    // Mouse → subtle lateral offset (desktop only)
    const tX = isMobile ? 0 : mouseRef.current.x * 0.4

    // Lerp - smooth damping
    pos.current.x += (tX - pos.current.x) * 0.04
    pos.current.y += (tY - pos.current.y) * 0.04
    pos.current.z += (tZ - pos.current.z) * 0.04

    camera.position.set(pos.current.x, pos.current.y, pos.current.z)
    camera.lookAt(0, 0, 0)
  })

  return null
}
