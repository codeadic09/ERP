'use client'

import { useEffect, useRef } from 'react'

export interface Vec2 { x: number; y: number }

export function useMouseParallax(isMobile: boolean) {
  const mouse = useRef<Vec2>({ x: 0, y: 0 })

  useEffect(() => {
    const update = (cx: number, cy: number) => {
      mouse.current = {
        x: cx / window.innerWidth - 0.5,
        y: -(cy / window.innerHeight - 0.5),
      }
    }

    if (isMobile) {
      const onTouch = (e: TouchEvent) => {
        if (e.touches[0]) update(e.touches[0].clientX, e.touches[0].clientY)
      }
      window.addEventListener('touchmove', onTouch, { passive: true })
      return () => window.removeEventListener('touchmove', onTouch)
    }

    const onMouse = (e: MouseEvent) => update(e.clientX, e.clientY)
    window.addEventListener('mousemove', onMouse, { passive: true })
    return () => window.removeEventListener('mousemove', onMouse)
  }, [isMobile])

  return mouse
}
