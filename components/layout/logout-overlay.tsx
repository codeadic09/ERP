"use client"

import { useEffect, useState } from "react"

interface LogoutOverlayProps {
  visible: boolean
}

export function LogoutOverlay({ visible }: LogoutOverlayProps) {
  const [phase, setPhase] = useState<"hidden" | "entering" | "visible" | "exiting">("hidden")

  useEffect(() => {
    if (visible) {
      setPhase("entering")
      const t = setTimeout(() => setPhase("visible"), 50)
      return () => clearTimeout(t)
    } else {
      if (phase !== "hidden") {
        setPhase("exiting")
        const t = setTimeout(() => setPhase("hidden"), 500)
        return () => clearTimeout(t)
      }
    }
  }, [visible])

  if (phase === "hidden") return null

  const opacity = phase === "entering" ? 0 : phase === "exiting" ? 0 : 1

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        opacity,
        transition: "opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: "all",
      }}
    >
      <style>{`
        @keyframes lo-morph {
          0%    { inset: 0    35px 35px 0    }
          12.5% { inset: 0    35px 0    0    }
          25%   { inset: 35px 35px 0    0    }
          37.5% { inset: 35px 0    0    0    }
          50%   { inset: 35px 0    0    35px }
          62.5% { inset: 0    0    0    35px }
          75%   { inset: 0    0    35px 35px }
          87.5% { inset: 0    0    35px 0    }
          100%  { inset: 0    35px 35px 0    }
        }
        @keyframes lo-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lo-dots {
          0%   { content: ""; }
          25%  { content: "."; }
          50%  { content: ".."; }
          75%  { content: "..."; }
        }
        .lo-text::after {
          content: "";
          animation: lo-dots 1.4s steps(4, end) infinite;
        }
        .lo-loader {
          width: 65px;
          aspect-ratio: 1;
          position: relative;
          margin-bottom: 28px;
        }
        .lo-loader::before,
        .lo-loader::after {
          content: "";
          position: absolute;
          border-radius: 50px;
          box-shadow: 0 0 0 3px inset #fff;
          animation: lo-morph 2.5s infinite;
        }
        .lo-loader::after {
          animation-delay: -1.25s;
          border-radius: 0;
        }
      `}</style>

      <div className="lo-loader" />

      <p
        className="lo-text"
        style={{
          color: "#ffffff",
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "0.02em",
          animation: "lo-fade-up 0.5s ease-out 0.15s both",
          margin: 0,
        }}
      >
        Signing out
      </p>

      <p
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 13,
          fontWeight: 400,
          marginTop: 8,
          animation: "lo-fade-up 0.5s ease-out 0.35s both",
        }}
      >
        See you next time!
      </p>
    </div>
  )
}
