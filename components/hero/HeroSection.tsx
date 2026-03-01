'use client'

import dynamic from 'next/dynamic'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight, ChevronRight, Lock, Zap, Star,
  Sparkles, GraduationCap,
} from 'lucide-react'
import { useDeviceCapability } from '@/hooks/useDeviceCapability'
import { useMouseParallax } from '@/hooks/useMouseParallax'
import { useScrollProgress } from '@/hooks/useScrollProgress'

// Dynamic import → no SSR for Three.js
const WebGLCanvas = dynamic(
  () => import('./WebGLCanvas').then((m) => m.WebGLCanvas),
  { ssr: false, loading: () => null }
)

// CSS-only fallback for low-end devices
function StaticHeroBg() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 20% 50%, rgba(29,78,216,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 40%, rgba(217,70,239,0.10) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 50% 90%, rgba(81,162,255,0.08) 0%, transparent 50%)
        `,
      }}
    />
  )
}

interface HeroSectionProps {
  isMobile: boolean
  isTablet: boolean
}

export function HeroSection({ isMobile, isTablet }: HeroSectionProps) {
  const heroRef    = useRef<HTMLElement>(null!)
  const cap        = useDeviceCapability()
  const mouseRef   = useMouseParallax(isMobile)
  const scrollRef  = useScrollProgress(heroRef)

  // Track scroll for fixed-canvas opacity fade
  const [canvasOpacity, setCanvasOpacity] = useState(1)
  useEffect(() => {
    function onScroll() {
      if (!heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      const heroH = rect.height
      const scrolled = -rect.top
      // Gentle fade: full opacity in hero, dims to 0.45 as you scroll further
      const fadeStart = heroH * 0.7
      const fadeEnd   = heroH * 3.5
      const minOpacity = 0.45
      if (scrolled <= fadeStart) setCanvasOpacity(1)
      else if (scrolled >= fadeEnd) setCanvasOpacity(minOpacity)
      else setCanvasOpacity(1 - (1 - minOpacity) * ((scrolled - fadeStart) / (fadeEnd - fadeStart)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const kpiCards = [
    { label: 'Attendance', value: '87%',  color: '#51A2FF', trend: '↑ 2%' },
    { label: 'CGPA',       value: '8.4',  color: '#C4B4FF', trend: '↑ 0.2' },
    { label: 'Subjects',   value: '6',    color: '#86efac', trend: 'Active' },
    { label: 'Rank',       value: '#12',  color: '#FDC745', trend: 'Top 15%' },
  ]

  const upcomingItems = [
    { label: 'DSA Lecture',      time: 'Today 10:00 AM', color: '#51A2FF' },
    { label: 'Assignment Due',   time: 'Today 11:59 PM', color: '#FF6467' },
    { label: 'End-Sem Results',  time: 'March 5, 2026',  color: '#86efac' },
  ]

  return (
    <section
      ref={heroRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile
          ? '96px 24px 56px'
          : isTablet
          ? '88px 40px 72px'
          : '88px 40px 0 40px',
        overflow: 'hidden',
        // Dark hero — distinct from the light sections below
        background: 'linear-gradient(160deg, #020817 0%, #0d1224 55%, #080c18 100%)',
      }}
    >
      {/* ── WebGL Layer (fixed — stays centered on scroll) ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: canvasOpacity,
          transition: 'opacity 0.05s linear',
          willChange: 'opacity',
        }}
      >
        {cap === null ? null : cap.tier === 'low' ? (
          <StaticHeroBg />
        ) : (
          <WebGLCanvas
            capability={cap}
            mouseRef={mouseRef}
            scrollRef={scrollRef}
          />
        )}
      </div>

      {/* ── Subtle grid overlay (CSS, zero JS cost) ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(81,162,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(81,162,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage:
            'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Ambient glow orbs for dimensional lighting ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '15%', left: '10%',
          width: 300, height: 300,
          borderRadius: '50%',
          background: 'rgba(29,78,216,0.08)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '20%', right: '15%',
          width: 250, height: 250,
          borderRadius: '50%',
          background: 'rgba(217,70,239,0.06)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── DOM Content (SEO-safe — stays in HTML) ── */}
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isMobile ? 44 : isTablet ? 48 : 80,
        }}
      >
        {/* Left: Text */}
        <div style={{ flex: 1, maxWidth: isMobile ? '100%' : 520, textAlign: isMobile ? 'center' : undefined }}>

          {/* Badge */}
          <div
            className="hero-anim-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 99,
              marginBottom: isMobile ? 24 : 32,
              background: 'rgba(81,162,255,0.1)',
              border: '1px solid rgba(81,162,255,0.22)',
            }}
          >
            <Sparkles size={11} color="#51A2FF" strokeWidth={2.5} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#51A2FF', letterSpacing: '0.04em' }}>
              NEXT-GEN UNIVERSITY ERP
            </span>
          </div>

          {/* H1 — in DOM for SEO, never inside canvas */}
          <h1
            className="hero-anim-title"
            style={{
              fontSize: isMobile ? 'clamp(26px, 7vw, 36px)' : isTablet ? 44 : 56,
              fontWeight: 900,
              lineHeight: 1.08,
              color: '#F1F5F9',
              marginBottom: isMobile ? 22 : 24,
              letterSpacing: '-0.03em',
            }}
          >
            Manage your{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 30%, #FF7F50 65%, #FF6347 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 40px rgba(14,165,233,0.3)',
              }}
            >
              entire campus
            </span>
            <br />from one place
          </h1>

          <p
            className="hero-anim-desc"
            style={{
              fontSize: isMobile ? 13 : 17,
              color: 'rgba(241,245,249,0.6)',
              lineHeight: 1.7,
              marginBottom: isMobile ? 36 : 44,
              maxWidth: isMobile ? 340 : 460,
              margin: isMobile ? '0 auto 36px' : undefined,
            }}
          >
            UniCore ERP unifies attendance, results, timetables, fees, and
            communications into one sleek, role-based platform — built for
            modern universities.
          </p>

          {/* CTAs */}
          <div
            className="hero-anim-cta"
            style={{
              display: 'flex',
              gap: isMobile ? 12 : 14,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: isMobile ? 36 : 48,
              flexDirection: isMobile ? 'row' : 'row',
              justifyContent: isMobile ? 'center' : undefined,
            }}
          >
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: isMobile ? '11px 20px' : '13px 28px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                color: '#fff',
                fontWeight: 700,
                fontSize: isMobile ? 13 : 15,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(29,78,216,0.30), 0 8px 28px rgba(59,130,246,0.38), 0 16px 48px rgba(29,78,216,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
                width: undefined,
                justifyContent: undefined,
                transition: 'all 0.3s cubic-bezier(.16,1,.3,1)',
              }}
            >
              Get Started Free <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: isMobile ? '11px 20px' : '13px 28px',
                borderRadius: 12,
                background: 'rgba(241,245,249,0.06)',
                border: '1px solid rgba(241,245,249,0.14)',
                color: '#CBD5E1',
                fontWeight: 700,
                fontSize: isMobile ? 13 : 15,
                textDecoration: 'none',
                width: undefined,
                justifyContent: undefined,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
                transition: 'all 0.3s cubic-bezier(.16,1,.3,1)',
              }}
            >
              Sign In <ChevronRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Trust badges */}
          <div
            className="hero-anim-trust"
            style={{ display: 'flex', gap: isMobile ? 14 : 24, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : undefined }}
          >
            {[
              { icon: Lock, text: 'SOC 2 Compliant' },
              { icon: Zap,  text: '99.9% Uptime' },
              { icon: Star, text: '4.9/5 Rating' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <b.icon size={12} color="rgba(148,163,184,0.7)" strokeWidth={2.5} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(148,163,184,0.7)' }}>
                  {b.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Dashboard glass card (desktop/tablet) */}
        {!isMobile && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div
              className="hero-anim-card hero-float"
              style={{
                width: '100%',
                maxWidth: 400,
                background: 'rgba(15,20,40,0.78)',
                backdropFilter: 'blur(32px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
                border: '1px solid rgba(81,162,255,0.16)',
                borderTop: '1px solid rgba(81,162,255,0.25)',
                borderRadius: 24,
                boxShadow: `
                  0 4px 12px rgba(0,0,0,0.20),
                  0 16px 40px rgba(0,0,0,0.35),
                  0 40px 90px rgba(0,0,0,0.45),
                  0 0 0 1px rgba(81,162,255,0.08),
                  0 0 60px rgba(81,162,255,0.06),
                  inset 0 1px 0 rgba(81,162,255,0.12)
                `,
                overflow: 'hidden',
              }}
            >
              {/* Top accent bar */}
              <div style={{ height: 3, background: 'linear-gradient(to right, #1D4ED8, #51A2FF, #B795FF, #FF6467)' }} />

              <div style={{ padding: '24px 24px 20px' }}>
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9' }}>Dashboard</p>
                    <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Semester 4 — CSE</p>
                  </div>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: 'linear-gradient(135deg, #86efac, #4ade80)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(134,239,172,0.3)',
                  }}>
                    <GraduationCap size={15} color="#14532d" />
                  </div>
                </div>

                {/* KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {kpiCards.map((k, i) => (
                    <div key={i} style={{
                      padding: '12px 14px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderTop: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}>
                      <p style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginBottom: 5, letterSpacing: '0.03em' }}>
                        {k.label}
                      </p>
                      <p style={{ fontSize: 20, fontWeight: 900, color: '#F1F5F9', lineHeight: 1 }}>
                        {k.value}
                      </p>
                      <p style={{ fontSize: 10, color: k.color, fontWeight: 700, marginTop: 5 }}>
                        {k.trend}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Attendance bars */}
                <div style={{
                  padding: 14, borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderTop: '1px solid rgba(255,255,255,0.10)',
                  marginBottom: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 10 }}>
                    Attendance Trend
                  </p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 48 }}>
                    {[65, 72, 80, 75, 87, 84, 90].map((h, i) => (
                      <div
                        key={i}
                        className="hero-bar hero-bar-hover"
                        style={{
                          flex: 1,
                          borderRadius: '3px 3px 0 0',
                          background: i === 6
                            ? 'linear-gradient(to top, #1D4ED8, #51A2FF)'
                            : 'rgba(81,162,255,0.15)',
                          height: `${h}%`,
                          animationDelay: `${0.8 + i * 0.07}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Upcoming */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {upcomingItems.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderTop: '1px solid rgba(255,255,255,0.10)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: item.color, flexShrink: 0,
                        boxShadow: `0 0 6px ${item.color}80`,
                      }} />
                      <p style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 600, flex: 1 }}>{item.label}</p>
                      <p style={{ fontSize: 10, color: '#475569', fontWeight: 500 }}>{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
