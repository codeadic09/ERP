"use client"

import { useEffect, useState } from "react"

/**
 * Full-screen loading overlay with bouncing-ball animation.
 * Shows for at least 400ms to avoid a flash, then fades out.
 */
export function LoadingOverlay({ visible = false }: { visible?: boolean }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
    } else if (show) {
      // small delay so you always see the animation briefly
      const t = setTimeout(() => setShow(false), 300)
      return () => clearTimeout(t)
    }
  }, [visible])

  if (!show) return null

  return (
    <div
      className="loading-overlay"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.25s ease" }}
    >
      <div className="loader" />
    </div>
  )
}
