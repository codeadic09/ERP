'use client'

import { useEffect, useState } from 'react'

export type Tier = 'low' | 'mid' | 'high'

export interface DeviceCapability {
  tier: Tier
  isMobile: boolean
  dpr: number
  particleCount: number
  geoDetail: number        // icosahedron subdivisions
  enableShaders: boolean   // MeshStandard vs MeshBasic
  enableParticles: boolean
}

function assess(): DeviceCapability {
  const nav = navigator as any
  const isMobile = window.innerWidth < 768
  const memory: number = nav.deviceMemory ?? 4
  const cores: number = nav.hardwareConcurrency ?? 4
  const conn: string = nav.connection?.effectiveType ?? '4g'

  const isLow =
    conn === '2g' || conn === 'slow-2g' ||
    (isMobile && memory <= 1) ||
    cores <= 2

  const isHigh = !isMobile && cores >= 8 && memory >= 8
  const tier: Tier = isLow ? 'low' : isHigh ? 'high' : 'mid'

  return {
    tier,
    isMobile,
    dpr: Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2),
    particleCount: tier === 'low' ? 0 : isMobile ? 80 : tier === 'high' ? 500 : 260,
    geoDetail: tier === 'low' ? 0 : isMobile ? 1 : 2,
    enableShaders: !isMobile && tier !== 'low',
    enableParticles: tier !== 'low',
  }
}

export function useDeviceCapability(): DeviceCapability | null {
  const [cap, setCap] = useState<DeviceCapability | null>(null)
  useEffect(() => setCap(assess()), [])
  return cap
}
