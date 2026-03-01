'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

export function useScrollProgress(heroRef: React.RefObject<HTMLElement>) {
  const progress = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined' || !heroRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const trigger = ScrollTrigger.create({
      trigger: heroRef.current,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => { progress.current = self.progress },
    })

    return () => trigger.kill()
  }, [heroRef])

  return progress
}
